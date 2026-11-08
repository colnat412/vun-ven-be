import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksModule } from '../books/books.module';
import { TransactionEntity } from './entities/transaction.entity';
import { WalletEntryEntity } from './entities/wallet-entry.entity';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';

@Module({
  imports: [BooksModule, TypeOrmModule.forFeature([TransactionEntity, WalletEntryEntity])],
  providers: [TransactionsService],
  controllers: [TransactionsController],
})
export class TransactionsModule {}
