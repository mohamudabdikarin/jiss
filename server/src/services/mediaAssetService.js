const Media = require('../models/Media');
const { uploadFile, deleteFile } = require('./cloudflareService');
const sharp = require('sharp');

/**
 * Persist a Media row after uploadFile(), including optional thumbnail for raster images.
 */
async function createMediaFromBufferFile(file, uploadResult, folder, userId, options = {}) {
  const { alt = '', caption = '', tags = [] } = options;

  let thumbnailUrl = null;
  let dimensions = null;
  if (file.mimetype.startsWith('image/') && !file.mimetype.includes('svg')) {
    try {
      const metadata = await sharp(file.buffer).metadata();
      dimensions = { width: metadata.width, height: metadata.height };

      const thumbBuffer = await sharp(file.buffer)
        .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();

      const thumbFile = {
        buffer: thumbBuffer,
        originalname: `thumb_${file.originalname}`,
        mimetype: 'image/jpeg',
        size: thumbBuffer.length
      };
      const thumbResult = await uploadFile(thumbFile, `${folder}/thumbnails`);
      thumbnailUrl = thumbResult.url;
    } catch (e) {
      /* thumbnail optional */
    }
  }

  return Media.create({
    filename: uploadResult.key.split('/').pop(),
    originalName: uploadResult.originalName,
    mimeType: uploadResult.mimeType,
    size: uploadResult.size,
    url: uploadResult.url,
    cloudflareKey: uploadResult.key,
    folder,
    dimensions,
    thumbnailUrl,
    alt,
    caption,
    tags,
    uploadedBy: userId
  });
}

/**
 * Remove R2 objects and Media row for this key if present; otherwise delete R2 key only (legacy uploads).
 */
async function deleteMediaStorageAndRecord(cloudflareKey) {
  if (!cloudflareKey) return;
  const media = await Media.findOne({ cloudflareKey });
  if (media) {
    await deleteFile(media.cloudflareKey);
    if (media.thumbnailUrl) {
      const thumbKey = media.cloudflareKey.replace(media.filename, `thumbnails/thumb_${media.filename}`);
      await deleteFile(thumbKey).catch(() => {});
    }
    await media.deleteOne();
  } else {
    await deleteFile(cloudflareKey).catch(() => {});
  }
}

module.exports = { createMediaFromBufferFile, deleteMediaStorageAndRecord };
