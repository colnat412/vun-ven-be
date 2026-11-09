import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { BookEntity } from '../books/entities/book.entity';
import { BooksService } from '../books/books.service';
import { CategoryEntity } from '../categories/entities/category.entity';
import { TransactionEntity } from '../transactions/entities/transaction.entity';
import { budgetMonth, budgetProgress, previousBudgetMonth } from './budget.utils';
import { MonthlyBudgetEntity } from './entities/monthly-budget.entity';
import { CategoryBudgetEntity } from './entities/category-budget.entity';

@Injectable()
export class BudgetsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly books: BooksService,
  ) {}

  async getMonth(ownerId: string, bookId: string, month: string) {
    const { startDate, endDate } = budgetMonth(month);
    await this.books.findOwned(ownerId, bookId);
    // Read limits and actual spending from one consistent database snapshot.
    return this.dataSource.transaction('REPEATABLE READ', async (manager) => {
      const budget = await manager.findOneBy(MonthlyBudgetEntity, { bookId, startDate });
      const limits = budget
        ? await manager.findBy(CategoryBudgetEntity, { bookId, budgetId: budget.id })
        : [];
      const spending = await manager
        .createQueryBuilder(TransactionEntity, 'tx')
        .select('tx.categoryId', 'categoryId')
        .addSelect('CAST(SUM(tx.amountVnd) AS CHAR)', 'spentVnd')
        .where('tx.bookId = :bookId', { bookId })
        .andWhere('tx.kind = :kind', { kind: 'expense' })
        .andWhere('tx.occurredOn BETWEEN :startDate AND :endDate', { startDate, endDate })
        .groupBy('tx.categoryId')
        .getRawMany<{ categoryId: string; spentVnd: string }>();
      const categories = await manager.find(CategoryEntity, {
        where: { bookId },
        order: { sortOrder: 'ASC', name: 'ASC', id: 'ASC' },
      });
      const limitMap = new Map(limits.map((row) => [row.categoryId, row.limitVnd]));
      const spentMap = new Map(spending.map((row) => [row.categoryId, row.spentVnd]));
      const spentVnd = spending.reduce((sum, row) => sum + BigInt(row.spentVnd), 0n).toString();
      const totalLimitVnd = budget?.totalLimitVnd ?? null;
      return {
        month,
        totalLimitVnd,
        spentVnd,
        ...budgetProgress(totalLimitVnd, spentVnd),
        categories: categories
          .filter((row) => row.isActive || limitMap.has(row.id) || spentMap.has(row.id))
          .map((row) => {
            const limitVnd = limitMap.get(row.id) ?? null;
            const spentVnd = spentMap.get(row.id) ?? '0';
            return {
              categoryId: row.id,
              categoryName: row.name,
              isActive: row.isActive,
              limitVnd,
              spentVnd,
              ...budgetProgress(limitVnd, spentVnd),
            };
          }),
      };
    });
  }

  private async lockBook(manager: EntityManager, ownerId: string, bookId: string) {
    await manager.query("SET SESSION time_zone = '+00:00'");
    // Serialize first-month creation and category edits using the existing book row.
    const book = await manager.findOne(BookEntity, {
      where: { id: bookId, ownerId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!book) throw new NotFoundException('Book not found.');
  }

  private async ensureMonth(manager: EntityManager, bookId: string, month: string) {
    const { startDate, endDate } = budgetMonth(month);
    return (
      (await manager.findOneBy(MonthlyBudgetEntity, { bookId, startDate })) ??
      manager.save(
        MonthlyBudgetEntity,
        manager.create(MonthlyBudgetEntity, {
          bookId,
          startDate,
          endDate,
          totalLimitVnd: null,
        }),
      )
    );
  }

  async setTotal(ownerId: string, bookId: string, month: string, totalLimitVnd: string | null) {
    budgetMonth(month);
    await this.dataSource.transaction(async (manager) => {
      await this.lockBook(manager, ownerId, bookId);
      const budget = await this.ensureMonth(manager, bookId, month);
      budget.totalLimitVnd = totalLimitVnd;
      await manager.save(MonthlyBudgetEntity, budget);
    });
    return this.getMonth(ownerId, bookId, month);
  }

  async setCategory(
    ownerId: string,
    bookId: string,
    month: string,
    categoryId: string,
    limitVnd: string,
  ) {
    budgetMonth(month);
    await this.dataSource.transaction(async (manager) => {
      await this.lockBook(manager, ownerId, bookId);
      const category = await manager.findOneBy(CategoryEntity, {
        id: categoryId,
        bookId,
        isActive: true,
      });
      if (!category) throw new NotFoundException('Category not found.');
      const budget = await this.ensureMonth(manager, bookId, month);
      await manager.upsert(
        CategoryBudgetEntity,
        {
          bookId,
          budgetId: budget.id,
          categoryId,
          limitVnd,
        },
        ['budgetId', 'categoryId'],
      );
    });
    return this.getMonth(ownerId, bookId, month);
  }

  async removeCategory(ownerId: string, bookId: string, month: string, categoryId: string) {
    const { startDate } = budgetMonth(month);
    await this.dataSource.transaction(async (manager) => {
      await this.lockBook(manager, ownerId, bookId);
      const category = await manager.findOneBy(CategoryEntity, { id: categoryId, bookId });
      if (!category) throw new NotFoundException('Category not found.');
      const budget = await manager.findOneBy(MonthlyBudgetEntity, { bookId, startDate });
      if (budget)
        await manager.delete(CategoryBudgetEntity, { bookId, budgetId: budget.id, categoryId });
    });
    return this.getMonth(ownerId, bookId, month);
  }

  async copyPrevious(ownerId: string, bookId: string, month: string) {
    const { startDate } = budgetMonth(month);
    const previous = budgetMonth(previousBudgetMonth(month));
    await this.dataSource.transaction(async (manager) => {
      await this.lockBook(manager, ownerId, bookId);
      const source = await manager.findOneBy(MonthlyBudgetEntity, {
        bookId,
        startDate: previous.startDate,
      });
      if (!source) throw new BadRequestException('Previous month has no budget.');
      const target = await manager.findOneBy(MonthlyBudgetEntity, { bookId, startDate });
      if (
        target &&
        (target.totalLimitVnd !== null ||
          (await manager.existsBy(CategoryBudgetEntity, { bookId, budgetId: target.id })))
      ) {
        throw new BadRequestException('Target month already has limits.');
      }
      const categories = await manager.findBy(CategoryEntity, { bookId, isActive: true });
      const active = new Set(categories.map((row) => row.id));
      const limits = (
        await manager.findBy(CategoryBudgetEntity, { bookId, budgetId: source.id })
      ).filter((row) => active.has(row.categoryId));
      if (source.totalLimitVnd === null && !limits.length) {
        throw new BadRequestException('Previous month has no active limits.');
      }
      const budget = target ?? (await this.ensureMonth(manager, bookId, month));
      budget.totalLimitVnd = source.totalLimitVnd;
      await manager.save(MonthlyBudgetEntity, budget);
      if (limits.length)
        await manager.save(
          CategoryBudgetEntity,
          limits.map((row) =>
            manager.create(CategoryBudgetEntity, {
              bookId,
              budgetId: budget.id,
              categoryId: row.categoryId,
              limitVnd: row.limitVnd,
            }),
          ),
        );
    });
    return this.getMonth(ownerId, bookId, month);
  }
}
