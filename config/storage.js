import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const STORAGE_DRIVER = process.env.STORAGE_DRIVER || 'local';

// Subdirectories to ensure on local filesystem
const subFolders = ['banners', 'products', 'posts', 'brands', 'pages', 'media'];
subFolders.forEach((folder) => {
  const dirPath = path.join(rootDir, 'public', 'uploads', folder);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

class LocalStorageDriver {
  constructor() {
    this.name = 'local';
    this.baseUploadDir = path.join(rootDir, 'public', 'uploads');
  }

  async save(buffer, filename, mimeType = 'application/octet-stream', subFolder = 'media') {
    const targetDir = path.join(this.baseUploadDir, subFolder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, filename);
    await fs.promises.writeFile(filePath, buffer);
    const url = `/uploads/${subFolder}/${filename}`;

    logger.debug(`[LocalStorage] Saved ${url} (${buffer.length} bytes)`);
    return {
      driver: 'local',
      filename,
      subFolder,
      url,
      path: filePath,
      size: buffer.length,
      mimeType
    };
  }

  async delete(fileUrl) {
    if (!fileUrl) return false;
    try {
      const cleanPath = fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl;
      const fullPath = path.join(rootDir, 'public', cleanPath);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        logger.debug(`[LocalStorage] Deleted ${fullPath}`);
        return true;
      }
      return false;
    } catch (err) {
      logger.warn(`[LocalStorage] Failed to delete file ${fileUrl}: ${err.message}`);
      return false;
    }
  }

  getUrl(filename, subFolder = 'media') {
    return `/uploads/${subFolder}/${filename}`;
  }
}

class S3StorageDriver {
  constructor() {
    this.name = 's3';
    this.bucket = process.env.S3_BUCKET;
    this.region = process.env.S3_REGION || 'us-east-1';
    this.cdnUrl = process.env.S3_CDN_URL;
    this.client = null;
    this.initClient();
  }

  async initClient() {
    if (!process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY || !this.bucket) {
      logger.warn('[S3Storage] S3 credentials or bucket not configured. S3 driver will fall back to local storage.');
      return;
    }

    try {
      const { S3Client } = await import('@aws-sdk/client-s3');
      const config = {
        region: this.region,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY,
          secretAccessKey: process.env.S3_SECRET_KEY
        }
      };
      if (process.env.S3_ENDPOINT) {
        config.endpoint = process.env.S3_ENDPOINT;
        config.forcePathStyle = true;
      }
      this.client = new S3Client(config);
      logger.info(`[S3Storage] S3 client initialized for bucket ${this.bucket}`);
    } catch (err) {
      logger.warn(`[S3Storage] @aws-sdk/client-s3 is not available. Falling back to local storage.`);
    }
  }

  async save(buffer, filename, mimeType = 'application/octet-stream', subFolder = 'media') {
    if (!this.client || !this.bucket) {
      logger.warn('[S3Storage] S3 client not ready. Saving to local storage fallback.');
      return localDriver.save(buffer, filename, mimeType, subFolder);
    }

    try {
      const { PutObjectCommand } = await import('@aws-sdk/client-s3');
      const key = `uploads/${subFolder}/${filename}`;

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType
      });

      await this.client.send(command);

      const url = this.cdnUrl
        ? `${this.cdnUrl.replace(/\/$/, '')}/${key}`
        : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

      logger.debug(`[S3Storage] Uploaded ${url} (${buffer.length} bytes)`);
      return {
        driver: 's3',
        filename,
        subFolder,
        url,
        key,
        size: buffer.length,
        mimeType
      };
    } catch (uploadError) {
      logger.error(`[S3Storage] Upload error: ${uploadError.message}. Falling back to local storage.`);
      return localDriver.save(buffer, filename, mimeType, subFolder);
    }
  }

  async delete(fileUrl) {
    if (!this.client || !this.bucket) {
      return localDriver.delete(fileUrl);
    }

    try {
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      let key = fileUrl;
      if (fileUrl.includes('uploads/')) {
        key = fileUrl.substring(fileUrl.indexOf('uploads/'));
      }

      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      await this.client.send(command);
      logger.debug(`[S3Storage] Deleted ${key} from bucket ${this.bucket}`);
      return true;
    } catch (err) {
      logger.warn(`[S3Storage] Failed to delete S3 file ${fileUrl}: ${err.message}`);
      return false;
    }
  }

  getUrl(filename, subFolder = 'media') {
    const key = `uploads/${subFolder}/${filename}`;
    return this.cdnUrl
      ? `${this.cdnUrl.replace(/\/$/, '')}/${key}`
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }
}

const localDriver = new LocalStorageDriver();
const s3Driver = new S3StorageDriver();

export const storage = STORAGE_DRIVER === 's3' ? s3Driver : localDriver;
export const getStorageDriver = (driverName = STORAGE_DRIVER) => {
  return driverName === 's3' ? s3Driver : localDriver;
};

export default storage;
