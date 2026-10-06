import { PaginationDto } from '../../../_utils/dto/responses/pagination.dto';
import { GetPostsLightDto } from './get-posts-light.dto';
import { PaginatedQueryDto } from '../../../_utils/dto/requests/paginated-query.dto';

export class GetPostsPaginatedDto extends PaginationDto {
  posts: GetPostsLightDto[];
  constructor(
    posts: GetPostsLightDto[],
    paginatedQuery: PaginatedQueryDto,
    totalItemsCount: number,
  ) {
    super(paginatedQuery, totalItemsCount);
    this.posts = posts;
  }
}
