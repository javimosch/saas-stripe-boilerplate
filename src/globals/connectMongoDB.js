const mongoose = require('mongoose');

/**
 * Connects to MongoDB using environment variables for configuration.
 */
function connectMongoDB() {
  const dbName = process.env.MONGO_DBNAME;

  if (!dbName) {
    throw new Error('MONGO_DBNAME is required');
  }

  mongoose.connect(process.env.MONGO_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    dbName: dbName // Specify the database name
  })
  .then(() => console.log(`Connected to MongoDB database: ${dbName}`))
  .catch(err => console.error('MongoDB connection error:', err));
}

module.exports = connectMongoDB;