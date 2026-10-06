import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import { S3File } from '../storage/schemas/s3-file.schema';
import { StorageClientMapper } from '../storage/storage-client.mapper';
import { StorageService } from '../storage/storage.service';
import { CreatePostDto } from './dto/request/create-post.dto';
import { PostsPaginatedQueryDto } from './dto/request/posts-paginated-query.dto';
import { UpdatePostDto } from './dto/request/update-post.dto';
import { Post, PostDocument } from './schemas/post.schema';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    private storageService: StorageService,
  ) {}

  async createPost(
    categoryId: string,
    authorId: string,
    createPostDto: CreatePostDto,
  ) {
    let imageKey;
    let image: S3File | undefined;

    if (createPostDto.postImage) {
      imageKey = StorageClientMapper.getImageKey(
        authorId,
        createPostDto.postImage,
      );
      image = await this.storageService.uploadFile(
        imageKey,
        createPostDto.postImage,
      );
    }

    const createdPost = new this.postModel({
      category: new Types.ObjectId(categoryId),
      title: createPostDto.title,
      description: createPostDto.description,
      postImage: image,
      author: new Types.ObjectId(authorId),
    });
    await createdPost.populate(['category', 'author']);
    return createdPost.save();
  }

  async findOnePost(postId: string) {
    return this.postModel
      .findOne({ _id: postId })
      .orFail(new NotFoundException('Post not found'))
      .populate({ path: 'category', populate: { path: 'author' } })
      .populate('author')
      .exec();
  }

  async findAllPosts() {
    return this.postModel
      .find()
      .populate({ path: 'category', populate: { path: 'author' } })
      .populate('author')
      .exec();
  }
  async findPaginated(postsPaginatedQuery: PostsPaginatedQueryDto) {
    const query: QueryFilter<PostDocument> = {
      ...(postsPaginatedQuery.search &&
        ({
          $or: [
            { title: { $regex: postsPaginatedQuery.search, $options: 'i' } },
            {
              description: {
                $regex: postsPaginatedQuery.search,
                $options: 'i',
              },
            },
          ],
        } as QueryFilter<PostDocument>)),
    };

    const totalCount = this.postModel.countDocuments(query);

    const results = this.postModel
      .find(query)
      .sort(postsPaginatedQuery.toMongoDbSort)
      .skip(postsPaginatedQuery.skip)
      .limit(postsPaginatedQuery.limit)
      .exec();

    return Promise.all([totalCount, results]);
  }

  async findPostsByCategory(categoryId: Types.ObjectId) {
    return this.postModel
      .find({ category: categoryId })
      .orFail(new NotFoundException('Posts not found'))
      .populate('category')
      .populate('author')
      .exec();
  }

  async updatePost(id: string, updatePostDto: UpdatePostDto) {
    const updatedPost = this.postModel
      .findByIdAndUpdate(id, {
        title: updatePostDto.title,
        description: updatePostDto.description,
      })
      .orFail(new NotFoundException('Could not find post with id ' + id))
      .exec();

    return updatedPost;
  }

  async deletePost(id: string) {
    await this.postModel
      .findByIdAndDelete(id)
      .orFail(new NotFoundException('Post not found with id ' + id))
      .exec();
  }

  async deleteMany(id: string) {
    await this.postModel.deleteMany({ category: id });
  }

  async deleteManyByUserId(userId: string) {
    await this.postModel.deleteMany({ author: userId });
  }
}
