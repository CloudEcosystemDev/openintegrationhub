const UserConfiguration = require('../../models/UserConfiguration');

module.exports = async function (req, res, next) {
  console.log("here I reached")
  const configurations = await UserConfiguration.find({ userId: req.user.sub }).lean();
  console.log(configurations)
  res.data = configurations;
  return next();
};
