const mongoose = require('mongoose');

const ToolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  renderMode: {
    type: String,
    enum: ['inline', 'external', 'download'],
    required: true
  },
  content: {
    type: String,
    required: function() { return this.renderMode === 'inline'; }
  },
  externalUrl: {
    type: String,
    required: function() { return this.renderMode === 'external'; }
  },
  downloadUrl: {
    type: String,
    required: function() { return this.renderMode === 'download'; }
  },
  pricingPlans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PricingPlan',
    required: true
  }],
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Tool', ToolSchema);
