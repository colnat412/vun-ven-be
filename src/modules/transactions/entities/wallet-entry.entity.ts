import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { TransactionEntity } from './transaction.entity';
import { WalletEntity } from '../../wallets/entities/wallet.entity';

@Entity('wallet_entries')
@Index('uq_entries_transaction_wallet', ['transactionId', 'walletId'], { unique: true })
export class WalletEntryEntity extends BaseEntity {
  @ManyToOne(() => TransactionEntity, (transaction) => transaction.entries, { nullable: false })
  @JoinColumn([
    {
      name: 'book_id',
      referencedColumnName: 'bookId',
    },
    {
      name: 'transaction_id',
      referencedColumnName: 'id',
    },
  ])
  transaction: TransactionEntity;

  @ManyToOne(() => WalletEntity, (wallet) => wallet.entries, { nullable: false })
  @JoinColumn([
    {
      name: 'book_id',
      referencedColumnName: 'bookId',
    },
    {
      name: 'wallet_id',
      referencedColumnName: 'id',
    },
  ])
  wallet: WalletEntity;

  @Column({ name: 'book_id', type: 'varchar', length: 36 }) bookId: string;
  @Column({ name: 'transaction_id', type: 'varchar', length: 36 }) transactionId: string;
  @Column({ name: 'wallet_id', type: 'varchar', length: 36 }) walletId: string;
  @Column({ name: 'delta_vnd', type: 'bigint' }) deltaVnd: string;
}
