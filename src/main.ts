import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { EnvironmentVariables } from './_utils/config/env.config';
import SwaggerCustomOptionsConfig from './_utils/config/swagger-custom-options.config';
import ValidationPipeOptionsConfig from './_utils/config/validation-pipe-options.config';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  const configService = app.get(ConfigService<EnvironmentVariables, true>);
  const port: number = configService.get('PORT');

  app
    .setGlobalPrefix('blog-api/v1')
    .useGlobalPipes(new ValidationPipe(ValidationPipeOptionsConfig))
    .enableCors();

  const config = new DocumentBuilder()
    .setTitle('Blog API')
    .setDescription('Routes description of Blog API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/doc', app, document, SwaggerCustomOptionsConfig);

  await app.listen(port);
}

void bootstrap();
