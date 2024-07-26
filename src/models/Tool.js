const mongoose = require('mongoose');

const ToolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  html: {
    type: String,
    required: true
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true
  }
});

module.exports = mongoose.model('Tool', ToolSchema);