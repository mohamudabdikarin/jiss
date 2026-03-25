// filepath: server/src/services/auditService.js
const AuditLog = require('../models/AuditLog');

const auditService = {
  /**
   * Log an admin action (fire and forget)
   */
  log: (userId, action, entity, entityId, description, changes, req) => {
    const entry = {
      user: userId,
      action,
      entity,
      entityId,
      description,
      changes,
      ipAddress: req ? (req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress) : null,
      userAgent: req ? req.headers['user-agent'] : null
    };

    // Fire and forget — don't block the request
    AuditLog.create(entry).catch(err => {
      console.error('Audit log error:', err.message);
    });
  },

  /**
   * Get audit logs with filters and pagination
   */
  getAuditLogs: async (filters = {}, pagination = {}) => {
    const { user, action, entity, startDate, endDate } = filters;
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const query = {};
    if (user) query.user = user;
    if (action) query.action = action;
    if (entity) query.entity = entity;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    return {
      logs,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
  }
};

module.exports = auditService;
