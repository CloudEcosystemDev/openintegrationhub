const getPort = require('get-port');
const supertest = require('supertest');
const iamMock = require('../../../test/iamMock');
const conf = require('../../conf');
const Server = require('../../server');

let port;
let request;
let server;

describe('connectors', () => {
    beforeAll(async (done) => {
        port = await getPort();
        request = supertest(`http://localhost:${port}${conf.apiBase}`);
        server = new Server({
            mongoDbConnection: `${global.__MONGO_URI__}-apps`,
            port,
        });
        iamMock.setup();
        await server.start();
        done();
    });

    afterAll(async (done) => {
        await server.stop();
        done();
    });

    test('Create an app', async () => {

        const appData = {
            artifactId: 'com.foobar',
            name: 'FooBarApp',
            dataModels: ['people'],
            connectors: [{
                type: 'adapter',
                name: 'foobar-adapter',
            }, {
                type: 'transformator',
                name: 'foobar-transformator',
            }],
            isGlobal: true,
            urls: {
                main: 'https://example.com/login',
            },
            status: 'ACTIVE',
        };

        const response = await request.post('/apps')
            .set(...global.adminAuth1)
            .send(appData)
            .expect(200);

        await request.post('/apps')
            .set(...global.adminAuth1)
            .send(appData)
            .expect(400);

        const appResp = (await request.get(`/apps/${response.body._id}`)
            .set(...global.adminAuth1)
            .expect(200)).body;
        expect(appResp.artifactId).toEqual(appData.artifactId);
    });

    test('Only authorized admin can create a connector', async () => {
        /* Only Admin can add connectors */
        await request.post('/apps')
            .send({
                name: 'FooApp',
                description: 'test',
                uri: 'https://www.example.com',
                status: 'ACTIVE',
            })
            .expect(401);

        /* Only Admin can add connectors */
        await request.post('/apps')
            .set(...global.userAuth2)
            .send({
                name: 'FooApp',
                description: 'test',
                uri: 'https://www.example.com',
                status: 'ACTIVE',
            })
            .expect(403);
    });

    test('Retrieve all apps', async () => {
        const { body } = await request.get('/apps')
            .set(...global.userAuth1)
            .expect(200);

        expect(body.length).toBe(1);
    });

    test('Modify an app', async () => {
        const appData = {
            artifactId: 'com.foobar2',
            name: 'FooBarApp2',
            dataModels: ['people'],
            connectors: [{
                type: 'adapter',
                name: 'foobar-adapter',
            }, {
                type: 'transformator',
                name: 'foobar-transformator',
            }],
            isGlobal: true,
            urls: {
                main: 'https://example.com/login',
            },
            status: 'ACTIVE',
        };

        const newValues = {
            name: 'FooBarApp2222',
            urls: {
                main: 'https://www.example.com/foo',
            },
            authClient: 'someExternalId',
            status: 'DISABLED',
        };

        const { _id } = (await request.post('/apps')
            .set(...global.adminAuth1)
            .send(appData)
            .expect(200)).body;

        await request.patch(`/apps/${_id}`)
            .set(...global.adminAuth1)
            .send(newValues)
            .expect(200);

        const appResponse = (await request.get(`/apps/${_id}`)
            .set(...global.userAuth1)
            .expect(200)).body;

        expect(appResponse.name).toEqual(newValues.name);
        expect(appResponse.urls.main).toEqual(newValues.urls.main);
        expect(appResponse.status).toEqual(newValues.status);
        expect(appResponse.authClient).toEqual(newValues.authClient);
    });

    test('Remove an app', async () => {

        const appData = {
            artifactId: 'com.foobar3',
            name: 'FooBarApp3',
            isGlobal: true,
        };

        const { _id } = (await request.post('/apps')
            .set(...global.adminAuth1)
            .send(appData)
            .expect(200)).body;

        await request.delete(`/apps/${_id}`)
            .set(...global.adminAuth1)
            .expect(204);

        await request.get(`/apps/${_id}`)
            .set(...global.adminAuth1)
            .expect(404);
    });
});
