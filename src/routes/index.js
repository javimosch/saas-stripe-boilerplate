const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Home page route
router.get('/',authMiddleware.canBeAuthenticated, (req, res) => {
  res.redirect('/services')
  //res.render('home', { ...global.getEjsData(),title: 'Integreria - AI Integration for SMEs',user:req.user||null });
});

// About page route
router.get('/about',authMiddleware.canBeAuthenticated, (req, res) => {
  res.redirect('/services')
  //res.render('about', { ...global.getEjsData(),title: 'About Integreria',user:req.user||null  });
});


module.exports = router;