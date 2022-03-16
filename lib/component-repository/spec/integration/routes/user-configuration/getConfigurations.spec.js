const Server = require('../../../../src/Server');
const request = require('supertest');
const { expect } = require('chai');
const EventBusMock = require('../../EventBusMock');
const { iam } = require('../virtual-components/__mocks__/iamMiddleware');
const { logger } = require('../virtual-components/__mocks__/logger');
const { insertDatainDb, deleteAllData } = require('../virtual-components/__mocks__/insertData');

describe.only('Get Configurations', () => {
  let server;

  beforeEach(async () => {
    const eventBus = new EventBusMock();
    const config = {
      get(key) {
        return this[key];
      },
      MONGODB_URI: process.env.MONGODB_URI
        ? process.env.MONGODB_URI
        : 'mongodb://admin:admin@localhost:27017/?authSource=admin',
    };

    server = new Server({ config, logger, iam, eventBus });
    await server.start();
    await insertDatainDb();
  });

  afterEach(async () => {
    await deleteAllData();
    await server.stop();
  });

  it('should return 1 configuration to the permitToken user', async () => {
    const { body, statusCode } = await request(server.getApp())
      .get('/user-cfg')
      .set('Authorization', 'permitToken');

    expect(body.data).lengthOf(1);
    expect(statusCode).to.equal(200);
  });

});
