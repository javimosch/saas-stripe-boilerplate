const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['info', 'warning', 'error', 'success']
  },
  message: {
    type: String,
    required: true
  },
  details: mongoose.Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Event', EventSchema);