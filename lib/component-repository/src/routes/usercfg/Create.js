const UserConfiguration = require('../../models/UserConfiguration');

module.exports = async function (req, res, next) {
  const { body, configuration } = req;
  console.log("data1")

  if (configuration) {
    console.log("data2")

    return res.status(400).send({
      errors: [
        { message: 'This user configuration has already been set.', code: 400 },
      ],
    });
  } else {
  const data = new UserConfiguration({
    ...body,
    userId: req.user.sub,
    componentId: req.params.componentId,
  });
  const savedConfig = await data.save();
//   res.statusCode = 201;
  res.send({ data: savedConfig, statusCode: 201 });
}
  return next();
};
