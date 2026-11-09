import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('monthly_budgets')
@Index('uq_monthly_budgets_book_start', ['bookId', 'startDate'], { unique: true })
@Index('uq_monthly_budgets_book_id', ['bookId', 'id'], { unique: true })
export class MonthlyBudgetEntity extends BaseEntity {
  @Column({ name: 'book_id', type: 'varchar', length: 36 }) bookId: string;
  @Column({ name: 'start_date', type: 'date' }) startDate: string;
  @Column({ name: 'end_date', type: 'date' }) endDate: string;
  @Column({ name: 'total_limit_vnd', type: 'bigint', nullable: true }) totalLimitVnd: string | null;
}
