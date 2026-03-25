// filepath: server/src/seeds/seedAdmin.js
const mongoose = require('mongoose');
const User = require('../models/User');
const { env } = require('../config/env');

const seedAdmin = async () => {
  const existing = await User.findOne({ role: 'superadmin' });
  if (existing) {
    console.log('✅ Superadmin already exists:', existing.email);
    return existing;
  }

  const email = env.ADMIN_EMAIL || 'admin@site.com';
  const password = env.ADMIN_PASSWORD || 'Admin@123456';

  const admin = await User.create({
    email,
    password,
    name: 'Super Admin',
    role: 'superadmin',
    isActive: true
  });

  console.log('✅ Superadmin created:');
  console.log('   Email:    ' + email);
  console.log('   Password: (from ADMIN_PASSWORD in .env)');
  console.log('   ⚠️  Change password after first login if needed!');

  return admin;
};

// Allow standalone execution
if (require.main === module) {
  const { validateEnv } = require('../config/env');
  validateEnv();
  const connectDB = require('../config/db');
  connectDB().then(() => seedAdmin()).then(() => {
    mongoose.connection.close();
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = seedAdmin;
