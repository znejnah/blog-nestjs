import { Injectable } from '@nestjs/common';

import { PostsRepository } from './posts.repository';
import { CreatePostDto } from './dto/request/create-post.dto';
import { UpdatePostDto } from './dto/request/update-post.dto';
import { Types } from 'mongoose';
import { PostsMapper } from './posts.mapper';
import { CategoryMapper } from '../category/category.mapper';
import { UsersMapper } from '../users/users.mapper';
import { PostsPaginatedQueryDto } from './dto/request/posts-paginated-query.dto';
import { TranslateService } from '../translator/translate.service';
import { CommentsService } from '../comments/comments.service';
import { CreatePostCommentDto } from './dto/request/create-post-comment.dto';
import { StorageService } from '../storage/storage.service';
import { StorageClientMapper } from '../storage/storage-client.mapper';

@Injectable()
export class PostsService {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly usersMapper: UsersMapper,
    private readonly postsMapper: PostsMapper,
    private readonly category: CategoryMapper,
    private readonly translateService: TranslateService,
    private readonly commentsService: CommentsService,
    private readonly storageService: StorageService,
    private readonly storageClientMapper: StorageClientMapper,
  ) {}
  async findAllPosts() {
    return this.postsRepository
      .findAllPosts()
      .then((posts) =>
        Promise.all(posts.map((post) => this.postsMapper.toGetPostDto(post))),
      );
  }

  async findOnePostAndTranslate(postId: string, lang: string) {
    const post = await this.postsRepository.findOnePost(postId);
    const existingTransalation = post.translations.get(lang);
    if (existingTransalation) {
      return this.postsMapper.toGetTranslatedPostDto(post, lang);
    }
    const translatedPost = await this.translateService.getTextTranslation(
      post.title,
      post.description,
      lang,
    );
    post.translations.set(lang, translatedPost);

    await post.save();
    // const postToReturn = post.translations.get(lang);
    return this.postsMapper.toGetTranslatedPostDto(post, lang);
  }

  async getPostsPaginated(postsPaginatedQuery: PostsPaginatedQueryDto) {
    const [totalCount, results] =
      await this.postsRepository.findPaginated(postsPaginatedQuery);
    return this.postsMapper.toGetPaginatedPostsDto(
      postsPaginatedQuery,
      results,
      totalCount,
    );
  }

  async findPostByCategory(categoryId: string) {
    const posts = await this.postsRepository.findPostsByCategory(
      new Types.ObjectId(categoryId),
    );

    return posts;
  }

  async createPost(
    categoryId: string,
    authorId: string,
    createPostDto: CreatePostDto,
  ) {
    const post = await this.postsRepository.createPost(
      categoryId,
      authorId,
      createPostDto,
    );

    return this.postsMapper.toGetPostDto(post);
  }

  async commentOnPost(
    postId: string,
    authorId: string,
    createCommentDto: CreatePostCommentDto,
  ) {
    const comment = await this.commentsService.create(
      postId,
      authorId,
      createCommentDto,
    );

    return comment;
  }

  async updatePost(id: string, updatePostDto: UpdatePostDto) {
    return this.postsRepository.updatePost(id, updatePostDto);
  }

  async deletePost(id: string) {
    return this.postsRepository.deletePost(id);
  }

  async deletePostsByCategoryId(id: string) {
    return this.postsRepository.deleteMany(id);
  }

  async deletePostsByUserId(id: string) {
    return this.postsRepository.deleteManyByUserId(id);
  }
}
