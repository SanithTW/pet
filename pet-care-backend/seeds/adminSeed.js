const User = require('../models/User');

const shouldSyncAdminFromEnv = () =>
  process.env.ADMIN_SYNC_ON_START === '1' ||
  process.env.ADMIN_SYNC_ON_START === 'true';

const seedAdminUser = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL?.trim();
    const adminPassword = process.env.ADMIN_PASSWORD?.trim();

    if (!adminEmail || !adminPassword) {
      console.warn(
        'Skipping admin seed: set ADMIN_EMAIL and ADMIN_PASSWORD in pet-care-backend/.env'
      );
      return;
    }

    const existing = await User.findOne({
      email: new RegExp(`^${adminEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    });

    if (existing) {
      if (shouldSyncAdminFromEnv()) {
        existing.role = 'admin';
        existing.name = existing.name || 'System Admin';
        existing.password = adminPassword;
        existing.authProvider = existing.authProvider || 'local';
        await existing.save();
        console.log('Admin user synchronized from .env (ADMIN_SYNC_ON_START):', adminEmail);
      } else {
        console.log('Admin user already exists:', adminEmail);
      }
      return;
    }

    const adminUser = new User({
      name: 'System Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    });

    await adminUser.save();
    console.log('Seeded admin user:', adminEmail);
  } catch (error) {
    console.error('Failed to seed admin user:', error.message);
    throw error;
  }
};

module.exports = seedAdminUser;
