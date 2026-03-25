// filepath: server/src/utils/slugify.js
const slugifyLib = require('slugify');

/**
 * Convert string to URL-safe slug
 * Handles unicode and special characters
 */
const createSlug = (text) => {
  return slugifyLib(text, {
    lower: true,
    strict: true,
    trim: true
  });
};

/**
 * Generate unique slug by appending number if duplicate exists
 */
const generateUniqueSlug = async (Model, text, excludeId = null) => {
  let slug = createSlug(text);
  let counter = 0;
  let candidateSlug = slug;

  while (true) {
    const query = { slug: candidateSlug };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await Model.findOne(query);
    if (!existing) break;
    counter++;
    candidateSlug = `${slug}-${counter}`;
  }

  return candidateSlug;
};

module.exports = { createSlug, generateUniqueSlug };
