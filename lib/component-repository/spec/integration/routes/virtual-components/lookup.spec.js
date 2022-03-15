const Server = require('../../../../src/Server');
const request = require('supertest');
const { expect } = require('chai');
const EventBusMock = require('../../EventBusMock');
const { iam } = require('./__mocks__/iamMiddleware');
const { logger } = require('./__mocks__/logger');
const { insertDatainDb, deleteAllData } = require('./__mocks__/insertData');
const {
  virtualComponent2,
} = require('./__mocks__/virtualComponentsData');

describe('Lookup on Component', () => {
  let server;

  beforeEach(async () => {
    const eventBus = new EventBusMock();
    const config = {
      get(key) {
        return this[key];
      },
      MONGODB_URI: process.env.MONGODB_URI
        ? process.env.MONGODB_URI
        : 'mongodb://localhost/test',
    };

    server = new Server({ config, logger, iam, eventBus });
    await server.start();
    await insertDatainDb();
  });

  afterEach(async () => {
    await deleteAllData();
    await server.stop();
  });

  it('should return lookup component', async () => {
    const { statusCode, body } = await request(server.getApp())
      .post(
        `/lookup/${virtualComponent2._id}`
      )
      .send({
        actionName: 'getSolutions'
      })
      .set('Authorization', 'permitToken');
      expect(statusCode).to.equal(200);
  });

})