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
    flowsEvents[indexFlow].response.write(`data: ${JSON.stringify({ status: 'success' })}\n\n`);
});

router.get('/:flowId', async (req, res, next) => {
    try {
        const headers = {
            'Content-Type': 'text/event-stream',
            Connection: 'keep-alive',
            'Cache-Control': 'no-cache',
        };
        res.writeHead(200, headers);

        const data = `data: ${JSON.stringify({ status: 'listen' })}\n\n`;

        res.write(data);

        const { flowId } = req.params;

        const indexFlow = getFlowIndex(flowId);
        const flow = indexFlow > -1 ? flowsEvents[indexFlow] : {
            id: flowId,
            response: res,
        };

        if (indexFlow === -1) {
            flowsEvents.push(flow);
        }

        req.on('close', () => {
            log.info(`${flowId} Connection closed`);
            const indexFlow = getFlowIndex(flowId);
            flowsEvents.splice(indexFlow, 1);
            log.info(`Flows events: ${JSON.stringify(flowsEvents)}`);
        });
        return res;
    } catch (err) {
        log.error(err);
        next({
            status: 400,
            message: err.message || err,
        });
    }
});

module.exports = router;
