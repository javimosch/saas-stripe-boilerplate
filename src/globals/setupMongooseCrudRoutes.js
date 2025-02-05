const express = require('express');
const mongoose = require('mongoose');

module.exports = function setupMongooseCrudRoutes(modelName, options = {}) {
  const router = express.Router();
  const Model = mongoose.model(modelName);

  const { parse, after, deleteConstraintCheck, customRoutes } = options;

  // Helper function to set organization
  const setOrganization = (req, doc) => {
    if (req.user && req.user.organization && Model.schema.paths.organization) {
      doc.organization = req.user.organization;
    }
  };

  // CREATE
  router.post('/', async (req, res) => {
    try {
      if (parse) parse(req);
      const doc = new Model(req.body);
      setOrganization(req, doc);
      await doc.save();
      if (after) await after(doc);
      res.status(201).json(doc);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  // UPDATE
  router.put('/:id', async (req, res) => {
    try {
      if (parse) parse(req);
      const doc = await Model.findById(req.params.id);
      if (!doc) return res.status(404).json({ message: 'Document not found' });
      Object.assign(doc, req.body);
      setOrganization(req, doc);
      await doc.save();
      if (after) await after(doc);
      res.json(doc);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  // Rest of the function remains the same
}
