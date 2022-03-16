module.exports = async function (req, res, next) {
  const { configuration } = req;
  res.data = configuration;
  res.statusCode = 200;
  return next();
};
