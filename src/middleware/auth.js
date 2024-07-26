const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Assuming you have a User model

/**
 * JWT based auth
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const authMiddleware = (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user from payload
    req.user = decoded.user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

async function isAuthenticated(req, res, next) {

  if(!req.session.userId&&process.env.AUTH_AUTOLOGIN){
    req.session.userId = (await User.findOne({ email: process.env.AUTH_AUTOLOGIN }))._id
    console.log('AUTH AUTO LOGIN')
  }

  if (req.session.userId) {
    req.user = await User.findOne({ _id: req.session.userId });
    next();
  } else {
    res.redirect('/login');
  }
}

async function canBeAuthenticated(req, res, next) {

  if(!req.session.userId&&process.env.AUTH_AUTOLOGIN){
    req.session.userId = (await User.findOne({ email: process.env.AUTH_AUTOLOGIN }))._id
    console.log('AUTH AUTO LOGIN')
  }

  if (req.session.userId) {
    req.user = await User.findOne({ _id: req.session.userId });
    next();
  } else {
    next()
  }
}

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).render('error', {...global.getEjsData(), message: 'Access denied. Admin only.' });
  }
};

authMiddleware.isAuthenticated  = isAuthenticated
authMiddleware.canBeAuthenticated=canBeAuthenticated
authMiddleware.isAdmin=isAdmin

module.exports = authMiddleware;