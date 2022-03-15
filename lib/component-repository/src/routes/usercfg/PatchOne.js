module.exports = async function (req, res, next) {
  const { configuration } = req;
  const data = req.body;
  delete data._id;
  delete data.createdAt;
  delete data.updatedAt;
  Object.assign(configuration, data);
  await configuration.save();

  res.data = configuration;
  return next();
};
