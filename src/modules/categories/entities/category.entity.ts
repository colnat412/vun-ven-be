import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { BookEntity } from '../../books/entities/book.entity';
import { TransactionEntity } from '../../transactions/entities/transaction.entity';

@Entity('categories')
@Index('uq_categories_book_id', ['bookId', 'id'], { unique: true })
@Index('uq_categories_book_code', ['bookId', 'code'], { unique: true })
@Index('ix_categories_sort', ['bookId', 'isActive', 'sortOrder'])
export class CategoryEntity extends BaseEntity {
  @Column({ name: 'book_id', type: 'varchar', length: 36 })
  bookId: string;

  @ManyToOne(() => BookEntity, (book) => book.categories, { nullable: false })
  @JoinColumn({
    name: 'book_id',
    referencedColumnName: 'id',
  })
  book: BookEntity;

  @OneToMany(() => TransactionEntity, (transaction) => transaction.category)
  transactions: TransactionEntity[];

  @Column({ type: 'varchar', length: 64 })
  code: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
