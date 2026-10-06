import { Controller, Get, Query } from '@nestjs/common';
import { TranslateService } from './translate.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Protect } from '../auth/_utils/decorator/protect.decorator';

@ApiTags('translate')
@Controller('translate')
export class TranslateController {
  constructor(private translateService: TranslateService) {}

  @Protect()
  @Get('post')
  @ApiOperation({
    summary: 'Translate posts using DeepL',
  })
  getTranslation(
    @Query('title') title: string,
    @Query('description') description: string,
    @Query('lang') lang: string,
  ) {
    return this.translateService.getTextTranslation(
      title.toString(),
      description.toString(),
      lang.toString(),
    );
  }
}
