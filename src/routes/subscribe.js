const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const Subscription = require('../models/Subscription'); // You'll need to create this model
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware.isAuthenticated)

// GET /subscribe/:serviceId
router.get('/:serviceId', async (req, res) => {
  try {
    const service = await Service.findById(req.params.serviceId).populate('pricingPlans');
    if (!service) {
      return res.status(404).render('error', {...global.getEjsData(), message: 'Service not found' });
    }

    let pricingPlan = null;
    if (req.query.pricingPlanId) {
      pricingPlan = service.pricingPlans.find(plan => plan._id.toString() === req.query.pricingPlanId);
      if (!pricingPlan) {
        return res.status(404).render('error', {...global.getEjsData(), message: 'Pricing plan not found' });
      }
    }

    res.render('subscribe', { 
      ...global.getEjsData(),
      title: `Subscribe to ${service.name}`, 
      service,
      user: req.user,
      pricingPlan // This will be null if no pricingPlanId was provided or if it wasn't found
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).render('error', {...global.getEjsData(), message: 'Error loading subscription page' });
  }
});


// POST /subscribe/:serviceId
router.post('/:serviceId', async (req, res) => {
  try {

    if(!req.user){
      return res.status(403).render('error', {...global.getEjsData(), message: 'Login required' });
    }

    const service = await Service.findById(req.params.serviceId);
    if (!service) {
      return res.status(404).render('error', {...global.getEjsData(), message: 'Service not found' });
    }

    // Create a new subscription
    const subscription = new Subscription({
      user: req.user._id, // Assuming you store user ID in session
      service: service._id,
      startDate: new Date(),
      // Set endDate based on your subscription logic (e.g., 1 month from now)
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      status: 'active'
    });

    await subscription.save();

    res.redirect('/dashboard'); // Redirect to dashboard or confirmation page
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).render('error', {...global.getEjsData(), message: 'Error processing subscription' });
  }
});

module.exports = router;