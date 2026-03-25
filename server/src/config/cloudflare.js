// filepath: server/src/config/cloudflare.js
const { S3Client } = require('@aws-sdk/client-s3');
const { env } = require('./env');

let s3Client = null;

const getS3Client = () => {
  if (!env.CLOUDFLARE_R2_ENDPOINT) {
    console.warn('⚠️  Cloudflare R2 not configured — file uploads will be disabled');
    return null;
  }

  if (!s3Client) {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: env.CLOUDFLARE_R2_ENDPOINT,
      credentials: {
        accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
        secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
      }
    });
  }

  return s3Client;
};

const getBucketName = () => env.CLOUDFLARE_R2_BUCKET_NAME;
const getPublicUrl = () => env.CLOUDFLARE_R2_PUBLIC_URL;

module.exports = { getS3Client, getBucketName, getPublicUrl };
