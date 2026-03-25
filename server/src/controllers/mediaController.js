// filepath: server/src/controllers/mediaController.js
const Media = require('../models/Media');
const { uploadFile, deleteFile } = require('../services/cloudflareService');
const { createMediaFromBufferFile } = require('../services/mediaAssetService');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHandler');
const { parsePaginationParams } = require('../utils/pagination');
const auditService = require('../services/auditService');

exports.getAllMedia = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = parsePaginationParams(req.query);
    const { folder, search, mimeType } = req.query;

    const query = {};
    if (folder) query.folder = folder;
    if (mimeType) query.mimeType = { $regex: mimeType };
    if (search) query.$or = [
      { originalName: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];

    const [media, total] = await Promise.all([
      Media.find(query).populate('uploadedBy', 'name').sort(sort).skip(skip).limit(limit).lean(),
      Media.countDocuments(query)
    ]);

    return paginatedResponse(res, media, total, page, limit);
  } catch (error) { next(error); }
};

exports.uploadMedia = async (req, res, next) => {
  try {
    if (!req.file) return errorResponse(res, 'No file uploaded', 400);

    const folder = req.body.folder || 'general';
    const result = await uploadFile(req.file, folder);

    const media = await createMediaFromBufferFile(req.file, result, folder, req.user._id, {
      alt: req.body.alt || '',
      caption: req.body.caption || '',
      tags: req.body.tags ? JSON.parse(req.body.tags) : []
    });

    auditService.log(req.user._id, 'upload', 'Media', media._id, `Uploaded: ${media.originalName}`, null, req);
    return successResponse(res, media, 'File uploaded', 201);
  } catch (error) { next(error); }
};

exports.uploadMultipleMedia = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) return errorResponse(res, 'No files uploaded', 400);

    const folder = req.body.folder || 'general';
    const uploaded = [];

    for (const file of req.files) {
      const result = await uploadFile(file, folder);
      const media = await Media.create({
        filename: result.key.split('/').pop(),
        originalName: result.originalName,
        mimeType: result.mimeType,
        size: result.size,
        url: result.url,
        cloudflareKey: result.key,
        folder,
        uploadedBy: req.user._id
      });
      uploaded.push(media);
    }

    auditService.log(req.user._id, 'upload', 'Media', null, `Uploaded ${uploaded.length} files`, null, req);
    return successResponse(res, uploaded, `${uploaded.length} files uploaded`, 201);
  } catch (error) { next(error); }
};

exports.updateMedia = async (req, res, next) => {
  try {
    const media = await Media.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!media) return errorResponse(res, 'Media not found', 404);
    return successResponse(res, media, 'Media updated');
  } catch (error) { next(error); }
};

exports.deleteMedia = async (req, res, next) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return errorResponse(res, 'Media not found', 404);

    await deleteFile(media.cloudflareKey);
    if (media.thumbnailUrl) {
      const thumbKey = media.cloudflareKey.replace(media.filename, `thumbnails/thumb_${media.filename}`);
      await deleteFile(thumbKey);
    }

    await media.deleteOne();
    auditService.log(req.user._id, 'delete', 'Media', media._id, `Deleted: ${media.originalName}`, null, req);
    return successResponse(res, null, 'Media deleted');
  } catch (error) { next(error); }
};

exports.bulkDeleteMedia = async (req, res, next) => {
  try {
    const { ids } = req.body;
    const mediaItems = await Media.find({ _id: { $in: ids } });

    for (const media of mediaItems) {
      await deleteFile(media.cloudflareKey);
    }

    await Media.deleteMany({ _id: { $in: ids } });
    auditService.log(req.user._id, 'delete', 'Media', null, `Bulk deleted ${ids.length} media`, null, req);
    return successResponse(res, null, `${mediaItems.length} media items deleted`);
  } catch (error) { next(error); }
};

exports.getFolders = async (req, res, next) => {
  try {
    const folders = await Media.distinct('folder');
    return successResponse(res, folders);
  } catch (error) { next(error); }
};
