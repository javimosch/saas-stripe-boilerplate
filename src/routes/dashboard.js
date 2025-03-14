const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { stripe } = require('./stripe')
const { updateOrdersWithSubscriptionForUser } = require('../helpers/subscriptions')

// Assuming you have a User model and a Service model
const User = require('../models/User');
const Service = require('../models/Service');
const Order = require('../models/Order');
const Subscription = require('../models/Subscription');
const Tool = require('../models/Tool');
const PricingPlan = require('../models/PricingPlan')

router.use(authMiddleware.canBeAuthenticated)

// Dashboard home route
router.get('/', authMiddleware.isAuthenticated, async (req, res) => {
  try {
    let user = await User.findById(req.user.id).select('-password').populate('organization');
    
    // Add default organization if user doesn't have one
    if (!user.organization) {
      const Organization = global.getMongooseModels(['Organization']).Organization;
      const defaultOrg = new Organization({ name: `Default Org for ${user.email}` });
      await defaultOrg.save();
      
      user.organization = defaultOrg._id;
      await user.save();
      
      // Reload user with the new organization
      user = await User.findById(req.user.id).select('-password').populate('organization');
    }

    console.log({user})
    res.render('dashboard/home', { ...global.getEjsData(), title: 'Dashboard', user });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { ...global.getEjsData(), message: 'Server error' });
  }
});

// User subscriptions route
router.get('/subscriptions', authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({
      user: {
        $eq: req.user._id
      }
    }).populate('service')
    subscriptions.sort((a, b) => (a.status === 'cancelled' ? 1 : -1));
    console.log("/subscriptions", {
      userId: req.user._id,
      sessionUserId: req.session.userId,
      subscriptions
    })
    res.render('dashboard/subscriptions', { title: 'My Subscriptions', subscriptions, ...global.getEjsData() });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { ...global.getEjsData(), message: 'Server error' });
  }
});


router.get('/subscription/success', async (req, res) => {
  const { session_id } = req.query;

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const { serviceId, pricingPlanId } = session.metadata;

    await logEvent('info', 'Stripe session retrieved', { sessionId: session_id });

    const service = await Service.findById(serviceId);
    const pricingPlan = await PricingPlan.findById(pricingPlanId);

    if (!service || !pricingPlan) {
      await logEvent('error', 'Service or Pricing Plan not found', { serviceId, pricingPlanId });
      throw new Error('Service or Pricing Plan not found');
    }

    let order, userSubscription;

    // Create order in your database
    order = new Order({
      user: req.user._id,
      service: serviceId,
      pricingPlan: pricingPlanId,
      paymentMethod: 'stripe',
      totalAmount: pricingPlan.price,
      status: 'completed',
      stripeMetadata: {}
    });

    if (session.mode === 'subscription') {
      const subscription = await stripe.subscriptions.retrieve(session.subscription);

      order.stripeSubscriptionId = subscription.id;

      userSubscription = new Subscription({
        user: req.user._id,
        service: serviceId,
        pricingPlan: pricingPlanId,
        order: order._id,
        stripeSubscriptionId: subscription.id,
        stripeMetadata: subscription,
        status: 'active',
        startDate: new Date(subscription.current_period_start * 1000),
        endDate: new Date(subscription.current_period_end * 1000),
      });
      await userSubscription.save();

      order.subscription = userSubscription._id;

      await logEvent('info', 'Subscription created', {
        userId: req.user._id,
        serviceId,
        pricingPlanId,
        subscriptionId: userSubscription._id
      });
    } else if (session.mode === 'payment') {
      const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
      
      const chargeId = paymentIntent.latest_charge

      order.stripeChargeId = chargeId
      order.stripeMetadata = {
        paymentIntent
      }

      console.log(order)

      await logEvent('info', 'One-time payment processed', {
        userId: req.user._id,
        serviceId,
        pricingPlanId,
        chargeId: chargeId
      });
    }

    await order.save();

    await logEvent('info', 'Order created', {
      userId: req.user._id,
      orderId: order._id,
      serviceId,
      pricingPlanId
    });

    // Associate order and subscription with user
    const updateData = { $push: { orders: order._id } };
    if (userSubscription) {
      updateData.$push.subscriptions = userSubscription._id;
    }
    await User.findByIdAndUpdate(req.user._id, updateData);

    await logEvent('info', 'User updated with new order/subscription', {
      userId: req.user._id,
      orderId: order._id,
      subscriptionId: userSubscription ? userSubscription._id : null
    });

    res.redirect('/dashboard?paymentSuccess=1');
  } catch (error) {
    console.error('Error processing successful payment:', error);
    await logEvent('error', 'Error processing payment', {
      userId: req.user._id,
      error: error.message
    });
    res.status(500).render('error', { ...global.getEjsData(), message: 'Error processing payment' });
  }
});



