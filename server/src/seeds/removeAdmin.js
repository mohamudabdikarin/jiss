// filepath: server/src/seeds/removeAdmin.js
/**
 * Remove admin user(s) from MongoDB so you can run seed:admin again.
 *
 * Usage:
 *   node src/seeds/removeAdmin.js              # delete all superadmin users
 *   node src/seeds/removeAdmin.js --email a@b.com   # delete that email (any role)
 */
const mongoose = require('mongoose');
const User = require('../models/User');
const { env } = require('../config/env');

function parseEmailArg() {
  const args = process.argv.slice(2);
  const i = args.indexOf('--email');
  if (i === -1 || !args[i + 1]) return null;
  return String(args[i + 1]).trim().toLowerCase();
}

async function removeAdmin() {
  const emailArg = parseEmailArg();

  if (emailArg) {
    const u = await User.findOneAndDelete({ email: emailArg });
    if (!u) {
      console.log('No user found with email:', emailArg);
      return { deletedCount: 0 };
    }
    console.log('Deleted user:', u.email, '(role:', u.role + ')');
    return { deletedCount: 1 };
  }

  const envEmail = (env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (envEmail) {
    const u = await User.findOneAndDelete({ email: envEmail });
    if (u) {
      console.log('Deleted user matching ADMIN_EMAIL from .env:', u.email);
      return { deletedCount: 1 };
    }
    console.log('No user with ADMIN_EMAIL from .env; removing any superadmin(s) next.');
  }

  const result = await User.deleteMany({ role: 'superadmin' });
  console.log('Deleted superadmin count:', result.deletedCount);
  return result;
}

if (require.main === module) {
  const { validateEnv } = require('../config/env');
  validateEnv();
  const connectDB = require('../config/db');
  connectDB()
    .then(() => removeAdmin())
    .then(() => {
      mongoose.connection.close();
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = removeAdmin;
