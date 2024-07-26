const session = require('express-session');

/**
 * Configures session management for an Express app.
 *
 * @param {object} app - The Express application instance.
 * @returns {void}
 */
function configureSession(app) {
  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.COOKIE_SECURE === '1' ? true : false } // Set to true if using https
  }));
}

module.exports = configureSession;