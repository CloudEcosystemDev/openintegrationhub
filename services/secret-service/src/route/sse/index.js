const express = require('express');
const logger = require('@basaas/node-logger');
const sseEmitter = require('./sseEventEmmiter');

const conf = require('../../conf');

const log = logger.getLogger(`${conf.log.namespace}/callback`, {
    level: conf.log.level,
});

const router = express.Router();

const flowsEvents = [];

const getFlowIndex = (flowId) => flowsEvents.findIndex(({ id }) => id === flowId);

sseEmitter.on('success', (flowId) => {
    const indexFlow = getFlowIndex(flowId);
    if (indexFlow > -1) {
        flowsEvents[indexFlow].response.write(`data: ${JSON.stringify({ status: 'success' })}\n\n`);
    } else {
        // TODO Remove this log
        log.info('Not message sent to this flowId');
        log.info(`All flowsEvents length: ${flowsEvents.length}, flowId: ${flowId}`);
    }
});

router.get('/:flowId', async (req, res, next) => {
    try {
        log.info('Here in route sse');
        const { flowId } = req.params;

        const indexFlow = getFlowIndex(flowId);
        log.info(`Here with index flow ${indexFlow}`);
        const flow = indexFlow > -1 ? flowsEvents[indexFlow] : {
            id: flowId,
            response: res,
        };

        log.info(`Here with flow ${flowId}`);
        if (indexFlow === -1) {
            flowsEvents.push(flow);
        }

        const headers = {
            'Content-Type': 'text/event-stream',
            Connection: 'keep-alive',
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'X-Requested-With',
            'X-Accel-Buffering': 'no',
        };
        res.writeHead(200, headers);
        res.flushHeaders();

        log.info('After flushing headers');

        const data = `data: ${JSON.stringify({ status: 'listen' })}\n\n`;

        res.write(data);

        log.info('After write data');

        req.on('close', () => {
            log.info(`${flowId} Connection closed`);
            const indexFlow = getFlowIndex(flowId);
            if (indexFlow > -1) {
                flowsEvents.splice(indexFlow, 1);
                log.info(`Flows events length: ${flowsEvents.length}`);
            }
            res.end();
        });
    } catch (err) {
        log.error(err);
        next({
            status: 400,
            message: err.message || err,
        });
    }
});

module.exports = router;
