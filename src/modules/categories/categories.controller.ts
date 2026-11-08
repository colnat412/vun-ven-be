import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { BaseResponse } from '../../common/dto/base-response.dto';
import { SaveCategoryDto } from './dto/save-category.dto';
import { CategoriesService } from './categories.service';

@Controller('books/:bookId/categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bookId', new ParseUUIDPipe()) bookId: string,
    @Body() dto: SaveCategoryDto,
  ) {
    return BaseResponse.success(await this.categories.save(user.id, bookId, dto));
  }

  @Put(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bookId', new ParseUUIDPipe()) bookId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SaveCategoryDto,
  ) {
    return BaseResponse.success(await this.categories.save(user.id, bookId, dto, id));
  }

  @Delete(':id')
  @HttpCode(200)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bookId', new ParseUUIDPipe()) bookId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    await this.categories.remove(user.id, bookId, id);
    return BaseResponse.success(undefined, 'Category deleted successfully.');
  }
}
