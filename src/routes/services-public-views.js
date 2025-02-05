const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');


router.get('/', authMiddleware.canBeAuthenticated, async (req, res) => {
  const {Service} = global.getMongooseModels(['Service'])
  try {
    const services = await Service.find({ active: true }).populate('pricingPlans');
    console.log({
      services
    })
    res.render('services/index', { ...global.getEjsData(), title: 'Our Services', services, user: req.user || null });
  } catch (error) {
    console.error(error)
    res.status(500).render('error', {...global.getEjsData(), message: 'Error fetching services' });
  }
});



// Display a specific service
router.get('/:id', authMiddleware.canBeAuthenticated, async (req, res) => {
  try {
    const {Service, Order} = global.getMongooseModels(['Service','Order'])
    const service = await Service.findById(req.params.id).populate('pricingPlans');
    if (!service) {
      return res.status(404).render('error', {...global.getEjsData(), message: 'Service not found' });
    }

    let userOrder = null;
    let canSubscribe = true;

    if (req.user) {
      // Check if the user has any order that includes this service
      userOrder = await Order.findOne({
        user: req.user._id,
        service: service._id,
        status: 'completed'
      }).populate('subscription').populate('pricingPlan');

      if (userOrder) {
        if (userOrder.subscription) {
          // If there's an associated subscription, check if it's active
          canSubscribe = userOrder.subscription.status !== 'active';
        } else {
          // If there's no subscription, check if the pricing plan was one-time
          canSubscribe = userOrder.pricingPlan.billingCycle !== 'one-time';
        }
      }
    }

    res.render('services/details', { 
      ...global.getEjsData(),
      title: service.name, 
      service, 
      userOrder, 
      canSubscribe,
      user: req.user || null 
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { ...global.getEjsData(), message: 'Error fetching service' });
  }
});


module.exports = router;