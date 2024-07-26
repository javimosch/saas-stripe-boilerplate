const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  pricingPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'PricingPlan', required: true },
  stripeSubscriptionId: { type: String },
  stripeChargeId: { type: String },
  paymentMethod: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  status: { type: String, required: true },
  subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
  stripeMetadata: { type: Object }
}, {
  timestamps: true // Add timestamps here
});

module.exports = mongoose.model('Order', OrderSchema);
