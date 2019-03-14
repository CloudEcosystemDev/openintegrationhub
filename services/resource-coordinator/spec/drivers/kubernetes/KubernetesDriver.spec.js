const KubernetesDriver = require('../../../src/drivers/kubernetes/KubernetesDriver');
const FlowSecret = require('../../../src/drivers/kubernetes/FlowSecret');
const KubernetesRunningFlowNode = require('../../../src/drivers/kubernetes/KubernetesRunningFlowNode');
const sinon = require('sinon');
const chai = require('chai');
chai.use(require('sinon-chai'));
const { expect } = chai;

describe('KubernetesDriver', () => {
    let driver;
    let coreClient;
    let batchClient;

    beforeEach(() => {
        const config = {
            NAMESPACE: 'flows-ns',
            get(key) {
                return this[key];
            }
        };
        const logger = {
            trace: () => {},
            debug: () => {},
            info: () => {},
            warn: () => {},
            error: () => {}
        };

        coreClient = {

        };

        batchClient = {
            jobs: {
                post: () => {}
            }
        };

        const k8s = {
            getCoreClient: () => coreClient,
            getBatchClient: () => batchClient
        };

        sinon.stub(batchClient.jobs, 'post').resolves();

        driver = new KubernetesDriver({config, logger, k8s});
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('#createApp', () => {
        it('should deploy a new app into K8s', async () => {
            const flowSecret = new FlowSecret();
            sinon.stub(driver, '_prepareEnvVars').returns({container: 'env-vars'});
            sinon.stub(driver, '_ensureFlowNodeSecret').resolves(flowSecret);
            sinon.stub(driver, '_createRunningFlowNode').resolves();

            const flow = {id: 'flow1'};
            const node = {id: 'node1'};
            const envVars = {env: 'lololo'};
            await driver.createApp(flow, node, envVars);

            expect(driver._prepareEnvVars).to.have.been.calledOnceWith(flow, node, envVars);
            expect(driver._ensureFlowNodeSecret).to.have.been.calledOnceWith(
                flow,
                node,
                {container: 'env-vars'}
            );
            expect(driver._createRunningFlowNode).to.have.been.calledOnceWith(flow, node, flowSecret);
        });
    });

    describe('#_createRunningFlowNode', () => {
        it('should ', async () => {
            sinon.stub(driver, '_buildDescriptor').returns({kind: 'Job'});
            batchClient.jobs.post.resolves({
                body: {
                    kind: 'Job',
                        metadata: {
                        name: 'new-job'
                    }
                }
            });

            const flow = {id: 'flow1'};
            const node = {id: 'node1'};
            const flowNodeSecret = {id: 'flow-secret'};
            const result = await driver._createRunningFlowNode(flow, node, flowNodeSecret);
            expect(result instanceof KubernetesRunningFlowNode).to.be.true;
            expect(result.name).to.equal('new-job');
        });
    });
});