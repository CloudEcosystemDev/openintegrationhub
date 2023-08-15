const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const App = require('./src/App.js');

process.on('uncaughtException', (err, origin) => console.error(err, origin));
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Application specific logging, throwing an error, or other logic here
});

(async () => {
    try {
        const app = new App();
        await app.start();
    } catch (e) {
        console.error('Critical error, going to die', e, e && e.stack); //eslint-disable-line
        process.exit(1); //eslint-disable-line no-process-exit
    }
})();

