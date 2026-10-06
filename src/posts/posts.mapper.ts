import { GetPostDto } from './dto/response/get-post.dto';
import { PostDocument } from './schemas/post.schema';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CategoryMapper } from '../category/category.mapper';
import { UsersMapper } from '../users/users.mapper';
import { GetPostsLightDto } from './dto/response/get-posts-light.dto';
import { PaginatedQueryDto } from '../_utils/dto/requests/paginated-query.dto';
import { GetPostsPaginatedDto } from './dto/response/get-posts-paginated.dto';
import { GetTranslatedPostDto } from './dto/response/get-translated-post.dto';
import { StorageClientMapper } from '../storage/storage-client.mapper';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../_utils/config/env.config';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class PostsMapper {
  constructor(
    private readonly categoryMapper: CategoryMapper,
    private readonly usersMapper: UsersMapper,
    private configService: ConfigService<EnvironmentVariables, true>,
    private storageService: StorageService,
    private storageClientMapper: StorageClientMapper,
  ) {}
  async toGetPostDto(post: PostDocument): Promise<GetPostDto> {
    if (post.category instanceof Types.ObjectId)
      throw new InternalServerErrorException(
        "Category doesn't exist | not populated!",
      );
    if (post.author instanceof Types.ObjectId) {
      throw new InternalServerErrorException(
        "Author of post doesn't exist | not populated!",
      );
    }

    return {
      id: post._id.toString(),
      title: post.title,
      description: post.description,
      postImageUrl: post.postImage?.filename
        ? await this.storageService.getPresignedUrl(post.postImage.key)
        : null,
      author: this.usersMapper.toGetUserDto(post.author),
      category: this.categoryMapper.toGetCategoryLightDto(post.category),
    };
  }

  toGetTranslatedPostDto(
    post: PostDocument,
    lang: string,
  ): GetTranslatedPostDto {
    if (post.category instanceof Types.ObjectId) {
      throw new InternalServerErrorException('Category not populated');
    }

    if (post.author instanceof Types.ObjectId) {
      throw new InternalServerErrorException('Author not populated');
    }

    return {
      id: post._id.toString(),
      title: post.title,
      description: post.description,
      author: this.usersMapper.toGetUserLightDto(post.author),
      category: this.categoryMapper.toGetCategoryLightDto(post.category),
      translations: { lang, ...post.translations.get(lang) },
    };
  }

  toGetLightPostsDto(post: PostDocument): GetPostsLightDto {
    console.log('post-doc', post);
    return {
      id: post._id.toString(),
      title: post.title,
      description: post.description,
    };
  }

  toGetPaginatedPostsDto(
    paginatedQuery: PaginatedQueryDto,
    posts: PostDocument[],
    totalCount: number,
  ) {
    return new GetPostsPaginatedDto(
      posts.map((p) => this.toGetLightPostsDto(p)),
      paginatedQuery,
      totalCount,
    );
  }
}