// GET /dashboard/subscription/:id
router.get('/subscription/:id', async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate('service')
      .exec();

    await global.syncStripeSubscriptionWithSubscription(subscription)

    if (!subscription) {
      return res.status(404).render('error', { ...global.getEjsData(), message: 'Subscription not found' });
    }

    if (subscription.user.toString() !== req.session.userId) {
      return res.status(403).render('error', { ...global.getEjsData(), message: 'Unauthorized access' });
    }

    res.render('dashboard/manage-subscription', { subscription, title: 'Manage Subscription', user: req.user, ...global.getEjsData() });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).render('error', { ...global.getEjsData(), message: 'Error loading subscription details' });
  }
});

// POST /dashboard/subscription/:id/cancel
router.post('/subscription/:id/cancel', async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).render('error', { ...global.getEjsData(), message: 'Subscription not found' });
    }

    if (subscription.user.toString() !== req.session.userId) {
      return res.status(403).render('error', { ...global.getEjsData(), message: 'Unauthorized access' });
    }

    if (subscription.status !== 'active') {
      return res.status(400).render('error', { ...global.getEjsData(), message: 'Subscription is not active' });
    }


    subscription.status = 'cancelled';

    await subscription.save();

    await global.syncStripeSubscriptionWithSubscription(subscription)

    res.redirect(`/dashboard/subscription/${subscription._id}`);
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).render('error', { ...global.getEjsData(), message: 'Error cancelling subscription' });
  }
});


// User orders route
router.get('/orders', authMiddleware.isAuthenticated, async (req, res) => {
  try {
    await updateOrdersWithSubscriptionForUser({ _id: req.session.userId })
    const user = await User.findById(req.user.id).populate({
      path: 'orders',
      populate: [
        { path: 'service' },
        { path: 'subscription' },
        { path: 'pricingPlan' }
      ]
    });
    res.render('dashboard/orders', { ...global.getEjsData(), title: 'My Orders', orders: user.orders });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { ...global.getEjsData(), message: 'Server error' });
  }
});

router.get('/tools', authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const { Order, Tool } = global.getMongooseModels(['Order', 'Tool']);
    const now = new Date();

    // Find all completed orders for the authenticated user
    const userOrders = await Order.find({ 
      user: req.user._id, 
      status: 'completed' 
    }).populate('pricingPlan subscription');

    // Extract pricing plan IDs from the user's valid orders
    const userPricingPlanIds = userOrders.filter(order => {
      // Include one-time payment orders (no subscription)
      if (!order.subscription) return true;
      
      // Include subscription orders with endDate in the future
      return order.subscription.endDate > now;
    }).map(order => order.pricingPlan._id);

    // Find tools associated with the pricing plans the user has ordered
    const tools = await Tool.find({ 
      pricingPlans: { $in: userPricingPlanIds } 
    }).populate('pricingPlans');

    res.render('dashboard/tools', { 
      ...global.getEjsData(), 
      title: 'AI Tools', 
      tools 
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { 
      ...global.getEjsData(), 
      message: 'Server error' 
    });
  }
});


router.get('/tools/:id', authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const { Order, Tool } = global.getMongooseModels(['Order', 'Tool']);
    const now = new Date();

    // Find all completed orders for the authenticated user
    const userOrders = await Order.find({ 
      user: req.user._id, 
      status: 'completed' 
    }).populate('pricingPlan subscription');

    // Extract pricing plan IDs from the user's valid orders
    const userPricingPlanIds = userOrders.filter(order => {
      // Include one-time payment orders (no subscription)
      if (!order.subscription) return true;
      
      // Include subscription orders with endDate in the future
      return order.subscription.endDate > now;
    }).map(order => order.pricingPlan._id);

    // Find the tool by ID and ensure it is associated with one of the user's valid pricing plans
    const tool = await Tool.findOne({
      _id: req.params.id,
      pricingPlans: { $in: userPricingPlanIds }
    }).populate('pricingPlans');

    if (!tool) {
      return res.status(404).render('error', { ...global.getEjsData(), message: 'Tool not found or not accessible' });
    }

    res.render('dashboard/tool', { ...global.getEjsData(), title: tool.name, tool });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { ...global.getEjsData(), message: 'Error loading tool' });
  }
});

module.exports = router;