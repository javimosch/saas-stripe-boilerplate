module.exports = router => {

  const Event = require('../../models/Event');

  // List all events
  router.get('/events', async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const events = await Event.find()
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);

      const totalEvents = await Event.countDocuments();

      res.render('admin/events', {
        ...global.getEjsData(),
        title:'Events',
        events,
        currentPage: page,
        totalPages: Math.ceil(totalEvents / limit),
        totalEvents
      });
    } catch (error) {
      console.error(error);
      res.status(500).render('error', {...global.getEjsData(), message: 'Error fetching events' });
    }
  });
}