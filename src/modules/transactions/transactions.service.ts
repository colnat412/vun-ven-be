import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { BooksService } from '../books/books.service';
import { CategoryEntity } from '../categories/entities/category.entity';
import { WalletEntity } from '../wallets/entities/wallet.entity';
import { TransactionKindEnum } from '../../config/enums/transaction-kind.enum';
import { TransactionEntity } from './entities/transaction.entity';
import { WalletEntryEntity } from './entities/wallet-entry.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ListTransactionsDto } from './dto/list-transactions.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { MediaService } from '../media/media.service';

export function businessDate(instant: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const value = (name: string) => parts.find((part) => part.type === name)!.value;
  return [value('year'), value('month'), value('day')].join('-');
}

@Injectable()
export class TransactionsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly books: BooksService,
    @InjectRepository(TransactionEntity)
    private readonly transactions: Repository<TransactionEntity>,
    private readonly media: MediaService,
  ) {}

  async create(ownerId: string, bookId: string, dto: CreateTransactionDto) {
    const book = await this.books.findOwned(ownerId, bookId);
    if (dto.clientRequestId) {
      const existing = await this.transactions.findOneBy({
        bookId,
        clientRequestId: dto.clientRequestId,
      });
      if (existing) return this.findOne(ownerId, bookId, existing.id);
    }
    const occurredAt = new Date(dto.occurredAt);
    const occurredOn = businessDate(occurredAt, book.timezone);
    if (occurredOn < '1000-01-01' || occurredOn > '9999-12-31') throw new BadRequestException();
    const photoPublicId = dto.photoDataUrl ? await this.media.uploadImage(dto.photoDataUrl, 'transaction') : null;
    let id: string;
    try {
      id = await this.dataSource.transaction(async (manager) => {
        await manager.query("SET SESSION time_zone = '+00:00'");
        const category = await manager.findOneBy(CategoryEntity, {
          id: dto.categoryId,
          bookId,
          isActive: true,
        });
        const wallet = await manager.findOneBy(WalletEntity, {
          id: dto.walletId,
          bookId,
          isActive: true,
        });
        if (!category || !wallet) throw new BadRequestException('Invalid category or wallet.');
        const row = await manager.save(
          TransactionEntity,
          manager.create(TransactionEntity, {
            bookId,
            categoryId: category.id,
            kind: dto.kind,
            amountVnd: dto.amountVnd,
            note: dto.note,
            photoDataUrl: null,
            photoPublicId,
            clientRequestId: dto.clientRequestId ?? null,
            occurredOn,
            occurredAt,
            version: 1,
          }),
        );
        await manager.save(
          WalletEntryEntity,
          manager.create(WalletEntryEntity, {
            bookId,
            transactionId: row.id,
            walletId: wallet.id,
            deltaVnd: (dto.kind === TransactionKindEnum.Expense
              ? -BigInt(dto.amountVnd)
              : BigInt(dto.amountVnd)
            ).toString(),
          }),
        );
        if (photoPublicId) await this.media.retainImage(manager, photoPublicId);
        return row.id;
      });
    } catch (error) {
      if (
        dto.clientRequestId &&
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === 'ER_DUP_ENTRY'
      ) {
        const existing = await this.transactions.findOneBy({
          bookId,
          clientRequestId: dto.clientRequestId,
        });
        if (existing) return this.findOne(ownerId, bookId, existing.id);
      }
      throw error;
    }
    return this.findOne(ownerId, bookId, id);
  }

  async findPhoto(ownerId: string, bookId: string, id: string) {
    await this.books.findOwned(ownerId, bookId);
    const row = await this.transactions
      .createQueryBuilder('tx')
      .select('tx.photoDataUrl', 'photoDataUrl')
      .addSelect('tx.photoPublicId', 'photoPublicId')
      .where('tx.id = :id AND tx.bookId = :bookId', { id, bookId })
      .getRawOne();
    if (row?.photoPublicId) return this.media.imageUrl(row.photoPublicId);
    if (!row?.photoDataUrl) throw new NotFoundException();
    return { photoDataUrl: row.photoDataUrl as string };
  }

  async update(ownerId: string, bookId: string, id: string, dto: UpdateTransactionDto) {
    const book = await this.books.findOwned(ownerId, bookId);
    const occurredAt = new Date(dto.occurredAt);
    const occurredOn = businessDate(occurredAt, book.timezone);
    if (occurredOn < '1000-01-01' || occurredOn > '9999-12-31') throw new BadRequestException();
    await this.dataSource.transaction(async (manager) => {
      await manager.query("SET SESSION time_zone = '+00:00'");
      const row = await manager.findOne(TransactionEntity, {
        where: { id, bookId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!row || ![TransactionKindEnum.Income, TransactionKindEnum.Expense].includes(row.kind))
        throw new NotFoundException('Transaction not found.');
      const category = await manager.findOneBy(CategoryEntity, {
        id: dto.categoryId,
        bookId,
        isActive: true,
      });
      const wallet = await manager.findOneBy(WalletEntity, {
        id: dto.walletId,
        bookId,
      });
      if (!category || !wallet) throw new BadRequestException('Invalid category or wallet.');
      const entries = await manager.find(WalletEntryEntity, {
        where: { transactionId: id, bookId },
      });
      if (entries.length !== 1) throw new BadRequestException('Invalid transaction entries.');
      if (!wallet.isActive && entries[0].walletId !== wallet.id) throw new BadRequestException('Wallet is inactive.');
      Object.assign(row, {
        categoryId: category.id,
        kind: dto.kind,
        amountVnd: dto.amountVnd,
        note: dto.note,
        occurredOn,
        occurredAt,
        version: row.version + 1,
      });
      await manager.save(TransactionEntity, row);
      const entry = entries[0];
      entry.walletId = wallet.id;
      entry.deltaVnd = (
        dto.kind === TransactionKindEnum.Expense ? -BigInt(dto.amountVnd) : BigInt(dto.amountVnd)
      ).toString();
      await manager.save(WalletEntryEntity, entry);
    });
    return this.findOne(ownerId, bookId, id);
  }

  async remove(ownerId: string, bookId: string, id: string) {
    await this.books.findOwned(ownerId, bookId);
    await this.dataSource.transaction(async (manager) => {
      const row = await manager.findOne(TransactionEntity, {
        where: { id, bookId },
        select: { id: true, kind: true, photoPublicId: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!row || ![TransactionKindEnum.Income, TransactionKindEnum.Expense].includes(row.kind))
        throw new NotFoundException('Transaction not found.');
      if (row.photoPublicId) await this.media.enqueueDelete(manager, row.photoPublicId);
      await manager.delete(WalletEntryEntity, { transactionId: id, bookId });
      await manager.delete(TransactionEntity, { id, bookId });
    });
  }

  private query(bookId: string) {
    return this.transactions
      .createQueryBuilder('tx')
      .innerJoin(
        WalletEntryEntity,
        'entry',
        'entry.transactionId = tx.id AND entry.bookId = tx.bookId',
      )
      .innerJoin(WalletEntity, 'wallet', 'wallet.id = entry.walletId AND wallet.bookId = tx.bookId')
      .innerJoin(
        CategoryEntity,
        'category',
        'category.id = tx.categoryId AND category.bookId = tx.bookId',
      )
      .where('tx.bookId = :bookId', { bookId })
      .andWhere('tx.kind IN (:...supportedKinds)', {
        supportedKinds: [TransactionKindEnum.Income, TransactionKindEnum.Expense],
      })
      .select('tx.id', 'id')
      .addSelect('tx.bookId', 'bookId')
      .addSelect('tx.kind', 'kind')
      .addSelect('tx.amountVnd', 'amountVnd')
      .addSelect('tx.note', 'note')
      .addSelect('(tx.photoPublicId IS NOT NULL OR tx.photoDataUrl IS NOT NULL)', 'hasPhoto')
      .addSelect("DATE_FORMAT(tx.occurredOn, '%Y-%m-%d')", 'occurredOn')
      .addSelect('tx.occurredAt', 'occurredAt')
      .addSelect('tx.version', 'version')
      .addSelect('tx.categoryId', 'categoryId')
      .addSelect('category.code', 'categoryCode')
      .addSelect('category.name', 'categoryName')
      .addSelect('entry.walletId', 'walletId')
      .addSelect('wallet.name', 'walletName');
  }

  async findAll(ownerId: string, bookId: string, dto: ListTransactionsDto) {
    await this.books.findOwned(ownerId, bookId);
    if (dto.from && dto.to && dto.from > dto.to)
      throw new BadRequestException('Invalid date range.');
    const query = this.query(bookId);
    if (dto.kind) query.andWhere('tx.kind = :kind', { kind: dto.kind });
    if (dto.walletId) query.andWhere('entry.walletId = :walletId', { walletId: dto.walletId });
    if (dto.categoryId)
      query.andWhere('tx.categoryId = :categoryId', {
        categoryId: dto.categoryId,
      });
    if (dto.from) query.andWhere('tx.occurredOn >= :from', { from: dto.from });
    if (dto.to) query.andWhere('tx.occurredOn <= :to', { to: dto.to });
    if (dto.search)
      query.andWhere(
        '(LOCATE(:search, tx.note) > 0 OR LOCATE(:search, category.name) > 0 OR LOCATE(:search, wallet.name) > 0)',
        { search: dto.search },
      );
    const total = await query.clone().getCount();
    const items = await query
      .orderBy('tx.occurredOn', 'DESC')
      .addOrderBy('tx.occurredAt', 'DESC')
      .addOrderBy('tx.id', 'DESC')
      .offset((dto.page - 1) * dto.limit)
      .limit(dto.limit)
      .getRawMany();
    return { items, total, page: dto.page, limit: dto.limit };
  }

  async findOne(ownerId: string, bookId: string, id: string) {
    await this.books.findOwned(ownerId, bookId);
    const row = await this.query(bookId).andWhere('tx.id = :id', { id }).getRawOne();
    if (!row) throw new NotFoundException('Transaction not found.');
    return row;
  }
}
