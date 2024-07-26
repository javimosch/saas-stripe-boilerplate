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
app.use('/tools', require('./routes/tools'));
app.use('/blog', require('./routes/blog'));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/services', require('./routes/services-apis'));
app.use('/api/pricing-plans',global.setupMongooseCrudRoutes('PricingPlan',{
    after: global.associatePricingPlanToService
}))

const PORT = process.env.PORT || 3000;

global.setupErrorHandlers(app)

app.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`));  