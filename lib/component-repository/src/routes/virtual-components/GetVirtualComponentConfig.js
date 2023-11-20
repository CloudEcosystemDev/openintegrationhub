const VirtualComponent = require('../../models/VirtualComponent');
const ComponentConfig = require('../../models/ComponentConfig');

module.exports = async function (req, res) {
  //const { user } = req;
  const { user, virtualComponent } = req;
  const componentVersionId = req.params.componentVersionId;

  let configQuery = user.isAdmin
    ? {}
    : {
        $and: [
          {
            tenant: user.tenant,
          },
          {
            componentVersionId: componentVersionId || virtualComponent.defaultVersionId,
          },
        ],
      };

  const componentConfig = await ComponentConfig.findOne(configQuery)
    .lean()
    .exec();

  return res.send({
    data: componentConfig,

  });
};
