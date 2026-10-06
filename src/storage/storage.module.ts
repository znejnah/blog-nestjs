import { Global, Module } from '@nestjs/common';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { StorageClientMapper } from './storage-client.mapper';
import { StorageProvider } from './storage.provider';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/users.module';

@Global()
@Module({
  imports: [ConfigModule, UsersModule],
  controllers: [StorageController],
  providers: [StorageService, StorageClientMapper, ...StorageProvider],
  exports: [StorageService, StorageClientMapper],
})
export class StorageModule {}
