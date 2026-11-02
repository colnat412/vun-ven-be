import { WalletKindEnum } from '../../../config/enums';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('wallets')
@Index('uq_wallets_book_id', ['bookId', 'id'], { unique: true })
@Index('uq_wallets_book_name', ['bookId', 'name'], { unique: true })
@Index('ix_wallets_active', ['bookId', 'isActive'])
export class WalletEntity extends BaseEntity {
  @Column({ name: 'book_id', type: 'varchar', length: 36 })
  bookId!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'enum', enum: WalletKindEnum })
  kind!: WalletKindEnum;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
