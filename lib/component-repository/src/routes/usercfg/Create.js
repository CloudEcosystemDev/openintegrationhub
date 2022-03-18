const UserConfiguration = require('../../models/UserConfiguration');

module.exports = async function (req, res, next) {
  const { body } = req;
  
  const data = new UserConfiguration({
    ...body,
    userId: req.user.sub,
    componentId: req.params.componentId,
  });
  const savedConfig = await data.save();
  res.statusCode = 201;
  res.send({ data: savedConfig });

  return next();
};
