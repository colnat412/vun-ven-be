import { BaseResponse } from '../../common/dto/base-response.dto';
import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';

@Controller('books')
export class BooksController {
  constructor(private readonly books: BooksService) {}

  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBookDto) {
    const book = await this.books.create(user.id, dto);
    return new BaseResponse(book);
  }

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    const books = await this.books.findAll(user.id);
    return new BaseResponse(books);
  }

  @Get(':bookId')
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bookId', new ParseUUIDPipe()) bookId: string,
  ) {
    const book = await this.books.findOne(user.id, bookId);
    return new BaseResponse(book);
  }
}
