import { CurrenCyEnum } from '../../config/enums';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CategoryEntity } from '../categories/entities/category.entity';
import { WalletEntity } from '../wallets/entities/wallet.entity';
import { DEFAULT_CATEGORIES, DEFAULT_WALLETS } from './book-defaults';
import { CreateBookDto } from './dto/create-book.dto';
import { BookEntity } from './entities/book.entity';

@Injectable()
export class BooksService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(BookEntity)
    private readonly books: Repository<BookEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categories: Repository<CategoryEntity>,
    @InjectRepository(WalletEntity)
    private readonly wallets: Repository<WalletEntity>,
  ) {}

  create(ownerId: string, dto: CreateBookDto) {
    return this.dataSource.transaction(async (manager) => {
      const book = await manager.save(BookEntity, manager.create(BookEntity, {
        ownerId,
        name: dto.name,
        currency: CurrenCyEnum.VND,
      }));
      const categories = await manager.save(CategoryEntity,
        DEFAULT_CATEGORIES.map((category) => manager.create(CategoryEntity, {
          ...category, bookId: book.id, isActive: true,
        })),
      );
      const wallets = await manager.save(WalletEntity,
        DEFAULT_WALLETS.map((wallet) => manager.create(WalletEntity, {
          ...wallet, bookId: book.id, isActive: true,
        })),
      );
      return { ...book, categories, wallets };
    });
  }

  findAll(ownerId: string) {
    return this.books.find({
      where: { ownerId },
      order: { createdAt: 'ASC', id: 'ASC' },
    });
  }

  async findOwned(ownerId: string, bookId: string): Promise<BookEntity> {
    const book = await this.books.findOneBy({ id: bookId, ownerId });
    if (!book) throw new NotFoundException('Không tìm thấy sổ.');
    return book;
  }

  async findOne(ownerId: string, bookId: string) {
    const book = await this.findOwned(ownerId, bookId);
    const [categories, wallets] = await Promise.all([
      this.categories.find({
        where: { bookId },
        order: { sortOrder: 'ASC', id: 'ASC' },
      }),
      this.wallets.find({
        where: { bookId },
        order: { kind: 'ASC', id: 'ASC' },
      }),
    ]);
    return { ...book, categories, wallets };
  }
}
