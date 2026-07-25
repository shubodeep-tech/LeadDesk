/**
 * Seed Admin Script
 * Usage: npm run seed   (from the server/ directory)
 *
 * Creates the first admin account using env variables.
 * Safe to re-run — skips if an admin already exists.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Admin    = require('../models/Admin');

(async () => {
  const { MONGO_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error(' Missing required env vars: MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log(' MongoDB connected');

    const existing = await Admin.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (existing) {
      console.log(`ℹ️  Admin already exists: ${existing.email}`);
      process.exit(0);
    }

    await Admin.create({
      name:         ADMIN_NAME || 'Admin',
      email:        ADMIN_EMAIL,
      passwordHash: ADMIN_PASSWORD, // pre-save hook hashes it
    });

    console.log(`✅ Admin created successfully!`);
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`\n⚠️  Remember to change the password after first login!`);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
