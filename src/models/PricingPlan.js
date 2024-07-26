const mongoose = require('mongoose');

const PricingPlanSchema = new mongoose.Schema({
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly', 'one-time'],
    required: true
  },
  features: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const PricingPlan = mongoose.model('PricingPlan', PricingPlanSchema);

module.exports = PricingPlan;
