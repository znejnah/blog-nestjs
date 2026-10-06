import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { Logger, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../_utils/config/env.config';

export const S3_CLIENTS_TOKEN = 'S3_CLIENTS_TOKEN';

export interface IS3Clients {
  internal: S3Client;
  public: S3Client;
}

export const StorageProvider: Provider[] = [
  {
    provide: S3_CLIENTS_TOKEN,
    useFactory: async (
      configService: ConfigService<EnvironmentVariables, true>,
    ): Promise<IS3Clients> => {
      const logger = new Logger('StorageProvider');
      const bucketName = configService.get<string>('S3_BUCKET_NAME');

      const internalEndpoint = configService.get<string>(
        'S3_INTERNAL_ENDPOINT',
      );
      const publicEndpoint = configService.get<string>('S3_PUBLIC_ENDPOINT');

      const accessKey = configService.get<string>('S3_ACCESS_KEY');
      const secretKey = configService.get<string>('S3_SECRET_KEY');
      const region = configService.get<string>('S3_REGION');

      const s3Config = {
        region: region,
        credentials: {
          accessKeyId: accessKey,
          secretAccessKey: secretKey,
        },
        forcePathStyle: true,
      };

      const internalClient = new S3Client({
        ...s3Config,
        endpoint: internalEndpoint.replace(/;+$/, ''),
      });

      const publicClient = new S3Client({
        ...s3Config,
        endpoint: publicEndpoint.replace(/;+$/, ''),
      });

      logger.log(
        `StorageProvider initialized. Internal: ${internalEndpoint} | Public: ${publicEndpoint}`,
      );

      try {
        logger.log(`Attempting to ensure bucket "${bucketName}" exists...`);
        await internalClient.send(
          new CreateBucketCommand({ Bucket: bucketName }),
        );
        logger.log(`Bucket "${bucketName}" created.`);
      } catch (error: any) {
        if (
          error.name === 'BucketAlreadyOwnedByYou' ||
          error.name === 'BucketAlreadyExists'
        ) {
          logger.log(`Bucket "${bucketName}" already exists and is ready.`);
        } else {
          logger.warn(
            `Could not verify bucket "${bucketName}", but proceeding anyway. Error: ${error.message}`,
          );
        }
      }

      return {
        internal: internalClient,
        public: publicClient,
      };
    },
    inject: [ConfigService],
  },
];
