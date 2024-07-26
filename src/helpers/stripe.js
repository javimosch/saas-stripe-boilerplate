const {stripe} = require('../routes/stripe')

async function matchAndSaveStripeCustomer(user) {
  try {
    // Check if user already has a Stripe customer ID
    if (user.stripe_customer_id) {
      console.log(`User ${user.email} already has a Stripe customer ID.`);
      return;
    }

    // Search for the customer in Stripe by email
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });

    let stripeCustomer;

    if (customers.data.length > 0) {
      // Customer found in Stripe
      stripeCustomer = customers.data[0];
      console.log(`Found existing Stripe customer for ${user.email}.`);
    } else {
      // Customer not found, create a new one
      stripeCustomer = await stripe.customers.create({
        email: user.email,
        name: user.name // Assuming your user model has a name field
      });
      console.log(`Created new Stripe customer for ${user.email}.`);
    }

    // Save the Stripe customer ID to the user
    user.stripe_customer_id = stripeCustomer.id;
    await user.save();

    console.log(`Saved Stripe customer ID for user ${user.email}.`);

  } catch (error) {
    console.error('Error matching and saving Stripe customer:', error);
  }
}

module.exports = {
    matchAndSaveStripeCustomer
}