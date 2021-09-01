const express = require('express');
const Logger = require('@basaas/node-logger');
const authMiddleware = require('../util/auth');
const CONSTANTS = require('./../constants/index');
const CONF = require('./../conf');
const AccountDAO = require('../dao/accounts');
const Account = require('../models/account');

const TokenUtils = require('./../util/tokens');

const router = express.Router();
const logger = Logger.getLogger(`${CONF.general.loggingNameSpace}/general`, {
    level: 'debug',
});

const endUserPermissions = [
    'flows.read',
    'flows.create',
    'flows.update',
    'flows.delete',
    'icenter.read',
    'secrets.create',
    'secrets.read',
    'secrets.delete',
    'templates.read',
    'components.read',
];

const impersonateLogin = async (req, res, next) => { 
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
    }

    authMiddleware.logIn(req, next, user, {
        username: req.body.username,
        tenant: req.user.tenant,
        canLogin: false,
    });
};

router.post('/', impersonateLogin, async (req, res, next) => {
    if (!req.user) {
        return next({ status: 401, message: CONSTANTS.ERROR_CODES.NOT_LOGGED_IN });
    }

    // TODO: should normal users always receive a token? Is that token long living?
    const tokenObj = await TokenUtils.sign(req.user);
    req.headers.authorization = `Bearer ${tokenObj.token}`;
    res.status(200).send({ token: tokenObj.token, id: tokenObj._id });
});

module.exports = router;
