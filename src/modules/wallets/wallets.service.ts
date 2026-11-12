import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BookEntity } from '../books/entities/book.entity';
import { WalletEntity } from './entities/wallet.entity';
import { SaveWalletDto } from './dto/save-wallet.dto';

@Injectable()
export class WalletsService {
  constructor(private readonly dataSource: DataSource) {}

  async save(ownerId: string, bookId: string, dto: SaveWalletDto, id?: string) {
    return this.dataSource.transaction(async (manager) => {
      const book = await manager.findOne(BookEntity, {
        where: { id: bookId, ownerId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!book) throw new NotFoundException('Book not found.');
      const existing = await manager.findOneBy(WalletEntity, { bookId, name: dto.name });
      let wallet = id ? await manager.findOneBy(WalletEntity, { id, bookId }) : null;
      if (id && !wallet) throw new NotFoundException('Wallet not found.');
      if (existing && existing.id !== id) {
        if (id || existing.isActive) throw new ConflictException('Wallet name already exists.');
        wallet = existing;
      }
      wallet ??= manager.create(WalletEntity, { bookId });
      Object.assign(wallet, { name: dto.name, kind: dto.kind, isActive: true });
      return manager.save(WalletEntity, wallet);
    });
  }

  async archive(ownerId: string, bookId: string, id: string) {
    await this.dataSource.transaction(async (manager) => {
      const book = await manager.findOne(BookEntity, {
        where: { id: bookId, ownerId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!book) throw new NotFoundException('Book not found.');
      const wallet = await manager.findOneBy(WalletEntity, { id, bookId, isActive: true });
      if (!wallet) throw new NotFoundException('Wallet not found.');
      if ((await manager.countBy(WalletEntity, { bookId, isActive: true })) <= 1) {
        throw new BadRequestException('At least one active wallet is required.');
      }
      wallet.isActive = false;
      await manager.save(WalletEntity, wallet);
    });
  }
}
