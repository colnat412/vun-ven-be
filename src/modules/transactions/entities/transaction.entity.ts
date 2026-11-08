import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { TransactionKindEnum } from '../../../config/enums/transaction-kind.enum';
import { BookEntity } from '../../books/entities/book.entity';
import { CategoryEntity } from '../../categories/entities/category.entity';
import { WalletEntryEntity } from './wallet-entry.entity';

@Entity('transactions')
@Index('uq_transactions_book_id', ['bookId', 'id'], { unique: true })
@Index('ix_transactions_date', ['bookId', 'occurredOn', 'id'])
export class TransactionEntity extends BaseEntity {
  @Column({ name: 'book_id', type: 'varchar', length: 36 }) bookId: string;

  @ManyToOne(() => BookEntity, (book) => book.transactions, { nullable: false })
  @JoinColumn({
    name: 'book_id',
    referencedColumnName: 'id',
  })
  book: BookEntity;

  @ManyToOne(() => CategoryEntity, (category) => category.transactions, { nullable: true })
  @JoinColumn([
    {
      name: 'book_id',
      referencedColumnName: 'bookId',
    },
    {
      name: 'category_id',
      referencedColumnName: 'id',
    },
  ])
  category: CategoryEntity;

  @OneToMany(() => WalletEntryEntity, (entry) => entry.transaction)
  entries: WalletEntryEntity[];
  @Column({ name: 'category_id', type: 'varchar', length: 36, nullable: true }) categoryId:
    string | null;
  @Column({ type: 'enum', enum: TransactionKindEnum }) kind: TransactionKindEnum;
  @Column({ name: 'amount_vnd', type: 'bigint' }) amountVnd: string;
  @Column({ type: 'varchar', length: 160, default: '' }) note: string;
  @Column({ name: 'occurred_on', type: 'date' }) occurredOn: string;
  @Column({ name: 'occurred_at_utc', type: 'datetime', precision: 3, nullable: true })
  occurredAt: Date | null;
  @Column({ type: 'int', default: 1 }) version: number;
}
