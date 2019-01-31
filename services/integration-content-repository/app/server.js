/* eslint no-unused-expressions: "off" */
/* eslint no-underscore-dangle: "off" */
/* eslint max-len: "off" */

const express = require('express');

const swaggerUi = require('swagger-ui-express');
const iamMiddleware = require('@openintegrationhub/iam-utils');
const config = require('./config/index');


const swaggerDocument = require('./api/swagger/swagger.json');

const log = require('./config/logger');

class Server {
  constructor() {
    this.app = express();
    this.app.disable('x-powered-by');

    this.app.use(async (req, res, next) => {
      if (req.method === 'OPTIONS') {
        res.status(200).end();
      }
      return next();
    });

    // This middleware insures we always have security headers
    this.app.use(async (req, res, next) => {
      res.append('Strict-Transport-Security', 'max-age=3600');
      res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
      res.append('Content-Security-Policy', "default-src 'self'");
      res.append('Content-Security-Policy', "frame-ancestors 'none'");
      next();
    });
  }

  setupRoutes() {
    log.debug('setting routes...');
    // This middleware simple calls the IAM middleware to add user data to req.
    this.app.use('/flows', async (req, res, next) => {
      try {
        await iamMiddleware.middleware(req, res, next);
        if (!res.headersSent) {
          next();
        }
      } catch (error) {
        res.status(401).send(`Authentication middleware failed with error: ${error}`);
        res.end;
      }
    });


    // This middleware compiles the relevant membership ids generated by the IAM iam middleware and passes them on
    this.app.use('/flows', async (req, res) => {
      // Checks whether iam middleare successfully added Heimdal object
      if (!req.__HEIMDAL__) {
        res.status(401).send('Authentication middleware did not find memberships');
        res.end;
      }

      if (this.mongoose.connection.readyState !== 1) {
        res.status(401).send(`NO DB. Please try again later [${this.mongoose.connection.readyState}] `);
        res.end();
      }

      // local copy of the user object
      const user = req.__HEIMDAL__;

      // A flag that shows the current user is an OIH admin, allowing them to see all flows irrespective of ownership
      if (config.oihViewerRoles.includes(user.role)) {
        res.locals.admin = true;
      }

      // Two-dimensional array that will hold the user's id and memberships. First row contains ids with read/write permissions, second row contains ids with read permissions.
      let credentials = [[], []];

      if (config.usePermissions) {
        if (user.auth.permissions.includes(config.flowReadPermission)) {
          credentials[1].push(user.userid);
        }

        if (user.auth.permissions.includes(config.flowWritePermission)) {
          credentials[0].push(user.userid);
        }

        // Pushes the ids of the tenants to the credentials array. If the user role allows writing of tenant flows, the id is pushed to the read/write and the read rows of the array. Otherwise the id is pushed only to the read row.
        for (let i = 0; i < user.memberships.length; i += 1) {
          if (user.memberships[i].permissions.includes(config.flowReadPermission)) {
            credentials[1].push(user.memberships[i].tenant);
          }
          if (user.memberships[i].permissions.includes(config.flowWritePermission)) {
            credentials[0].push(user.memberships[i].tenant);
          }
        }
      } else {
        // Adds the user's id to the credentials array, meaning that the user can always create flows, and view and edit those they have personally created.

        credentials = [[user.userid], [user.userid]];

        // Pushes the ids of the tenants to the credentials array. If the user role allows writing of tenant flows, the id is pushed to the read/write and the read rows of the array. Otherwise the id is pushed only to the read row.
        for (let i = 0; i < user.memberships.length; i += 1) {
          if (config.tenantWriterRoles.includes(user.memberships[i].role)) {
            credentials[0].push(user.memberships[i].tenant);
          }
          credentials[1].push(user.memberships[i].tenant);
        }
      }

      res.locals.credentials = credentials; // Passes on the tenancies that the user is a member of
    });

    //
    this.app.use('/docs', (req, res) => {
      res.redirect('/api-docs');
    });

    // configure routes
    /*eslint-disable */
      this.app.use('/flows', require('./api/controllers/flow'));
      this.app.use('/healthcheck', require('./api/controllers/healthcheck'));
      /* eslint-enable */

    // Extremely rudimentary error handler. TODO: Make it less rudimentary
      this.app.use(function (err, req, res, next) { // eslint-disable-line
      res.status(err.status).send(err.message);
    });

    log.debug('routes set');
  }

  async setup(mongoose) {
    log.debug('connecting to mongoose');
    // Configure MongoDB
    // Use the container_name, bec containers in the same network can communicate using their service name
    this.mongoose = mongoose;

    const options = {
      keepAlive: 1, connectTimeoutMS: 30000, reconnectInterval: 1000, reconnectTries: Number.MAX_VALUE, useNewUrlParser: true,
    }; //

    // Will connect to the mongo container by default, but to localhost if testing is active
    mongoose.connect(config.mongoUrl, options);

    // Get Mongoose to use the global promise library
    mongoose.Promise = global.Promise;  // eslint-disable-line
    // Get the default connection
    this.db = mongoose.connection;
    // Bind connection to error event (to get notification of connection errors)
    this.db.on('error', console.error.bind(console, 'MongoDB connection error:'));
    log.debug('connecting done');
  }

  setupSwagger() {
    log.debug('adding swagger api');
    // Configure the Swagger-API
    /*eslint-disable */
        var config = {
          appRoot: __dirname, // required config

          // This is just here to stop Swagger from complaining, without actual functionality

          swaggerSecurityHandlers: {
            Bearer: function (req, authOrSecDef, scopesOrApiKey, cb) {
              if (true) {
                cb();
              } else {
                cb(new Error('access denied!'));
              }
            }
          }
        };
        /* eslint-enable */

    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, { explorer: true }));
  }

  listen(port) {
    const cport = typeof port !== 'undefined' ? port : 3001;
    log.debug(`opening port ${cport}`);
    return this.app.listen(cport);
  }
}

module.exports = Server;
