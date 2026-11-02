import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryEntity } from '../categories/entities/category.entity';
import { WalletEntity } from '../wallets/entities/wallet.entity';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { BookEntity } from './entities/book.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BookEntity, CategoryEntity, WalletEntity])],
  controllers: [BooksController],
  providers: [BooksService],
  exports: [BooksService],
})
export class BooksModule {}
