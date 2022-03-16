const Server = require('../../../../src/Server');
const request = require('supertest');
const mongoose = require('mongoose');
const { expect } = require('chai');
const EventBusMock = require('../../EventBusMock');
const { iam } = require('../virtual-components/__mocks__/iamMiddleware');
const { logger } = require('../virtual-components/__mocks__/logger');
const { insertDatainDb, deleteAllData } = require('../virtual-components/__mocks__/insertData');
const { ObjectId } = mongoose.Types;
const {
  component1,
} = require('../virtual-components/__mocks__/virtualComponentsData');

describe.only('Get User Configuration', () => {
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

  it('should return 404 error, invalid Id', async () => {
    const message = 'Configuration is not found';
    const { body, statusCode } = await request(server.getApp())
      .get(`/user-cfg/7da8sgdsad8agsadu`)
      .set('Authorization', 'permitToken');
      console.log("bod",body, statusCode)
    expect(body.errors).length(1);
    expect(body.errors[0].message).to.equal(message);
    expect(statusCode).to.equal(404);
  });
  it('should return 200, returns the user configuration', async () => {
    const { statusCode } = await request(server.getApp())
      .get(`/user-cfg/${component1._id}`)
      .set('Authorization', 'permitToken');
    expect(statusCode).to.equal(200);
  });
});
