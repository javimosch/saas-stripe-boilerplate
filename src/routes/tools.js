const express = require('express');
const router = express.Router();
const Tool = require('../models/Tool');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware.canBeAuthenticated)
router.use(authMiddleware.isAuthenticated)

router.get('/', async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('subscriptions');
        const userSubscriptionIds = user.subscriptions.map(sub => sub._id);

        const tools = await Tool.find({ subscription: { $in: userSubscriptionIds } });

        res.render('tools/index', { ...global.getEjsData(),tools, user: req.user });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', {...global.getEjsData(), message: 'Error fetching tools' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('subscriptions');
        const userSubscriptionIds = user.subscriptions.map(sub => sub._id);

        const tool = await Tool.findOne({
            _id: req.params.id,
            subscription: { $in: userSubscriptionIds }
        });

        if (!tool) {
            return res.status(404).render('error', {...global.getEjsData(), message: 'Tool not found or not accessible' });
        }

        res.render('tools/show', { ...global.getEjsData(),tool, user: req.user });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', {...global.getEjsData(), message: 'Error fetching tool details' });
    }
});

module.exports = router