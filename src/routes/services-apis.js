const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_API_KEY);
const Service = require('../models/Service'); // Assuming you have a Service model
const authMiddleware = require('../middleware/auth'); // Middleware to protect routes

router.use(authMiddleware.canBeAuthenticated);
router.use(authMiddleware.isAdmin);

router.use('/',global.setupMongooseCrudRoutes('Service'))

module.exports = router;