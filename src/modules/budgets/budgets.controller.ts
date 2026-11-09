import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { BaseResponse } from '../../common/dto/base-response.dto';
import { BudgetsService } from './budgets.service';
import { SaveBudgetDto, SaveCategoryBudgetDto } from './dto/save-budget.dto';

@Controller('books/:bookId/budgets')
export class BudgetsController {
  constructor(private readonly budgets: BudgetsService) {}

  @Post(':month/copy-previous')
  async copyPrevious(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bookId', new ParseUUIDPipe()) bookId: string,
    @Param('month') month: string,
  ) {
    return BaseResponse.success(await this.budgets.copyPrevious(user.id, bookId, month));
  }

  @Get(':month')
  async getMonth(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bookId', new ParseUUIDPipe()) bookId: string,
    @Param('month') month: string,
  ) {
    return BaseResponse.success(await this.budgets.getMonth(user.id, bookId, month));
  }

  @Put(':month')
  async setTotal(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bookId', new ParseUUIDPipe()) bookId: string,
    @Param('month') month: string,
    @Body() dto: SaveBudgetDto,
  ) {
    return BaseResponse.success(
      await this.budgets.setTotal(user.id, bookId, month, dto.totalLimitVnd),
    );
  }

  @Put(':month/categories/:categoryId')
  async setCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bookId', new ParseUUIDPipe()) bookId: string,
    @Param('month') month: string,
    @Param('categoryId', new ParseUUIDPipe()) categoryId: string,
    @Body() dto: SaveCategoryBudgetDto,
  ) {
    return BaseResponse.success(
      await this.budgets.setCategory(user.id, bookId, month, categoryId, dto.limitVnd),
    );
  }

  @Delete(':month/categories/:categoryId')
  async removeCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bookId', new ParseUUIDPipe()) bookId: string,
    @Param('month') month: string,
    @Param('categoryId', new ParseUUIDPipe()) categoryId: string,
  ) {
    return BaseResponse.success(
      await this.budgets.removeCategory(user.id, bookId, month, categoryId),
    );
  }
}
