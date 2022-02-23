const express = require('express');
const asyncHandler = require('express-async-handler');
const bodyParser = express.json();

const {Router} = express;

const getLookup = (req, res, next) => {


}

module.exports = ({ iam }) => {
    const { can } = iam;

    const router = Router();
    router.use(asyncHandler(iam.middleware));
    router.use((req, res, next) => {
        req.logger.trace({user: req.user}, 'Resolved IAM user');
        return next();
    });

    router.get('/:id', getLookup);

    return router;
};