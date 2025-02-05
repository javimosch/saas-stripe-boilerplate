const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();

//Globals: Single file functions (helpers)
require('./globals/injectGlobals')(require('path').join(__dirname, 'globals'));

const app = express();

global.configureSession(app)

//Models: Mongoose models
global.loadModelsSync(require('path').join(__dirname, 'models'));

global.connectMongoDB()

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

require('./i18n/index')(app)

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/authViews'));
app.use('/services', require('./routes/services-public-views'));
app.use('/subscribe', require('./routes/subscribe'));
app.use('/stripe', require('./routes/stripe'));
app.use('/contact', require('./routes/contact'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/profile', require('./routes/profile'));
app.use('/admin', require('./routes/admin'));
app.use('/blog', require('./routes/blog'));
app.use('/setup', require('./routes/setup'));

/**
 * Private APIs
 */
const authM = require('./middleware/auth');
app.use('/api', authM.canBeAuthenticated)
app.use('/api/tools', authM.isAdmin, (req, res, next) => {
  global.setupMongooseCrudRoutes('Tool', {
    parse: req => {
      const mongoose = require('mongoose')
      if (req.body.pricingPlans) {
        req.body.pricingPlans = JSON.parse(req.body.pricingPlans)
      }
    }
  })(req, res, next);
});
app.use('/api/pricing-plans', authM.isAdmin, (req, res, next) => {
  global.setupMongooseCrudRoutes('PricingPlan', {
    after: global.associatePricingPlanToService,
    deleteConstraintCheck: global.pricingPlanDeleteConstraintCheck
  })(req, res, next);
});

app.use('/api/services', authM.isAdmin, (req, res, next) => {
  global.setupMongooseCrudRoutes('Service', {
    deleteConstraintCheck: global.serviceDeleteConstraintCheck,
    customRoutes: router => {
      router.patch('/:serviceId/toggle-active', async (req, res) => {
        const { Service } = global.getMongooseModels(['Service']);
        const serviceId = req.params.serviceId;
        try {
          const service = await Service.findById(serviceId);
          if (!service) {
            return res.status(404).json({ message: 'Service not found' });
          }
          service.active = req.body.active ? true : false;
          await service.save();
          res.json({ message: 'Service active status updated' });
        } catch (error) {
          console.error(error);
          res.status(500).json({ message: 'Error updating service active status' });
        }
      });
    }
  })(req, res, next);
});

/**
 * Public APIs
 */
app.use('/api/auth', require('./routes/auth'));

const PORT = process.env.PORT || 3000;

global.setupErrorHandlers(app)

app.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`));