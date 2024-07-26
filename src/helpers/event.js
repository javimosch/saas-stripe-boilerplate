const Event = require('../models/Event');

async function logEvent(type, message, details = {}) {
  try {
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

module.exports = {
    logEvent
};