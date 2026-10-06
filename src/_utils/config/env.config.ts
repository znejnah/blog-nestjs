import { Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { IsNumber, IsString, validateSync } from 'class-validator';
import { exit } from 'process';

export class EnvironmentVariables {
  @IsString()
  DEEPL_URL: string;

  @IsString()
  DEEPL_AUTH_KEY: string;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  MONGODB_URL: string;

  @IsString()
  JWT_EXPIRATION: string;

  @IsNumber()
  PORT: number;

  @IsString()
  S3_INTERNAL_ENDPOINT: string;

  @IsString()
  S3_PUBLIC_ENDPOINT: string;

  @IsNumber()
  S3_PORT: number;

  @IsString()
  S3_ACCESS_KEY: string;

  @IsString()
  S3_SECRET_KEY: string;

  @IsString()
  S3_BUCKET_NAME: string;

  @IsString()
  S3_REGION: string;

  @IsNumber()
  S3_PRESIGNED_URL_EXPIRATION: number;

  @IsNumber()
  UPLOAD_MAX_FILES: number;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length) {
    new Logger(validateEnv.name).error(errors.toString());
    exit();
  }
  return validatedConfig;
}
