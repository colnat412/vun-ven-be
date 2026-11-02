import { CategoryCodeEnum } from '../../../config/enums';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('categories')
@Index('uq_categories_book_id', ['bookId', 'id'], { unique: true })
@Index('uq_categories_book_code', ['bookId', 'code'], { unique: true })
@Index('ix_categories_sort', ['bookId', 'isActive', 'sortOrder'])
export class CategoryEntity extends BaseEntity {
  @Column({ name: 'book_id', type: 'varchar', length: 36 })
  bookId!: string;

  @Column({ type: 'enum', enum: CategoryCodeEnum })
  code!: CategoryCodeEnum;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
