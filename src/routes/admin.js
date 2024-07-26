const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Service = require('../models/Service');


// Apply isAdmin middleware to all routes in this router
router.use(authMiddleware.canBeAuthenticated);
router.use(authMiddleware.isAdmin);

// GET /admin/plans
router.get('/manage-pricing-plans', (req, res) => {
  res.render('admin/pricing-plans', { ...global.getEjsData(),title: 'Manage Plans' });
});

require('./admin/admin-tools')(router)
require('./admin/admin-events')(router)
require('./admin/admin-orders')(router)

// GET /admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).select('username email role');
    res.render('admin/users', { ...global.getEjsData(),title: 'Manage Users', users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).render('error', {...global.getEjsData(), message: 'Error fetching users' });
  }
});



// GET /admin/orders
router.get('/orders', (req, res) => {
  res.render('admin/orders', { ...global.getEjsData(),title: 'View Orders' });
});

// GET /admin/settings
router.get('/settings', (req, res) => {
  res.render('admin/settings', { ...global.getEjsData(),title: 'Site Settings' });
});

// DELETE /admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const result = await User.findByIdAndDelete(userId);
    if (result) {
      res.json({ success: true, message: 'User deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Error deleting user' });
  }
});


// GET /admin/users/:id
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Error fetching user' });
  }
});

// PUT /admin/users/:id
router.put('/users/:id', async (req, res) => {
  try {
    const { username, email, role } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { username, email, role },
      { new: true, runValidators: true }
    );
    if (updatedUser) {
      res.json({ success: true, user: updatedUser });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Error updating user' });
  }
});


// GET /admin/services
router.get('/manage-services', async (req, res) => {
  try {
    const services = await Service.find();
    res.render('admin/services', { ...global.getEjsData(),title: 'Services',services });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching services' });
  }
});


module.exports = router;