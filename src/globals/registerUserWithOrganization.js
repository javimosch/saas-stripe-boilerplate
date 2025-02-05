const bcrypt = require('bcrypt');

async function registerUserWithOrganization(username, email, password) {
  const { User, Organization } = global.getMongooseModels(['User', 'Organization']);

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('User already exists');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create a new organization with a random name
  const randomOrgName = `Org_${Math.random().toString(36).substring(7)}`;
  const newOrg = new Organization({ name: randomOrgName });
  await newOrg.save();

  // Create new user with the new organization
  const newUser = new User({
    username,
    email,
    password: hashedPassword,
    organization: newOrg._id
  });

  await newUser.save();

  return newUser;
}

module.exports = registerUserWithOrganization;
