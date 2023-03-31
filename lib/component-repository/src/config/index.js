const configuration = {
    componentsCreatePermission: process.env.COMPONENT_CREATE_PERMISSION || 'components.create',
    componentsUpdatePermission: process.env.COMPONENT_UPDATE_PERMISSION || 'components.update',
    componentDeletePermission: process.env.COMPONENT_DELETE_PERMISSION || 'components.delete',
    componentWritePermission: process.env.COMPONENT_WRITE_PERMISSION || 'components.write',
    adminPermission: process.env.ADMIN_PERMISSION || 'all',
    flowInternalUrl: process.env.COMPONENTS_INTERNAL_HOST || 'service.flows.svc.cluster.local:3001',
    maxRequestBodySize: process.env.MAX_REQUEST_BODY_SIZE || '100kb'
};

module.exports = configuration;
