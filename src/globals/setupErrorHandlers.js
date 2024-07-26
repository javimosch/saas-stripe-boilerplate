/**
 * Error Handling Middleware for Express Application
 * 
 * This module provides both a 404 error handler and a general error handler
 * for an Express.js application.
 *
 * @param {object} app - The Express application instance.
 */
function setupErrorHandlers(app) {

    // 404 Error Handler
    app.use((req, res, next) => {
      console.log(req.url);
      res.status(404).render('error', {
        ...global.getEjsData(),
        title: 'Page Not Found',
        statusCode: 404,
        message: 'The page you are looking for does not exist.'
      });
    });
  
    // General Error Handler
    app.use((err, req, res, next) => {
      console.error(err.stack);
      const statusCode = err.statusCode || 500;
      res.status(statusCode).render('error', {
        ...global.getEjsData(),
        title: 'Error',
        statusCode: statusCode,
        message: err.message || 'An unexpected error occurred',
        error: err // This will only be rendered in development mode
      });
    });
  }
  
  module.exports = setupErrorHandlers;