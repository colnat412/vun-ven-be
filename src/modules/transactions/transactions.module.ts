import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksModule } from '../books/books.module';
import { TransactionEntity } from './entities/transaction.entity';
import { WalletEntryEntity } from './entities/wallet-entry.entity';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [MediaModule, BooksModule, TypeOrmModule.forFeature([TransactionEntity, WalletEntryEntity])],
  providers: [TransactionsService],
  controllers: [TransactionsController],
})
export class TransactionsModule {}
