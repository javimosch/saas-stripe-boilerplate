const express = require('express');
const router = express.Router();

// Create the model
const ContactFormMessage = require('../models/ContactFormMessage')

// GET route for the contact page
router.get('/', (req, res) => {
  res.render('contact', { ...global.getEjsData(),title: 'Contact Us' });
});

// POST route to handle form submission
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Create a new contact form message document
    const newMessage = new ContactFormMessage({
      name,
      email,
      message
    });

    // Save the message to the database
    await newMessage.save();

    // Redirect to a thank you page or back to the contact page with a success message
    res.redirect('/?success=true');
  } catch (error) {
    console.error('Error saving contact form message:', error);
    res.status(500).render('contact', { 
      title: 'Contact Us', 
      error: 'An error occurred. Please try again later.' 
    });
  }
});

module.exports = router;