import { WalletKindEnum } from '../../../config/enums';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { BookEntity } from '../../books/entities/book.entity';
import { WalletEntryEntity } from '../../transactions/entities/wallet-entry.entity';

@Entity('wallets')
@Index('uq_wallets_book_id', ['bookId', 'id'], { unique: true })
@Index('uq_wallets_book_name', ['bookId', 'name'], { unique: true })
@Index('ix_wallets_active', ['bookId', 'isActive'])
export class WalletEntity extends BaseEntity {
  @Column({ name: 'book_id', type: 'varchar', length: 36 })
  bookId: string;

  @ManyToOne(() => BookEntity, (book) => book.wallets, { nullable: false })
  @JoinColumn({
    name: 'book_id',
    referencedColumnName: 'id',
  })
  book: BookEntity;

  @OneToMany(() => WalletEntryEntity, (entry) => entry.wallet)
  entries: WalletEntryEntity[];

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'enum', enum: WalletKindEnum })
  kind: WalletKindEnum;

  @Column({ type: 'varchar', length: 64, nullable: true })
  icon: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
