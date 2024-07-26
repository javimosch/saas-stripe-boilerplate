const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_API_KEY);
const Service = require('../models/Service');
const Subscription = require('../models/Subscription');
const authMiddleware = require('../middleware/auth');
const {logEvent} = require('../helpers/event');
router.use(authMiddleware.canBeAuthenticated)
router.use(authMiddleware.isAuthenticated)

global.stripe = stripe

router.post('/create-checkout-session', async (req, res) => {
    try {
        const { serviceId, pricingPlanId } = req.body;
        const service = await Service.findById(serviceId).populate('pricingPlans');

        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }

        const pricingPlan = service.pricingPlans.find(plan => plan._id.toString() === pricingPlanId);

        if (!pricingPlan) {
            return res.status(404).json({ error: 'Pricing plan not found' });
        }

        console.log('/create-checkout-session', {
            service,
            pricingPlan
        });

        let priceData = {
            unit_amount: pricingPlan.price * 100, // Stripe uses cents
            currency: 'eur',
            product_data: {
                name: `${service.name} - ${pricingPlan.name}`,
            },
        };

        // Add recurring details only if it's not a one-time payment
        if (pricingPlan.billingCycle !== 'one-time') {
            priceData.recurring = {
                interval: pricingPlan.billingCycle === 'monthly' ? 'month' : 'year'
            };
        }

        const price = await stripe.prices.create(priceData);

        const sessionData = {
            payment_method_types: ['card'],
            line_items: [
                {
                    price: price.id,
                    quantity: 1,
                },
            ],
            mode: pricingPlan.billingCycle === 'one-time' ? 'payment' : 'subscription',
            success_url: `${process.env.FRONTEND_URL}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/services/${serviceId}`,
            metadata: {
                serviceId: serviceId,
                pricingPlanId: pricingPlanId,
                userId: req.user.id,
            },
        };

        const session = await stripe.checkout.sessions.create(sessionData);

        res.json({ id: session.id });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});


router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        await logEvent('error', 'Webhook signature verification failed', { error: err.message });
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Log all incoming events
    await logEvent('info', `Stripe webhook received: ${event.type}`, { 
        eventType: event.type, 
        eventId: event.id
    });

    try {
        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                const subscription = event.data.object;
                await updateSubscriptionStatus(subscription);
                await logEvent('info', `Subscription ${event.type}`, { 
                    subscriptionId: subscription.id, 
                    customerId: subscription.customer,
                    status: subscription.status
                });
                break;

            case 'invoice.paid':
            case 'invoice.payment_failed':
                const invoice = event.data.object;
                await logEvent('info', `Invoice ${event.type}`, { 
                    invoiceId: invoice.id, 
                    customerId: invoice.customer,
                    amount: invoice.amount_paid,
                    status: invoice.status
                });
                // Handle invoice paid or failed
                break;

            case 'charge.succeeded':
            case 'charge.failed':
                const charge = event.data.object;
                await logEvent('info', `Charge ${event.type}`, { 
                    chargeId: charge.id, 
                    customerId: charge.customer,
                    amount: charge.amount,
                    status: charge.status
                });
                // Handle successful or failed charge
                break;

            case 'customer.created':
            case 'customer.updated':
            case 'customer.deleted':
                const customer = event.data.object;
                await logEvent('info', `Customer ${event.type}`, { 
                    customerId: customer.id, 
                    email: customer.email
                });
                // Handle customer events
                break;

            case 'payment_intent.succeeded':
            case 'payment_intent.payment_failed':
                const paymentIntent = event.data.object;
                await logEvent('info', `Payment intent ${event.type}`, { 
                    paymentIntentId: paymentIntent.id, 
                    customerId: paymentIntent.customer,
                    amount: paymentIntent.amount,
                    status: paymentIntent.status
                });
                // Handle payment intent events
                break;

            case 'checkout.session.completed':
                const session = event.data.object;
                await logEvent('info', 'Checkout session completed', { 
                    sessionId: session.id, 
                    customerId: session.customer,
                    amount: session.amount_total
                });
                // Handle completed checkout session
                break;

            // Add more cases for other event types as needed

            default:
                // Log unhandled event types
                await logEvent('info', `Unhandled Stripe event type: ${event.type}`, { 
                    eventId: event.id 
                });
        }

        res.json({received: true});
    } catch (error) {
        await logEvent('error', 'Error processing Stripe webhook', { 
            error: error.message, 
            eventType: event.type, 
            eventId: event.id 
        });
        res.status(500).send('Error processing webhook');
    }
});

async function updateSubscriptionStatus(stripeSubscription) {
    const subscription = await Subscription.findOne({ stripeSubscriptionId: stripeSubscription.id });
    if (subscription) {
        // Map Stripe status to your Subscription status
        switch (stripeSubscription.status) {
            case 'active':
            case 'trialing':
                subscription.status = 'active';
                break;
            case 'canceled':
            case 'unpaid':
                subscription.status = 'cancelled';
                break;
            case 'incomplete':
            case 'incomplete_expired':
            case 'past_due':
                subscription.status = 'expired';
                break;
            default:
                console.log(`Unhandled Stripe subscription status: ${stripeSubscription.status}`);
                break;
        }

        subscription.endDate = new Date(stripeSubscription.current_period_end * 1000);
        
        // Save the entire Stripe subscription object in stripeMetadata
        subscription.stripeMetadata = stripeSubscription;

        await subscription.save();
    }
}

router.stripe=stripe
module.exports = router;