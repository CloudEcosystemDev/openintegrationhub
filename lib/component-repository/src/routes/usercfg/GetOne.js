module.exports = async function (req, res, next) {
  const { configuration } = req;
  res.data = configuration;
  return next();
};
