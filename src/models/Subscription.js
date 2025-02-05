const mongoose = require('mongoose');
const moment = require('moment-timezone');

const SubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: false
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: false
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: false
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  stripeSubscriptionId: {
    type: String,
    required: false
  },
  stripeMetadata:{
    type:Object,
  },
  status: {
    type: mongoose.Schema.Types.Mixed,
    enum: ['active', 'cancelled', 'expired'],
    default: 'active'
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  }
});

SubscriptionSchema.virtual('startDateFormatted').get(function() {
  const format = process.env.DATETIME_FORMAT || 'YYYY-MM-DD';
  return moment.tz(this.startDate, format, process.env.MOMENT_TZ).format(format);
});

SubscriptionSchema.virtual('endDateFormatted').get(function() {
  const format = process.env.DATETIME_FORMAT || 'YYYY-MM-DD';
  return moment.tz(this.endDate, format, process.env.MOMENT_TZ).format(format);
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);