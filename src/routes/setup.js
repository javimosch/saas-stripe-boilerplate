const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

router.get('/', async (req, res) => {
    const { User } = global.getMongooseModels(['User']);
    const superAdmin = await User.findOne({ role: 'super_admin' });
    if (!superAdmin) {
        const users = await User.find();
        return res.render('setup', {...global.getEjsData(), users });
    }
    // Redirect to dashboard or another page if super admin exists
    res.redirect('/dashboard');
});

router.post('/', async (req, res) => {
    const { User } = global.getMongooseModels(['User']);
    const { existingUser, email, password } = req.body;

    if (existingUser) {
        // Convert existing user to super admin
        await User.findByIdAndUpdate(existingUser, { role: 'super_admin' });
    } else {
        // Hash the password before creating a new super admin
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newSuperAdmin = new User({ email, password: hashedPassword, role: 'super_admin' });
        await newSuperAdmin.save();
    }
    res.redirect('/dashboard'); // Redirect after creation
});

module.exports = router;
