// filepath: server/src/seeds/index.js
const mongoose = require('mongoose');
const { validateEnv } = require('../config/env');
const connectDB = require('../config/db');
const seedAdmin = require('./seedAdmin');
const { seedNavigation } = require('./seedNavigation');
const seedPages = require('./seedPages');
const seedArticles = require('./seedArticles');
const seedMedia = require('./seedMedia');
const seedComponents = require('./seedComponents');

const runSeeds = async () => {
  try {
    validateEnv();
    await connectDB();

    console.log('\n🌱 Starting database seeding...\n');

    // 1. Seed admin user
    const admin = await seedAdmin();

    // 2. Header + sidebar navigation (classic menu)
    await seedNavigation();

    // 3. Seed pages, footer, settings
    await seedPages(admin);

    // 4. Seed articles (preprints and published)
    await seedArticles(admin);

    // 5. Seed media placeholders
    await seedMedia(admin);

    // 6. Seed components (announcement bar, CTA)
    await seedComponents();

    console.log('\n✅ All seeds completed successfully!\n');
  } catch (error) {
    console.error('❌ Seed error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

runSeeds();
