const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const authMiddleware = require('../middleware/auth');
const Subscription = require('../models/Subscription'); // Make sure to import the Subscription model

// List all services
router.get('/', authMiddleware.canBeAuthenticated, async (req, res) => {
  try {
    const services = await Service.find().populate('pricingPlans');
    console.log({
      services
    })
    res.render('services/index', { ...global.getEjsData(),title: 'Our Services', services, user: req.user || null });
  } catch (error) {
    console.error(error)
    res.status(500).render('error', {...global.getEjsData(), message: 'Error fetching services' });
  }
});



// Display a specific service
router.get('/:id', authMiddleware.canBeAuthenticated, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate('pricingPlans');
    if (!service) {
      return res.status(404).render('error', {...global.getEjsData(), message: 'Service not found' });
    }

    let userSubscription = null;
    let canSubscribe = true;

    if (req.user) {
      // Check if the user has any active subscription that includes this service
      userSubscription = await Subscription.findOne({
        user: req.user._id,
        service: service._id,
        status: 'active'
      });

      if (userSubscription) {
        canSubscribe = false;
      } else {
        // Check if the user has any subscription that includes this service
        const existingSubscription = await Subscription.findOne({
          user: req.user._id,
          service: service._id
        });
        if (existingSubscription) {
          canSubscribe = false;
        }
      }
    }

    res.render('services/details', { 
      ...global.getEjsData(),
      title: service.name, 
      service, 
      userSubscription, 
      canSubscribe,
      user: req.user || null 
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { ...global.getEjsData(),message: 'Error fetching service' });
  }
});

module.exports = router;