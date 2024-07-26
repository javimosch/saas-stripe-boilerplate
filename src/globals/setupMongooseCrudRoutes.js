const express = require('express');
const mongoose = require('mongoose');

module.exports = function (modelName, options = {}) {
  const router = express.Router();
  const Model = mongoose.model(modelName);

  // GET / - Fetch all items with optional population
  router.get('/', async (req, res) => {
    try {
      const query = Model.find();

      // Check if `populate` query parameter is provided
      if (req.query.populate) {
        const populateFields = req.query.populate.split(',').join(' ');
        query.populate(populateFields);
      }

      const items = await query.exec();
      res.json(items);
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error fetching items' });
    }
  });

    // GET /:id - Fetch a single item by ID with optional population
    router.get('/:id', async (req, res) => {
      try {
        const query = Model.findById(req.params.id);
  
        // Check if `populate` query parameter is provided
        if (req.query.populate) {
          const populateFields = req.query.populate.split(',').join(' ');
          query.populate(populateFields);
        }
  
        const item = await query.exec();
        if (!item) {
          return res.status(404).json({ success: false, message: 'Item not found' });
        }
        res.json(item);
      } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching item' });
      }
    });

  // POST /
  router.post('/', async (req, res) => {
    try {
      const newItem = new Model(req.body);
      await newItem.save();
      if (options.after) {
        await options.after(newItem);
      }
      res.json({ success: true, item: newItem });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error adding item' });
    }
  });

  // PUT /:id - Update an item by ID
  router.put('/:id', async (req, res) => {
    try {
      const updatedItem = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!updatedItem) {
        return res.status(404).json({ success: false, message: 'Item not found' });
      }
      if (options.after) {
        await options.after(updatedItem);
      }
      res.json({ success: true, item: updatedItem });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error updating item' });
    }
  });

  // DELETE /:id
  router.delete('/:id', async (req, res) => {
    try {
      const deletedItem = await Model.findByIdAndDelete(req.params.id);
      if (!deletedItem) {
        return res.status(404).json({ success: false, message: 'Item not found' });
      }
      if (options.after) {
        await options.after(deletedItem);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error deleting item' });
    }
  });

  console.log(`setupMongooseCrudRoutes ${modelName} OK`);

  return router;
};
