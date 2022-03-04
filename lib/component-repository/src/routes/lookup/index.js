const express = require('express');
const asyncHandler = require('express-async-handler');
const fetch = require('node-fetch');
const config = require('../../config');

const { Router } = express;
const bodyParser = express.json();

const getComponentUrl = (componentId) => {
  return `http://global-${componentId}-${config.flowInternalUrl}/process`;
};

const getLookup = async (req, res) => {
  const { id } = req.params;

  const data = req.body.data || {};
  data.cfg = {
    ...data.cfg,
    nodeSettings: {
      skipSnapshot: true,
    },
  };

  if (!data.operationId) {
    return res.status(400).send({
      errors: [
        { message: 'The property `data.operationId` is required', code: 400 },
      ],
    });
  }

  const body = {
    ...req.body,
    actionName: 'lookup',
    data,
  };

  try {
    const data = await fetch(getComponentUrl(id), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: req.headers['authorization'],
      },
      body: JSON.stringify(body),
    });
    const dataResponse = await data.json();
    res.statusCode = 200;

    return res.send({
      data: dataResponse,
    });
  } catch (error) {
    return res
      .status(400)
      .send({ errors: [{ message: error.message, code: 400 }] });
  }
};
module.exports = ({ iam }) => {
  const { can } = iam;

  const router = Router();
  router.use(asyncHandler(iam.middleware));
  router.use((req, _, next) => {
    req.logger.trace({ user: req.user }, 'Resolved IAM user');
    return next();
  });
  router.post(
    '/:id',
    can(config.componentWritePermission),
    bodyParser,
    getLookup
  );
  return router;
};
