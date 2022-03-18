const Server = require('../../../../src/Server');
const request = require('supertest');
const mongoose = require('mongoose');
const { expect } = require('chai');
const EventBusMock = require('../../EventBusMock');
const { iam } = require('../virtual-components/__mocks__/iamMiddleware');
const { logger } = require('../virtual-components/__mocks__/logger');
const { insertDatainDb, deleteAllData } = require('../virtual-components/__mocks__/insertData');
const { ObjectId } = mongoose.Types;
const { component1, component3, user2Id, component2 } = require('../virtual-components/__mocks__/virtualComponentsData');

describe.only('Create User Configuration', () => {
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

  it('should return 400 error, user is already set', async () => {
    const message = 'This user configuration has already been set.';
    const { body, statusCode } = await request(server.getApp())
      .post(
        `/user-cfg/${component1._id}`
      )
      .send({
        secretIds: [new ObjectId(), new ObjectId()],
      })
      .set('Authorization', 'permitToken');

    expect(statusCode).to.equal(400);
    expect(body.errors).length(1);
    expect(body.errors[0].message).to.equal(message);
  });

  it('should return 201 message, created the user config', async () => {
      const secretsForCall = [new ObjectId(),new ObjectId()];

    const { body, statusCode } = await request(server.getApp())
      .post(
        `/user-cfg/${component3._id}`
      )
      .send({
        secretIds: secretsForCall,
        configuration: {
          otherServer: "https://myserver.staffomatic.com"
        }
      })
      .set('Authorization', 'permitToken');
      console.log("body",statusCode)
    expect(statusCode).to.equal(201);
  });
});
