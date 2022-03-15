const UserConfiguration = require('../../models/UserConfiguration');

module.exports = async function (req, res, next) {
  const { body } = req;
  const data = body;
  delete data._id;

  res.data = await UserConfiguration.create(data);
  res.statusCode = 201;

  return next();
};
