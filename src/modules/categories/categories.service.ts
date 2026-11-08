import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { BookEntity } from '../books/entities/book.entity';
import { CategoryEntity } from './entities/category.entity';
import { SaveCategoryDto } from './dto/save-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly dataSource: DataSource) {}

  async save(ownerId: string, bookId: string, dto: SaveCategoryDto, id?: string) {
    return this.dataSource.transaction(async (manager) => {
      const book = await manager.findOne(BookEntity, {
        where: { id: bookId, ownerId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!book) throw new NotFoundException('Book not found.');
      const existing = await manager.findOneBy(CategoryEntity, { bookId, name: dto.name });
      let category = id
        ? await manager.findOneBy(CategoryEntity, { id, bookId, isActive: true })
        : null;
      if (id && !category) throw new NotFoundException('Category not found.');
      if (existing && existing.id !== id) {
        if (id || existing.isActive) throw new ConflictException('Category name already exists.');
        category = existing;
      }
      category ??= manager.create(CategoryEntity, {
        bookId,
        code: randomUUID(),
        sortOrder: 0,
      });
      category.name = dto.name;
      category.isActive = true;
      return manager.save(CategoryEntity, category);
    });
  }

  async remove(ownerId: string, bookId: string, id: string) {
    await this.dataSource.transaction(async (manager) => {
      const book = await manager.findOne(BookEntity, {
        where: { id: bookId, ownerId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!book) throw new NotFoundException('Book not found.');
      const category = await manager.findOneBy(CategoryEntity, { id, bookId, isActive: true });
      if (!category) throw new NotFoundException('Category not found.');
      category.isActive = false;
      await manager.save(CategoryEntity, category);
    });
  }
}
