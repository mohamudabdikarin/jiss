// filepath: server/src/services/backupService.js
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { uploadFile, deleteFile, listFiles, getSignedUrl } = require('./cloudflareService');
const { getS3Client } = require('../config/cloudflare');
const { env } = require('../config/env');

const COLLECTIONS = ['users', 'pages', 'sections', 'navigations', 'footers', 'articles', 'categories', 'media', 'sitesettings', 'components', 'redirects'];

const LOCAL_BACKUPS_DIR = path.join(__dirname, '..', '..', 'data', 'backups');
const LOCAL_PREFIX = 'local/';

function ensureBackupDir() {
  if (!fs.existsSync(LOCAL_BACKUPS_DIR)) {
    fs.mkdirSync(LOCAL_BACKUPS_DIR, { recursive: true });
  }
}

function isR2Configured() {
  return !!(env.CLOUDFLARE_R2_ENDPOINT && env.CLOUDFLARE_R2_ACCESS_KEY_ID && env.CLOUDFLARE_R2_SECRET_ACCESS_KEY && env.CLOUDFLARE_R2_BUCKET_NAME);
}

const backupService = {
  /**
   * Create a full database backup (uses local storage if R2 not configured)
   */
  createBackup: async () => {
    const db = mongoose.connection.db;
    const backupData = {};

    for (const collection of COLLECTIONS) {
      try {
        const data = await db.collection(collection).find({}).toArray();
        backupData[collection] = data;
      } catch (e) {
        backupData[collection] = [];
      }
    }

    const jsonStr = JSON.stringify(backupData, null, 2);
    const buffer = Buffer.from(jsonStr, 'utf-8');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json`;

    if (isR2Configured() && getS3Client()) {
      try {
        const file = { buffer, originalname: filename, mimetype: 'application/json', size: buffer.length };
        const result = await uploadFile(file, 'backups');
        return {
          filename,
          url: result.url,
          key: result.key,
          size: result.size,
          createdAt: new Date(),
          storage: 'r2',
          collections: Object.keys(backupData).map(k => ({ name: k, count: backupData[k].length }))
        };
      } catch (e) {
        console.warn('R2 backup upload failed, using local fallback:', e.message);
      }
    }

    // Local fallback (when R2 not configured or upload failed)
    ensureBackupDir();
    const localKey = `${LOCAL_PREFIX}${filename}`;
    const filepath = path.join(LOCAL_BACKUPS_DIR, filename);
    fs.writeFileSync(filepath, buffer, 'utf-8');

    return {
      filename,
      key: localKey,
      size: buffer.length,
      createdAt: new Date(),
      lastModified: new Date(),
      storage: 'local',
      collections: Object.keys(backupData).map(k => ({ name: k, count: backupData[k].length }))
    };
  },

  /**
   * Restore from backup (supports both R2 and local)
   */
  restoreBackup: async (backupKey) => {
    let backupData;

    if (backupKey.startsWith(LOCAL_PREFIX)) {
      const filename = backupKey.replace(LOCAL_PREFIX, '');
      const filepath = path.join(LOCAL_BACKUPS_DIR, filename);
      if (!fs.existsSync(filepath)) throw new Error('Backup file not found');
      const jsonStr = fs.readFileSync(filepath, 'utf-8');
      backupData = JSON.parse(jsonStr);
    } else {
      const { GetObjectCommand } = require('@aws-sdk/client-s3');
      const { getBucketName } = require('../config/cloudflare');
      const client = getS3Client();
      if (!client) throw new Error('Cloudflare R2 not configured');
      const response = await client.send(new GetObjectCommand({
        Bucket: getBucketName(),
        Key: backupKey
      }));
      const bodyStr = await response.Body.transformToString();
      backupData = JSON.parse(bodyStr);
    }

    const db = mongoose.connection.db;
    const results = {};

    for (const [collection, data] of Object.entries(backupData)) {
      if (data && data.length > 0) {
        try {
          await db.collection(collection).deleteMany({});
          await db.collection(collection).insertMany(data);
          results[collection] = { restored: data.length };
        } catch (e) {
          results[collection] = { error: e.message };
        }
      }
    }

    return results;
  },

  /**
   * List all backups (local + R2 if configured)
   */
  listBackups: async () => {
    const backups = [];

    // Local backups
    ensureBackupDir();
    const files = fs.readdirSync(LOCAL_BACKUPS_DIR).filter(f => f.endsWith('.json'));
    for (const f of files) {
      const filepath = path.join(LOCAL_BACKUPS_DIR, f);
      const stat = fs.statSync(filepath);
      backups.push({
        key: LOCAL_PREFIX + f,
        size: stat.size,
        lastModified: stat.mtime,
        storage: 'local'
      });
    }

    // R2 backups (if configured)
    if (isR2Configured()) {
      try {
        const r2Files = await listFiles('backups/', 50);
        const r2List = r2Files
          .filter(f => f.key.endsWith('.json'))
          .map(f => ({ key: f.key, size: f.size, lastModified: f.lastModified, storage: 'r2' }));
        backups.push(...r2List);
      } catch (e) {
        console.warn('R2 list backups failed:', e.message);
      }
    }

    return backups.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
  },

  /**
   * Delete a backup
   */
  deleteBackup: async (key) => {
    if (key.startsWith(LOCAL_PREFIX)) {
      const filename = key.replace(LOCAL_PREFIX, '');
      const filepath = path.join(LOCAL_BACKUPS_DIR, filename);
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      return;
    }
    return deleteFile(key);
  },

  /**
   * Get download URL or stream path for backup
   * For R2: returns presigned URL
   * For local: returns { stream: true } so controller can stream the file
   */
  getDownloadInfo: async (key) => {
    if (key.startsWith(LOCAL_PREFIX)) {
      const filename = key.replace(LOCAL_PREFIX, '');
      const filepath = path.join(LOCAL_BACKUPS_DIR, filename);
      if (!fs.existsSync(filepath)) throw new Error('Backup file not found');
      return { stream: true, filepath, filename };
    }
    const url = await getSignedUrl(key, 3600);
    return { downloadUrl: url };
  }
};

module.exports = backupService;
