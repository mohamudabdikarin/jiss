// filepath: server/src/utils/responseHandler.js

const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const errorResponse = (res, message = 'Error', statusCode = 400, errors = null) => {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

const paginatedResponse = (res, data, total, page, limit) => {
  const pages = Math.ceil(total / limit);
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages,
      hasNext: page < pages,
      hasPrev: page > 1
    }
  });
};

module.exports = { successResponse, errorResponse, paginatedResponse };
