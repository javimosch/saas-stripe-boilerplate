const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Assuming you have a User model
const bcrypt = require('bcrypt');
const { associateSubscriptionsWithUser } = require('../helpers/subscriptions.js')
const { matchAndSaveStripeCustomer } = require('../helpers/stripe.js')
const {logEvent} = require('../helpers/event');

// GET register page
router.get('/register', (req, res) => {
  res.render('auth/register', { ...global.getEjsData(),title: 'Register', error: '' });
});

// GET register page
router.get('/register', (req, res) => {
  res.render('auth/register', { ...global.getEjsData(),title: 'Register' });
});

// POST register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.render('auth/register', {
        ...global.getEjsData(),
        title: 'Register',
        error: 'User already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    user = new User({
      username,
      email,
      password: hashedPassword
    });



    await user.save();

    req.session.userId = user._id

    await logEvent('info', `Register success`, {
      email: user.email
    });

    res.redirect('/auth/login');
  } catch (error) {
    console.error(error);
    res.render('auth/register', {
      ...global.getEjsData(),
      title: 'Register',
      error: 'An error occurred during registration'
    });
  }
});

// GET login page
router.get('/login', (req, res) => {
  res.render('auth/login', { ...global.getEjsData(),title: 'Login' });
});

async function checkAndSetAdminRole(user) {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 1 && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
      console.log(`User ${user.email} has been set as admin.`);
    }
  } catch (error) {
    console.error('Error checking and setting admin role:', error);
  }
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).render('auth/login', { ...global.getEjsData(),error: 'Invalid credentials', title: 'Login' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).render('auth/login', {
        ...global.getEjsData(),
        error: 'Invalid credentials', title: 'Login' });
    }
    
    // Check and set admin role if this is the only user
    await Promise.all([
      await checkAndSetAdminRole(user),
      await associateSubscriptionsWithUser(user),
      await matchAndSaveStripeCustomer(user),
    ])

    // Set user info in session
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.userRole = user.role; // Add this line to store the user's role in the session

    await logEvent('info', `Login success`, {
      email: user.email
    });

    res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
    res.status(500).render('auth/login', {...global.getEjsData(), error: 'Server error', title: 'Login' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/');
  });
});

module.exports = router;