const User = require('../models/User');

const seedAdminUser = async () => {
  try {
    const adminEmail = 'admin@petcare.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('Admin user already exists:', adminEmail);
      return;
    }

    const adminUser = new User({
      name: 'Admin',
      email: adminEmail,
      password: 'admin123',
      role: 'admin'
    });

    await adminUser.save();
    console.log('Seeded admin user:', adminEmail);
  } catch (error) {
    console.error('Failed to seed admin user:', error.message);
    throw error;
  }
};

module.exports = seedAdminUser;
