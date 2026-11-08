import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { BaseResponse } from '../../common/dto/base-response.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ListTransactionsDto } from './dto/list-transactions.dto';
import { TransactionsService } from './transactions.service';

@Controller('books/:bookId/transactions')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bookId', new ParseUUIDPipe()) bookId: string,
    @Body() dto: CreateTransactionDto,
  ) {
    return BaseResponse.success(await this.transactions.create(user.id, bookId, dto));
  }

  @Put(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bookId', new ParseUUIDPipe()) bookId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return BaseResponse.success(await this.transactions.update(user.id, bookId, id, dto));
  }

  @Delete(':id')
  @HttpCode(200)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bookId', new ParseUUIDPipe()) bookId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    await this.transactions.remove(user.id, bookId, id);
    return BaseResponse.success(undefined, 'Transaction deleted successfully.');
  }

  @Get()
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bookId', new ParseUUIDPipe()) bookId: string,
    @Query() dto: ListTransactionsDto,
  ) {
    return BaseResponse.success(await this.transactions.findAll(user.id, bookId, dto));
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bookId', new ParseUUIDPipe()) bookId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return BaseResponse.success(await this.transactions.findOne(user.id, bookId, id));
  }
}
