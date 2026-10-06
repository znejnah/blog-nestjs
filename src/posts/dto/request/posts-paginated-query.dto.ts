import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Optional } from 'class-validator-extended';
import { PaginatedQueryDto } from '../../../_utils/dto/requests/paginated-query.dto';

export class PostsPaginatedQueryDto extends PaginatedQueryDto {
  @ApiPropertyOptional({ description: 'Search by post title' })
  @IsString()
  @Optional()
  search?: string;
}
