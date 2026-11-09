import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('category_budgets')
export class CategoryBudgetEntity {
  @PrimaryColumn({ name: 'budget_id', type: 'varchar', length: 36 }) budgetId: string;
  @PrimaryColumn({ name: 'category_id', type: 'varchar', length: 36 }) categoryId: string;
  @Column({ name: 'book_id', type: 'varchar', length: 36 }) bookId: string;
  @Column({ name: 'limit_vnd', type: 'bigint' }) limitVnd: string;
  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 }) updatedAt: Date;
}
