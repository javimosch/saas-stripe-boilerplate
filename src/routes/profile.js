const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');


router.get('/', authMiddleware.isAuthenticated, async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      res.render('dashboard/profile', { 
        ...global.getEjsData(),
        title: 'User Profile', 
        user
      });
    } catch (error) {
      console.error(error);
      res.status(500).render('error', {...global.getEjsData(), message: 'Server error' });
    }
  });

  router.post('/', authMiddleware.isAuthenticated, async (req, res) => {
    try {
      const { username, email, password } = req.body;
      const user = await User.findById(req.user.id);
  
      if (username) user.username = username;
      if (email) user.email = email;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
      }
  
      await user.save();
  
      res.redirect('/dashboard/profile');
    } catch (error) {
      console.error(error);
      res.status(500).render('error', {...global.getEjsData(), message: 'Server error' });
    }
  });

  module.exports = router;