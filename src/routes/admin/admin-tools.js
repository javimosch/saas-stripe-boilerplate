//admin-tools.js
const express = require('express');
const router = express.Router();

/**
 * Admin can CRUD tools
 * router.use('/admin', require('admin/admin-tools'))
 */
router.get('/manage-tools', async (req, res) => {
    try {
        const { Tool, PricingPlan } = global.getMongooseModels(['Tool', 'PricingPlan']);
        
        const filter = req.user.role === 'super_admin' ? {} : { organization: req.user.organization };
        
        // Fetch tools and populate pricingPlans
        const tools = await Tool.find(filter).populate('pricingPlans');
        
        // Fetch all pricing plans for the select options
        const allPricingPlans = await PricingPlan.find(filter).select('_id name');
        
        res.render('admin/tools/index', { 
            ...global.getEjsData(), 
            tools,
            allPricingPlans
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { ...global.getEjsData(), message: 'Error fetching tools' });
    }
});

module.exports = router;
