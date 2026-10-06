import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListBucketsCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Buffer } from 'buffer';
import { MemoryStoredFile } from 'nestjs-form-data';
import { Readable } from 'typeorm/browser/platform/BrowserPlatformTools';
import { EnvironmentVariables } from '../_utils/config/env.config';
import { MIME_TYPE } from '../_utils/config/mimetypes';
import { S3File } from './schemas/s3-file.schema';

import { S3_CLIENTS_TOKEN, type IS3Clients } from './storage.provider';

@Injectable()
export class StorageService {
  private readonly BUCKET_NAME: string;
  private readonly RUSTFS_PRESIGNED_URL_EXPIRATION_TIME = 3600;
  private readonly CHUNK_SIZE = 5 * 1024 * 1024;
  private logger = new Logger('StorageService');

  constructor(
    @Inject(S3_CLIENTS_TOKEN) private readonly s3Clients: IS3Clients,
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {
    this.BUCKET_NAME = this.configService.get('S3_BUCKET_NAME');
  }

  async bucketsList() {
    const bucketsCommand = new ListBucketsCommand({});
    return this.s3Clients.internal.send(bucketsCommand);
  }

  async getFile(userKey: string) {
    const getFileCommand = new GetObjectCommand({
      Bucket: this.BUCKET_NAME,
      Key: userKey,
    });

    const file = await this.s3Clients.internal
      .send(getFileCommand)
      .then((data) => data?.Body);
    console.log(file);
    return file as Readable;
  }

  async uploadFile(
    key: string,
    fileOrBuffer: MemoryStoredFile | Buffer,
    mimeType?: MIME_TYPE,
    fileName?: string,
  ): Promise<S3File> {
    const isBuffer = Buffer.isBuffer(fileOrBuffer);

    if (isBuffer && (!mimeType || !fileName)) {
      throw new Error(
        'Mimetype and filename are required when passing a buffer',
      );
    }

    const buffer = isBuffer ? fileOrBuffer : fileOrBuffer.buffer;
    const size = isBuffer ? fileOrBuffer.length : fileOrBuffer.size;
    const mimetype = isBuffer ? mimeType! : fileOrBuffer.mimetype;
    const originalName = isBuffer ? fileName! : fileOrBuffer.originalName;

    const uploadCommand = new PutObjectCommand({
      Bucket: this.BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    });

    try {
      await this.s3Clients.internal.send(uploadCommand);

      return {
        key: key,
        filename: originalName,
        mimeType: mimetype,
        createdAt: new Date(),
        size: size,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to upload file to RustFS: ${errorMessage}`);
      throw error;
    }
  }

  async getPresignedUrl(key: string, bucket?: string) {
    if (!bucket) bucket = this.BUCKET_NAME;

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Clients.public, command, {
      expiresIn: this.RUSTFS_PRESIGNED_URL_EXPIRATION_TIME,
    });
  }

  deleteFile = async (fileKey: string) => {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: this.BUCKET_NAME,
      Key: fileKey,
    });
    return this.s3Clients.internal.send(deleteCommand);
  };
}
