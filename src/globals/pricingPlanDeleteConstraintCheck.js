module.exports = async function pricingPlanDeleteConstraintCheck(req, model) {
    const { Order } = global.getMongooseModels(['Order']);
    const pricingPlanId = req.params.id;

    // Check for associated orders
    const associatedOrders = await Order.find({ pricingPlan: pricingPlanId });
    if (associatedOrders.length > 0) {
        await logEvent('warning', 'Attempt to delete pricing plan with associated orders', {
            pricingPlanId,
            orderCount: associatedOrders.length
        });
        return false;
    }

    return true;
}
