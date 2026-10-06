import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Category,
  CategoryDocument,
  CategoryEventDocument,
} from './schemas/category.schema';
import { Model, QueryFilter, Types } from 'mongoose';
import { CreateCategoryDto } from './dto/request/create-category.dto';
import { CategoryPaginatedQueryDto } from './dto/request/category-paginated-query.dto';
import { isNil } from '@nestjs/common/internal';
import { EventRepository } from '../event/event.repository';

@Injectable()
export class CategoryRepository {
  private notFoundException = new NotFoundException('Not Found');
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    private readonly eventRepository: EventRepository,
  ) {}

  async createCategory(authorId: string, createCategoryDto: CreateCategoryDto) {
    const createdCategory = await this.categoryModel.create({
      title: createCategoryDto.title,
      description: createCategoryDto.description,
      author: new Types.ObjectId(authorId),
    });

    await createdCategory.populate('author');
    return await createdCategory.save();
  }

  async findAll() {
    const categories = this.categoryModel
      .find()
      .orFail(this.notFoundException)
      .populate('author', '-password')
      .exec();

    return categories;
  }

  async findOne(id: string) {
    const category = await this.categoryModel
      .findOne({ _id: id })
      .orFail(this.notFoundException)
      .populate('author')
      .populate({ path: 'likes', populate: ['category', 'author'] })
      .populate({ path: 'comments', populate: ['category', 'author'] })
      .exec();

    return category as CategoryEventDocument;
  }

  async likeACategory(categoryId: string, userId: string) {
    return this.eventRepository.likePost(userId, categoryId);
  }

  async findPaginated(categoryPaginatedQuery: CategoryPaginatedQueryDto) {
    const query: QueryFilter<CategoryDocument> = {
      ...(!isNil(categoryPaginatedQuery.search) &&
        ({
          $or: [
            { title: { $regex: categoryPaginatedQuery.search, $options: 'i' } },
            {
              description: {
                $regex: categoryPaginatedQuery.search,
                $options: 'i',
              },
            },
          ],
        } as QueryFilter<CategoryDocument>)),
    };
    console.log(query);
    const totalCount = await this.categoryModel.countDocuments(query);

    const results = await this.categoryModel
      .find(query)
      .populate('likes')
      .orFail(this.notFoundException)
      .sort(categoryPaginatedQuery.toMongoDbSort)
      .skip(categoryPaginatedQuery.skip)
      .limit(categoryPaginatedQuery.limit)
      .exec();

    return { totalCount, results };
  }

  async updateCategory(catId: string, updateCategoryDto: CreateCategoryDto) {
    return this.categoryModel
      .findOneAndUpdate({ _id: catId }, updateCategoryDto, {
        returnDocument: 'after',
      })
      .orFail(this.notFoundException)
      .populate('author')
      .exec();
  }

  async delete(id: string) {
    await this.categoryModel
      .findByIdAndDelete(id)
      .orFail(this.notFoundException)
      .exec();
  }
}
