const logger = require('@basaas/node-logger');
const { isOwnerOf } = require('@openintegrationhub/iam-utils');
const conf = require('../../conf');

const log = logger.getLogger(`${conf.log.namespace}/auth`);
const SecretDAO = require('../../dao/secret');
const AuthClientDAO = require('../../dao/auth-client');

async function userIsOwnerOf(dao, req, res, next, allTenantUsers = false) {
    // TODO check for type as well
    try {
        const doc = await dao.findOne({
            _id: req.params.id,
        });

        if (!doc) {
            return next({ status: 404 });
        }
        const userHasAccess = isOwnerOf({
            allTenantUsers,
            entity: doc,
            user: req.user,
        });

        if (userHasAccess) {
            req.obj = doc;
            return next();
        }
        return next({ status: 403 });
    } catch (err) {
        err.__errName = 'userIsOwnerOf';
        log.error(err);
        next({ status: 401 });
    }
}

module.exports = {
    async userIsOwnerOfSecret(req, res, next) {
        await userIsOwnerOf(SecretDAO, req, res, next);
    },

    async userIsOwnerOfAuthClient(req, res, next) {
        await userIsOwnerOf(AuthClientDAO, req, res, next);
    },
    async userIsInEntityTenant(dao, req, res, next) {
        await userIsOwnerOf(dao, req, res, next, true);
    },
};
