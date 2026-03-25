// filepath: server/src/utils/pagination.js

const parsePaginationParams = (query) => {
  let page = parseInt(query.page) || 1;
  let limit = parseInt(query.limit) || 10;
  const sortParam = query.sort || '-createdAt';

  if (page < 1) page = 1;
  if (limit < 1) limit = 1;
  if (limit > 100) limit = 100;

  const skip = (page - 1) * limit;

  // Parse sort string: "field" for asc, "-field" for desc
  const sort = {};
  sortParam.split(',').forEach(s => {
    const trimmed = s.trim();
    if (trimmed.startsWith('-')) {
      sort[trimmed.slice(1)] = -1;
    } else {
      sort[trimmed] = 1;
    }
  });

  return { page, limit, skip, sort };
};

module.exports = { parsePaginationParams };
