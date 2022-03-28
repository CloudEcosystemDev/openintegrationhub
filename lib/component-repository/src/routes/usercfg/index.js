const { Router } = require('express');
const asyncHandler = require('express-async-handler');
const bodyParser = require('body-parser').json();

const UserConfiguration = require('../../models/UserConfiguration');

async function loadConfiguration(req, res, next) {
  const configuration = await UserConfiguration.findOne({
    userId: req.user.sub,
    componentId: req.params.componentId,
  });

  if (configuration && req.method === 'POST') {
    return res.status(400).send({
      errors: [
        { message: 'This user configuration has already been set.', code: 400 },
      ],
    });
  }
  if (!configuration && req.method !== 'POST') {
    return res.status(404).send({
      errors: [{ message: 'Configuration is not found', code: 404 }],
    });
  }
  req.configuration = configuration;
  return next();
}

module.exports = ({ iam }) => {
  const Create = asyncHandler(require('./Create'));
  const GetOne = asyncHandler(require('./GetOne'));
  const PatchOne = asyncHandler(require('./PatchOne'));
  const GetList = asyncHandler(require('./GetList'));
  const router = Router();
  router.use(asyncHandler(iam.middleware));
  router.use((req, res, next) => {
    req.logger.trace({ user: req.user }, 'Resolved IAM user');
    return next();
  });

  router.post('/:componentId', loadConfiguration, bodyParser, Create);
  router.get('/:componentId', loadConfiguration, GetOne);
  router.get('/', GetList);
  router.patch('/:componentId', loadConfiguration, bodyParser, PatchOne);

  return router;
};
