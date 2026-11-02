import { CurrenCyEnum } from '../../../config/enums';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('books')
@Index('ix_books_owner', ['ownerId'])
export class BookEntity extends BaseEntity {
  @Column({ name: 'owner_id', type: 'varchar', length: 36 })
  ownerId: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'enum', enum: CurrenCyEnum, default: CurrenCyEnum.VND })
  currency: CurrenCyEnum;

}
