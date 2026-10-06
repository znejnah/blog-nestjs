import { Controller, Get, Param } from '@nestjs/common';
import { StorageService } from './storage.service';
import { Protect } from '../auth/_utils/decorator/protect.decorator';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Protect()
  @Get('file/:key')
  getFile(@Param('key') key: string) {
    return this.storageService.getPresignedUrl(key);
  }
}
