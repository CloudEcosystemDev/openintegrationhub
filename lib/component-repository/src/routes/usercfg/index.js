const { Router } = require('express');
const asyncHandler = require('express-async-handler');
const bodyParser = require('body-parser').json();

const UserConfiguration = require('../../models/UserConfiguration');

async function loadConfiguration(req, res, next) {
  const configuration = await UserConfiguration.findOne({ userId: req.user.pub, componentId: req.params.componentId  });

  if (!configuration) {
    const error = new Error('Configuration is not found');
    error.statusCode = 404;
    throw error;
  }
  if (configuration.userId !== req.user) {
    const error = new Error(
      'Access denied! Configuration does not belong to this User'
    );
    error.statusCode = 401;
    throw error;
  }
  req.configuration = configuration;

  return next();
}
 
module.exports = ({ iam }) => {
  const Create = asyncHandler(require('./Create'));
  const GetOne = asyncHandler(require('./GetOne'));
  const PatchOne = asyncHandler(require('./PatchOne'));

  const router = Router();
  router.use(asyncHandler(iam.middleware));
  router.use((req, res, next) => {
    req.logger.trace({ user: req.user }, 'Resolved IAM user');
    return next();
  });

  router.post('/:componentId', bodyParser, Create);
  router.get('/:componentId', loadConfiguration, GetOne);
  router.patch(
    '/:componentId',
    loadConfiguration,
    bodyParser,
    PatchOne
  );

  return router;
};
