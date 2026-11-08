import { CurrenCyEnum } from '../../../config/enums';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { CategoryEntity } from '../../categories/entities/category.entity';
import { WalletEntity } from '../../wallets/entities/wallet.entity';
import { TransactionEntity } from '../../transactions/entities/transaction.entity';

@Entity('books')
@Index('ix_books_owner', ['ownerId'])
export class BookEntity extends BaseEntity {
  @Column({ name: 'owner_id', type: 'varchar', length: 36 })
  ownerId: string;

  @ManyToOne(() => UserEntity, (user) => user.books, { nullable: false })
  @JoinColumn({
    name: 'owner_id',
    referencedColumnName: 'id',
  })
  owner: UserEntity;

  @OneToMany(() => CategoryEntity, (category) => category.book)
  categories: CategoryEntity[];

  @OneToMany(() => WalletEntity, (wallet) => wallet.book)
  wallets: WalletEntity[];

  @OneToMany(() => TransactionEntity, (transaction) => transaction.book)
  transactions: TransactionEntity[];

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'enum', enum: CurrenCyEnum, default: CurrenCyEnum.VND })
  currency: CurrenCyEnum;

  @Column({ type: 'varchar', length: 64, default: 'Asia/Ho_Chi_Minh' })
  timezone: string;
}
