const mongoose = require('mongoose');

// Define the User schema
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: false,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'client','super_admin'],
    default: 'client'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  stripe_customer_id:{
    type:String,
  },
  subscriptions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' }],
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }], // Add this line
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: false
  }
});

// Create the User model
const User = mongoose.model('User', UserSchema);

module.exports = User;