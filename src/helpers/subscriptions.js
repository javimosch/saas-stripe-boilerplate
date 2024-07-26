const Subscription = require('../models/Subscription'); // You'll need to create this model
const Order = require('../models/Order');

async function associateSubscriptionsWithUser(user) {
    try {
      // Find all subscriptions for this user
      const subscriptions = await Subscription.find({ user: user._id });
  
      // If user doesn't have a subscriptions field, initialize it
      if (!user.subscriptions) {
        user.subscriptions = [];
      }
  
      let updated = false;
  
      for (const subscription of subscriptions) {
        // Check if the subscription is not already in the user's subscriptions array
        if (!user.subscriptions.includes(subscription._id)) {
          user.subscriptions.push(subscription._id);
          updated = true;
        }
      }
  
      // If we added any new subscriptions, save the user
      if (updated) {
        await user.save();
        console.log(`Associated subscriptions with user ${user.email}.`);
      }
  
    } catch (error) {
      console.error('Error associating subscriptions with user:', error);
    }
  }

  async function updateOrdersWithSubscriptionForUser(user) {
    console.log(`Updating orders with subscription for user ${user._id}`);
    const orders = await Order.find({ user: user._id, subscription: { $exists: false } }); // find orders without subscription field set
    console.log(`Found ${orders.length} orders without subscription`);
  
    for (const order of orders) {
      console.log(`Processing order ${order._id}`);
      let userSubscription;
      try {
        userSubscription = await Subscription.findOne({ order: order._id });
        if (!userSubscription) {
          userSubscription = await Subscription.findOne({ stripeSubscriptionId: order.stripeSubscriptionId });
          if (!userSubscription) {
            console.log(`No subscription found for order ${order._id}`);
            continue;
          }
        }
        console.log(`Found subscription ${userSubscription._id} for order ${order._id}`);
        order.subscription = userSubscription._id;
        
        // Save the order ID to the subscription if it's not already set
        if (!userSubscription.order) {
          userSubscription.order = order._id;
          await userSubscription.save();
          console.log(`Updated subscription ${userSubscription._id} with order ${order._id}`);
        }
        
        await order.save();
        console.log(`Updated order ${order._id} with subscription ${userSubscription._id}`);
      } catch (err) {
        console.error(`Error processing order ${order._id}: ${err}`);
      }
    }
    console.log(`Finished updating orders with subscription for user ${user._id}`);
  }

  module.exports = {
    associateSubscriptionsWithUser,
    updateOrdersWithSubscriptionForUser
  }