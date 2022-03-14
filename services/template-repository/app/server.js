/* eslint no-unused-expressions: "off" */
/* eslint no-underscore-dangle: "off" */
/* eslint max-len: "off" */
/* eslint consistent-return: "off" */

const express = require('express');

const swaggerUi = require('swagger-ui-express');
const iamMiddleware = require('@openintegrationhub/iam-utils');
const cors = require('cors');
const config = require('./config/index');
const flowTemplate = require('./api/controllers/flowTemplate');
const { connectQueue, disconnectQueue } = require('./utils/eventBus');
const healthcheck = require('./api/controllers/healthcheck');
const swaggerDocument = require('./api/swagger/swagger.json');

const log = require('./config/logger');

class Server {
  constructor() {
    this.app = express();
    this.app.disable('x-powered-by');
  }

  async setupCors() {
    const whitelist = config.originWhitelist;

    // For development, add localhost to permitted origins
    if (process.env.NODE_ENV !== 'production') {
      whitelist.push('http://localhost:3001');
    }

    const corsOptions = {
      origin(origin, callback) {
        if (whitelist.find((elem) => origin.indexOf(elem) >= 0)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
    };

    this.app.use((req, res, next) => {
      req.headers.origin = req.headers.origin || req.headers.host;
      next();
    });

    // Enables preflight OPTIONS requests
    this.app.options('/', cors());

    // enables CORS
    this.app.use('/templates', cors(corsOptions));
  }

  async setupMiddleware() {
    log.info('Setting up middleware');

    // This middleware simple calls the IAM middleware to add user data to req.
    this.app.use('/templates', iamMiddleware.middleware);

    // This middleware compiles the relevant membership ids generated by the IAM iam middleware and passes them on
    this.app.use('/templates', async (req, res, next) => {
      if (this.mongoose.connection.readyState !== 1) {
        return res
          .status(500)
          .send({
            errors: [
              {
                message: `NO DB. Please try again later ${this.mongoose.connection.readyState}`,
                code: 500,
              },
            ],
          });
      }

      return next();
    });

    log.info('Middleware set up');
  }

  async setupQueue() {
    // eslint-disable-line
    log.info('Connecting to Queue');
    await connectQueue();
  }

  async terminateQueue() {
    // eslint-disable-line
    log.info('Disconnecting from Queue');
    await disconnectQueue();
  }

  setupRoutes() {
    // configure routes
    this.app.use('/templates', flowTemplate);
    this.app.use('/healthcheck', healthcheck);

    // Reroute to docs
    this.app.use('/docs', (req, res) => {
      res.redirect('/api-docs');
    });

    // Error handling
    this.app.use((err, req, res, next) =>
      // eslint-disable-line
      // eslint-disable-next-line implicit-arrow-linebreak
      res
        .status(err.status || 500)
        .send({ errors: [{ message: err.message, code: err.status }] }));

    log.info('Routes set');
  }

  async setup(mongoose) {
    log.info('Connecting to mongoose');
    // Configure MongoDB
    // Use the container_name, bec containers in the same network can communicate using their service name
    this.mongoose = mongoose;

    const options = {
      keepAliveInitialDelay: 300000,
      connectTimeoutMS: 30000,
    }; //

    // Will connect to the mongo container by default, but to localhost if testing is active
    await mongoose.connect(config.mongoUrl, options);

    // Get the default connection
    this.db = mongoose.connection;
    // Bind connection to error event (to get notification of connection errors)
    this.db.on(
      'error',
      console.error.bind(console, 'MongoDB connection error:'),
    );
    log.info('Connecting done');
  }

  setupSwagger() {
    log.info('adding swagger api');
    // Configure the Swagger-API
    /*eslint-disable */
    var config = {
      appRoot: __dirname, // required config

      // This is just here to stop Swagger from complaining, without actual functionality

      swaggerSecurityHandlers: {
        Bearer: function (req, authOrSecDef, scopesOrApiKey, cb) {
            cb();
        },
      },
    };
    /* eslint-enable */

    this.app.use(
      '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerDocument, { explorer: true }),
    );
  }

  listen(port) {
    const cport = typeof port !== 'undefined' ? port : 3001;
    log.info(`opening port ${cport}`);
    return this.app.listen(cport);
  }
}

module.exports = Server;
