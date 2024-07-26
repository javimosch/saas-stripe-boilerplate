module.exports = async function serviceDeleteConstraintCheck(req, model) {
    const { Order, PricingPlan } = global.getMongooseModels(['Order', 'PricingPlan']);
    const serviceId = req.params.id;

    // Check for associated orders
    const associatedOrders = await Order.find({ service: serviceId });
    if (associatedOrders.length > 0) {
        await logEvent('warning', 'Attempt to delete service with associated orders', {
            serviceId,
            orderCount: associatedOrders.length
        });
        return false;
    }

    // Check for associated pricing plans
    const associatedPricingPlans = await PricingPlan.find({ service: serviceId });
    if (associatedPricingPlans.length > 0) {
        await logEvent('warning', 'Attempt to delete service with associated pricing plans', {
            serviceId,
            pricingPlanCount: associatedPricingPlans.length
        });
        return false;
    }

    return true;
}