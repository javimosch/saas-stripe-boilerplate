const mongoose = require('mongoose');

async function associatePricingPlanToService(pricingPlan) {
    try {
        const Service = mongoose.model('Service');
        const PricingPlan = mongoose.model('PricingPlan');

        // Ensure the pricing plan is fully populated
        const populatedPlan = await PricingPlan.findById(pricingPlan._id).populate('service');

        if (!populatedPlan) {
            console.error('Pricing plan not found');
            return;
        }

        if (!populatedPlan.service) {
            console.error('Pricing plan does not have an associated service');
            return;
        }

        // Find the service and update its pricingPlans array
        const service = await Service.findById(populatedPlan.service._id);

        if (!service) {
            console.error('Associated service not found');
            return;
        }

        // Check if the pricing plan is already in the service's pricingPlans array
        if (!service.pricingPlans.includes(populatedPlan._id)) {
            service.pricingPlans.push(populatedPlan._id);
            await service.save();
            console.log(`Pricing plan ${populatedPlan._id} associated with service ${service._id}`);
        } else {
            console.log(`Pricing plan ${populatedPlan._id} is already associated with service ${service._id}`);
        }
    } catch (error) {
        console.error('Error associating pricing plan to service:', error);
    }
};

module.exports = associatePricingPlanToService