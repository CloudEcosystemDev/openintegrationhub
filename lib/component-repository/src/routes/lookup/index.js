const express = require('express');
const asyncHandler = require('express-async-handler');
const fetch = require('node-fetch');
const { Router } = express;
const bodyParser = require('body-parser').json();
const getLookup = async (req, res, next) => {
  console.log('Params response: ', req.params);
  console.log('Body: ', req.body);
  const { id } = req.params;
  const data = await fetch(
    `http://global-${id}-service.flows.svc.cluster.local:3001/process`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: req.headers['authorization'],
      },
      body: JSON.stringify(req.body),
    }
  );
  const dataResponse = await data.json();
  console.log('Data response: ', dataResponse);
  console.log('Status response', data.status);
  res.statusCode = 200;

  // response [{ _id, description, createdAt}]

  // return {id: _id, name: description}

  return res.send({
    data: dataResponse,
    meta: {},
  });
};
module.exports = ({ iam }) => {
  const { can } = iam;
  // console.log(iam)
  const router = Router();
  router.use(asyncHandler(iam.middleware));
  router.use((req, res, next) => {
    req.logger.trace({ user: req.user }, 'Resolved IAM user');
    return next();
  });
  router.post('/:id', bodyParser, getLookup);
  return router;
};
