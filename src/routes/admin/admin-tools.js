module.exports = router => {

    const Tool = require('../../models/Tool');
    const Subscription = require('../../models/Subscription');
    const { isAdmin } = require('../../middleware/auth');

    // Apply isAdmin middleware to all routes in this file
    router.use(isAdmin);

    // List all tools
    router.get('/tools', async (req, res) => {
        try {
            const tools = await Tool.find().populate('subscription');
            res.render('admin/tools/index', { ...global.getEjsData(),tools });
        } catch (error) {
            console.error(error);
            res.status(500).render('error', {...global.getEjsData(), message: 'Error fetching tools' });
        }
    });

    // Show form to add a new tool
    router.get('/tools/new', async (req, res) => {
        try {
            const subscriptions = await Subscription.find({ status: { $eq: 'active' } }).populate('service');
            res.render('admin/tools/new', { ...global.getEjsData(),subscriptions });
        } catch (error) {
            console.error(error);
            res.status(500).render('error', {...global.getEjsData(), message: 'Error loading form' });
        }
    });

    // Add a new tool
    router.post('/tools', async (req, res) => {
        try {
            const { name, html, subscription } = req.body;
            const newTool = new Tool({ name, html, subscription });
            await newTool.save();
            res.redirect('/admin/tools');
        } catch (error) {
            console.error(error);
            res.status(500).render('error', {...global.getEjsData(), message: 'Error adding tool' });
        }
    });

    // Show form to edit a tool
    router.get('/tools/:id/edit', async (req, res) => {
        try {
            const tool = await Tool.findById(req.params.id);
            const subscriptions = await Subscription.find({ status: { $eq: 'active' } }).populate('service');
            res.render('admin/tools/edit', { ...global.getEjsData(),tool, subscriptions });
        } catch (error) {
            console.error(error);
            res.status(500).render('error', {...global.getEjsData(), message: 'Error loading edit form' });
        }
    });

    // Update a tool
    router.post('/tools/:id', async (req, res) => {
        try {
            const { name, html, subscription } = req.body;
            await Tool.findByIdAndUpdate(req.params.id, { name, html, subscription });
            res.redirect('/admin/tools');
        } catch (error) {
            console.error(error);
            res.status(500).render('error', {...global.getEjsData(), message: 'Error updating tool' });
        }
    });

    // Delete a tool
    router.post('/tools/:id/delete', async (req, res) => {
        try {
            await Tool.findByIdAndDelete(req.params.id);
            res.redirect('/admin/tools');
        } catch (error) {
            console.error(error);
            res.status(500).render('error', {...global.getEjsData(), message: 'Error deleting tool' });
        }
    });

    module.exports = router;
}