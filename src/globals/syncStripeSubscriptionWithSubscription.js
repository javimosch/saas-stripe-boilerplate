/**
 * 
 * If we cancel our mongo sub, we also cancel stripe sub
 * 
 * Requires global.stripe
 * @param {*} subscription 
 * @returns 
 */
module.exports = async function syncStripeSubscriptionWithSubscription(subscription) {
  if (!subscription.stripeSubscriptionId) {
    return subscription; // No Stripe subscription to sync
  }

  const stripeSubscription = await global.stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);

  // Check if sync is needed
  const needsSync = (
    subscription.status === 'cancelled' &&
    (!stripeSubscription.cancel_at_period_end && !stripeSubscription.canceled_at)
  );

  if (needsSync) {
    // Cancel the Stripe subscription if it's not already cancelled
    const updatedStripeSubscription = await global.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    // Update the subscription data in your database
    subscription.stripeMetadata = updatedStripeSubscription;
    subscription.endDate = new Date(updatedStripeSubscription.current_period_end * 1000);
    subscription.save()
  }

  return subscription;
}
