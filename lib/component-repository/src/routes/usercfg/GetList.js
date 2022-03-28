const UserConfiguration = require('../../models/UserConfiguration');

module.exports = async function (req, res, next) {
  const configurations = await UserConfiguration.find({ userId: req.user.sub }).lean();
  res.data = configurations;
  return next();
};
