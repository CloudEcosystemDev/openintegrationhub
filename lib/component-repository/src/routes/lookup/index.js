const express = require('express');
const asyncHandler = require('express-async-handler');
const fetch = require('node-fetch');
const config = require('../../config');

const { Router } = express;
const bodyParser = express.json();

const getComponentUrl = (componentId) => {
  return `http://global-${componentId}-${config.flowInternalUrl}/process`;
};

const createToken = async (iamClient, userId) => {
  const { id: tokenId, token } = await iamClient.createToken({
    accountId: userId,
    expiresIn: -1,
    description: 'Created by Component Repository to fetch the secret',
    forceNew: true,
    customPermissions: ['secrets.secret.readRaw'],
  });

  return { tokenId, token };
};

const deleteToken = (iamClient, tokenId) => {
  return iamClient.deleteTokenById(tokenId);
};

const getLookup = async (req, res) => {
  const { id } = req.params;
  const { iamClient, user } = req;

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

  const { tokenId, token } = await createToken(iamClient, user.sub);
  let tokenDeleted = false;

  try {
    const data = await fetch(getComponentUrl(id), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    await deleteToken(iamClient, tokenId);
    tokenDeleted = true;

    const dataResponse = await data.json();
    res.statusCode = 200;

    return res.send({
      data: dataResponse,
    });
  } catch (error) {
    if (!tokenDeleted) {
      await deleteToken(iamClient, tokenId);
    }
    return res
      .status(400)
      .send({ errors: [{ message: error.message, code: 400 }] });
  }
};
module.exports = ({ iam }) => {
  const { can, createClient } = iam;

  const router = Router();
  router.use(asyncHandler(iam.middleware));
  router.use((req, _, next) => {
    req.logger.trace({ user: req.user }, 'Resolved IAM user');
    req.iamClient = createClient({});
    return next();
  });
  router.post('/:id', can(config.component), bodyParser, getLookup);
  return router;
};
