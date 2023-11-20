const express = require('express');
const Logger = require('@basaas/node-logger');
const authMiddleware = require('../util/auth');
const CONSTANTS = require('../constants/index');
const CONF = require('../conf');
const AccountDAO = require('../dao/accounts');
const Account = require('../models/account');
const TenantDAO = require('../dao/tenants');

const TokenUtils = require('../util/tokens');

const router = express.Router();
const logger = Logger.getLogger(`${CONF.general.loggingNameSpace}/general`, {
    level: 'debug',
});
const compRepoUrl = CONF.general.componentRepositoryUrl;

const endUserPermissions = [
    'flows.read',
    'tenant.flows.update', // flows.write
    'flows.update',
    'flows.delete',
    'flows.control',
    'icenter.read',
    'icenter.write',
    'secrets.create',
    'secrets.read',
    'secrets.delete',
    'templates.read',
    'components.read',
    'components.write', // to get lookups data
];

const impersonateLogin = async (req, res, next) => {
    logger.info('In impersonate middleware...');

    if (!req.user.tenant) {
        return next({ status: 401, message: 'You have to belong to a tenant' });
    }

    let user = await Account.findOne({
        username: req.body.username,
        tenant: req.user.tenant,
    });

    if (!user) {
        const userObj = {
            username: req.body.username,
            roles: [],
            permissions: endUserPermissions,
            canLogin: false,
            password: 'integration-center',
            tenant: req.user.tenant,
        };

        try {
            user = await AccountDAO.create({
                userObj,
            });
        } catch (error) {
            logger.error(JSON.stringify(error));
            return next({ status: 500, message: 'Internal Server Error' });
        }

        // create new Secret if a default credential has been passed
        if (req.body.credential) {
            try {
                //get tenant config
                const tenant = await TenantDAO.findOne({
                    _id: req.user.tenant
                });
                const defaultComponent = tenant.settings?.find((element) => element.key==="defaultComponent")?.value;
                    
                    if (defaultComponent) {
                        //POST secret to /secrets endpoint with auth client
                        //${CONF.general.secretServiceUrl}
                        const componentInfo = await fetch(`${compRepoUrl}/virtual-components/${defaultComponent}`);
                        const versionInfo = await fetch(`${compRepoUrl}/virtual-components/${defaultComponent}/${componentInfo.data.defaultVersionId}`);
                        const {authType} = versionInfo.data?.authorization;
                        let secret_body = {...req.body.credential,owners: [{type:'user',id:user._id}]};

                        if (authType === 'OA2_AUTHORIZATION_CODE' || authType === 'SESSION_AUTH') {
                            //get auth client info for OAuth from Tenant Config
                            const authClientInfo = await fetch(`${compRepoUrl}/virtual-components/${defaultComponent}/${componentInfo.data.defaultVersionId}/config`);
                            secret_body.authClient = authClientInfo?.data?.authClientId;
                        }
                        /*if (authType === 'SESSION_AUTH') {
                            //get auth client from ComponentConfig above
                        }*/

                        const endpoint = `${CONF.general.secretServiceUrl}/secrets`;
                        const method = 'POST';
                        const response = await fetch(endpoint, {
                            method: method,
                            body: secret_body
                        });
                        if (response.data?._id && authType !== 'OA2_AUTHORIZATION_CODE') {
                            //With auth types not equal to OAuth, POST the secret to the userConfig in the component-repository
                            const config = {
                                ...req.body.credential, 
                                owners: [{type:'user',id:user._id}],
                                authClient: tenant.settings?.defaultAuth?.authClient
                            };
                            const componentConfigEndpoint = `${compRepoUrl}/user-cfg`;
                            //If no user config exists, create one using POST, otherwise, add new one via PUT
                            const checkConfig = await fetch(`${componentConfigEndpoint}/${defaultComponent}`);
                            if (checkConfig.status === 404) {
                                await fetch(componentConfigEndpoint, {
                                    method: 'POST',
                                    body: {
                                        secretIds: [response.data?._id],
                                    },
                                });
                            } else {
                                await fetch(`${componentConfigEndpoint}/${defaultComponent}`, {
                                    method: 'PUT',
                                    body: {
                                        secretIds: [response.data?._id],
                                    },
                                });
                            }
                        }
                        
                    }
                } catch (error) {
                logger.error(JSON.stringify(error));
                //return next({ status: 500, message: 'Could not Create Default Credential' });
            }
        }
    }

    authMiddleware.logIn(req, next, user, {
        username: req.body.username,
        tenant: req.user.tenant,
        canLogin: false,
    });
};

router.post('/', impersonateLogin, async (req, res, next) => {
    logger.info('In impersonate endpoint...');
    if (!req.user) {
        return next({ status: 401, message: CONSTANTS.ERROR_CODES.NOT_LOGGED_IN });
    }

    // TODO: should normal users always receive a token? Is that token long living?
    const tokenObj = await TokenUtils.sign(req.user);
    req.headers.authorization = `Bearer ${tokenObj.token}`;
    res.status(200).send({ token: tokenObj.token, id: tokenObj._id });
});

module.exports = router;
