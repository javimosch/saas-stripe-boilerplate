module.exports = router => {
    const Order = require('../../models/Order');
    
    // List all orders
    router.get('/orders', async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20000;
            const skip = (page - 1) * limit;

            const orders = await Order.find()
                .populate('user', 'email')
                .populate('service', 'name')
                .sort({ createdAt: -1 })
                //.skip(skip)
                .limit(limit);

            const totalOrders = await Order.countDocuments();

            res.render('admin/orders', {
                ...global.getEjsData(),
                orders,
                currentPage: page,
                totalPages: Math.ceil(totalOrders / limit),
                totalOrders
            });
        } catch (error) {
            console.error(error);
            res.status(500).render('error', {...global.getEjsData(), message: 'Error fetching orders' });
        }
    });

}