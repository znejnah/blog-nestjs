import { GetCategoryLightDto } from './get-category-light.dto';
import { PaginatedQueryDto } from '../../../_utils/dto/requests/paginated-query.dto';
import { PaginationDto } from '../../../_utils/dto/responses/pagination.dto';

export class GetCategoryPaginatedDto extends PaginationDto {
  categories: GetCategoryLightDto[];
  constructor(
    categories: GetCategoryLightDto[],
    paginatedQuery: PaginatedQueryDto,
    totalItemsCount: number,
  ) {
    super(paginatedQuery, totalItemsCount);
    this.categories = categories;
  }
}
