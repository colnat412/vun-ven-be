import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksModule } from '../books/books.module';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';
import { MonthlyBudgetEntity } from './entities/monthly-budget.entity';
import { CategoryBudgetEntity } from './entities/category-budget.entity';

@Module({
  imports: [BooksModule, TypeOrmModule.forFeature([MonthlyBudgetEntity, CategoryBudgetEntity])],
  controllers: [BudgetsController],
  providers: [BudgetsService],
})
export class BudgetsModule {}
