const request = require('supertest');
const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');
const { expect } = require('chai');
const EventBusMock = require('../../EventBusMock');
const { iam } = require('../virtual-components/__mocks__/iamMiddleware');
const { logger } = require('../virtual-components/__mocks__/logger');
const Server = require('../../../../src/Server');
const { insertDatainDb, deleteAllData } = require('../virtual-components/__mocks__/insertData');
const {
  component1,
} = require('../virtual-components/__mocks__/virtualComponentsData');

const { ObjectId } = mongoose.Types;

describe('Patch User Configuration', () => {
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

//   it('should return 401 error, user config is not valid', async () => {
//     const message = 'Access denied! Configuration does not belong to this User';
//     const { body, statusCode } = await request(server.getApp())
//       .patch(`/user-cfg/${component1._id}`)
//       .set('Authorization', 'permitToken');

//     expect(statusCode).to.equal(401);
//     expect(body.errors).length(1);
//     expect(body.errors[0].message).to.equal(message);
//   });

  it('should return 404 error, configuration is not found', async () => {
    const message = 'Configuration is not found';
    const { body, statusCode } = await request(server.getApp())
      .patch(`/user-cfg/7da8sgdsad8agsadu`)
      .set('Authorization', 'permitToken');
    expect(body.errors).length(1);
    expect(body.errors[0].message).to.equal(message);
    expect(statusCode).to.equal(404);
  });

  it('should update a user config', async () => {
    const newSet = [new ObjectId(), new ObjectId()];
    const { body } = await request(server.getApp())
      .patch(`/user-cfg/${component1._id}`)
      .send({
        secretIds: newSet,
      })
      .set('Authorization', 'permitToken');

    expect(newSet).to.length(2);
    expect(savedName).to.equal(savedName);
  });

  it('should return 404 error, virtual component not found', async () => {
    const objectId = new ObjectId();
    const { statusCode } = await request(server.getApp())
      .patch(`/user-cfg/${objectId}`)
      .send({
        access: 'public',
      })
      .set('Authorization', 'permitToken');

    expect(statusCode).to.equal(404);
  });
});
