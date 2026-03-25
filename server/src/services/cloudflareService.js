// filepath: server/src/services/cloudflareService.js
const { PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, CopyObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl: getPresignedUrl } = require('@aws-sdk/s3-request-presigner');
const { getS3Client, getBucketName, getPublicUrl } = require('../config/cloudflare');
const { v4: uuidv4 } = require('uuid');

const sanitizeFilename = (name) => {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
};

/**
 * Upload file to Cloudflare R2
 */
const uploadFile = async (file, folder = 'general') => {
  const client = getS3Client();
  if (!client) throw new Error('Cloudflare R2 not configured');

  const sanitized = sanitizeFilename(file.originalname);
  const key = `${folder}/${Date.now()}-${uuidv4().slice(0, 8)}-${sanitized}`;

  await client.send(new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    CacheControl: 'public, max-age=31536000'
  }));

  return {
    url: `${getPublicUrl()}/${key}`,
    key,
    size: file.size,
    mimeType: file.mimetype,
    originalName: file.originalname
  };
};

/**
 * Delete file from R2
 */
const deleteFile = async (key) => {
  const client = getS3Client();
  if (!client) return false;

  try {
    await client.send(new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: key
    }));
    return true;
  } catch (error) {
    console.error('R2 delete error:', error.message);
    return false;
  }
};

/**
 * Generate presigned URL
 */
const getSignedUrl = async (key, expiresIn = 3600) => {
  const client = getS3Client();
  if (!client) throw new Error('Cloudflare R2 not configured');

  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key
  });

  return getPresignedUrl(client, command, { expiresIn });
};

/**
 * List files with prefix
 */
const listFiles = async (prefix = '', maxKeys = 100) => {
  const client = getS3Client();
  if (!client) return [];

  const result = await client.send(new ListObjectsV2Command({
    Bucket: getBucketName(),
    Prefix: prefix,
    MaxKeys: maxKeys
  }));

  return (result.Contents || []).map(item => ({
    key: item.Key,
    size: item.Size,
    lastModified: item.LastModified
  }));
};

/**
 * Copy file within bucket
 */
const copyFile = async (sourceKey, destinationKey) => {
  const client = getS3Client();
  if (!client) throw new Error('Cloudflare R2 not configured');

  await client.send(new CopyObjectCommand({
    Bucket: getBucketName(),
    CopySource: `${getBucketName()}/${sourceKey}`,
    Key: destinationKey
  }));

  return `${getPublicUrl()}/${destinationKey}`;
};

/**
 * Get file metadata
 */
const getFileMetadata = async (key) => {
  const client = getS3Client();
  if (!client) throw new Error('Cloudflare R2 not configured');

  const result = await client.send(new HeadObjectCommand({
    Bucket: getBucketName(),
    Key: key
  }));

  return {
    contentType: result.ContentType,
    contentLength: result.ContentLength,
    lastModified: result.LastModified
  };
};

module.exports = { uploadFile, deleteFile, getSignedUrl, listFiles, copyFile, getFileMetadata };
