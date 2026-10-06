import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FormDataRequest } from 'nestjs-form-data';
import type { UserDocument } from 'src/users/schemas/users.schema';
import { Protect } from '../auth/_utils/decorator/protect.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConnectedUser } from '../users/_utils/decorator/connected-user.decorator';
import { CreatePostCommentDto } from './dto/request/create-post-comment.dto';
import { CreatePostDto } from './dto/request/create-post.dto';
import { PostsPaginatedQueryDto } from './dto/request/posts-paginated-query.dto';
import { UpdatePostDto } from './dto/request/update-post.dto';
import { PostsService } from './posts.service';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly jwtAuthGuard: JwtAuthGuard,
  ) {}

  @Protect()
  @Post(':categoryId')
  @ApiConsumes('multipart/form-data')
  @FormDataRequest()
  create(
    @ConnectedUser() user: UserDocument,
    @Param('categoryId') categoryId: string,
    @Body() createPostDto: CreatePostDto,
  ) {
    console.log(createPostDto);

    return this.postsService.createPost(categoryId, user.id, createPostDto);
  }

  @Protect()
  @Post(':postId/comment')
  commentOnPost(
    @ConnectedUser() user: UserDocument,
    @Param('postId') postId: string,
    @Body() commentDto: CreatePostCommentDto,
  ) {
    return this.postsService.commentOnPost(postId, user.id, commentDto);
  }

  @Protect()
  @Get()
  get(@Query() postsPaginatedQuery: PostsPaginatedQueryDto) {
    // return this.postsService.findAllPosts();
    return this.postsService.getPostsPaginated(postsPaginatedQuery);
  }

  @Protect()
  @Get('all')
  findAll() {
    return this.postsService.findAllPosts();
  }

  @Protect()
  @Get(':categoryId')
  getOne(@Param('categoryId') categoryId: string) {
    return this.postsService.findPostByCategory(categoryId);
  }

  @Protect()
  @Put(':id')
  update(
    @ConnectedUser() user: UserDocument,
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    console.log(id);
    console.log(updatePostDto);
    return this.postsService.updatePost(id, updatePostDto);
  }

  @Protect()
  @Delete(':id')
  delete(@ConnectedUser() user: UserDocument, @Param('id') id: string) {
    return this.postsService.deletePost(id);
  }

  //   Posts with translation

  @Protect()
  @Get(':id/translate')
  translatePost(@Param('id') id: string, @Query('lang') lang: string = 'fr') {
    return this.postsService.findOnePostAndTranslate(id, lang);
  }
}
