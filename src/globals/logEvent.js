const mongoose = require('mongoose')

async function logEvent(type, message, details = {}) {
  try {
    const Event = mongoose.model('Event')
    const event = new Event({
      type,
      message,
      details
    });
    await event.save();
  } catch (error) {
    console.error('Error logging event:', error);
  }
}

module.exports = logEvent