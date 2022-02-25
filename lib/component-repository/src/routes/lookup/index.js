const express = require('express');
const asyncHandler = require('express-async-handler');
const fetch = require('node-fetch');
const {Router} = express;



  module.exports = ({ iam }) => {
    const { can } = iam;        
    console.log(iam)
    const router = Router();
    router.use(asyncHandler(iam.middleware));

    router.use((req, res, next) => {
        req.logger.trace({user: req.user}, 'Resolved IAM user');
        return next();
    });
    router.post('/:id', getLookup);

    return router;
};
const getLookup = async (req, res, next) => {
    const { id } = req.params;
    const data = await fetch(`http://global-${id}-service.platform-beta.svc.cluster.local/api/v1/process`,
    {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: req.headers['authorization'],
        },
        body: JSON.stringify(
          req.body
        ),
      });

    res.send(data)
}