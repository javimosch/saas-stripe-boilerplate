const mongoose = require('mongoose');

// Define the schema for contact form messages
const ContactFormMessageSchema = new mongoose.Schema({
    name: String,
    email: String,
    message: String,
    createdAt: { type: Date, default: Date.now }
  });
  
  // Create the model
  const ContactFormMessage = mongoose.model('ContactFormMessage', ContactFormMessageSchema);
  module.exports = ContactFormMessage;