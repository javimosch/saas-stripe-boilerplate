const express = require('express');
const router = express.Router();
const {isSuperAdmin} = require('../../middleware/auth');
const mongoose = require('mongoose');

// GET /admin/manage-organizations
router.get('/manage-organizations', isSuperAdmin, async (req, res) => {
  try {
    const { Organization } = global.getMongooseModels(['Organization']);
    const organizations = req.user.role === 'super_admin' 
      ? await Organization.find()
      : await Organization.find({ _id: req.user.organization });
    res.render('admin/organizations', { ...global.getEjsData(), organizations });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).render('error', { message: 'Error fetching organizations' });
  }
});

// Create Organization
router.post('/organizations', isSuperAdmin, async (req, res) => {
    try {
        const { Organization } = global.getMongooseModels(['Organization']);
        const organization = new Organization(req.body);
        await organization.save();
        res.status(201).json({ success: true, organization });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Get Organization Details
router.get('/organizations/:id', isSuperAdmin, async (req, res) => {
    try {
        const { Organization } = global.getMongooseModels(['Organization']);
        const organization = await Organization.findById(req.params.id);
        if (!organization) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
        }
        
        const modelType = req.query.modelType || 'User';
        const Model = mongoose.model(modelType);
        const linkedDocuments = await Model.find({ organization: organization._id });
        
        const availableModels = ['User', 'PricingPlan', 'Order', 'Tool', 'Subscription', 'Service'];
        
        res.json({ success: true, organization, linkedDocuments, availableModels });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update Organization
router.put('/organizations/:id', isSuperAdmin, async (req, res) => {
    try {
        const { Organization } = global.getMongooseModels(['Organization']);
        const organization = await Organization.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!organization) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
        }
        res.json({ success: true, organization });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Delete Organization
router.delete('/organizations/:id', isSuperAdmin, async (req, res) => {
    try {
        const { Organization } = global.getMongooseModels(['Organization']);
        const organization = await Organization.findByIdAndDelete(req.params.id);
        if (!organization) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
        }
        res.json({ success: true, message: 'Organization deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Link Document to Organization
router.post('/organizations/:id/link', isSuperAdmin, async (req, res) => {
    try {
        const { modelType, documentId } = req.body;
        const Model = mongoose.model(modelType);
        const document = await Model.findByIdAndUpdate(documentId, { organization: req.params.id }, { new: true });
        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }
        res.json({ success: true, document });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Fetch Unlinked Documents for Organization
router.get('/organizations/:id/unlinked', isSuperAdmin, async (req, res) => {
  try {
    const { modelType } = req.query;
    const Model = mongoose.model(modelType);
    const unlinkedDocuments = await Model.find({ organization: { $exists: false } });
    res.json({ success: true, unlinkedDocuments });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;