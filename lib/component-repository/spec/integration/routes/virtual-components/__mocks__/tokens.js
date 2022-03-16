const config = require('../../../../../src/config');

const tenantId = '60f922418ced69c612df63ff';
const tenantWithoutComponents = '60f922418ced69c612df63fg';
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const permUserId = new ObjectId();
module.exports = {
  tenantId,
  adminToken: {
    token: 'adminToken',
    value: {
      sub: 'TestAdmin',
      username: 'admin@example.com',
      role: 'ADMIN',
      permissions: ['all'],
      iat: 1337,
      isAdmin: true,
    },
  },
  permUserId,
  permitToken: {
    token: 'permitToken',
    value: {
      sub: permUserId,
      username: 'admin@example.com',
      permissions: [
        config.componentsCreatePermission,
        config.componentsUpdatePermission,
        config.componentDeletePermission,
        config.componentWritePermission,
      ],
      tenant: tenantId,
      iat: 1337,
    },
  },

  unpermitToken: {
    token: 'unpermitToken',
    value: {
      sub: 'UnpermitGuy',
      username: 'guest@example.com',
      tenant: tenantId,
      permissions: ['müsli.riegel', 'schoko.riegel'],
      iat: 1337,
    },
  },

  partpermitToken: {
    token: 'partpermitToken',
    value: {
      sub: 'PartpermitGuy',
      username: 'guest@example.com',
      tenant: tenantId,
      permissions: [
        config.componentsCreatePermission,
        config.componentsUpdatePermission,
      ],
      iat: 1337,
    },
  },

  otherTenantToken: {
    token: 'otherTenantToken',
    value: {
      sub: 'OtherTenantToken',
      username: 'guest@example.com',
      tenant: tenantWithoutComponents,
      permissions: [
        config.componentsCreatePermission,
        config.componentsUpdatePermission,
      ],
      iat: 1337,
    },
  },
};
