import { BadRequestException, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource, EntityManager, LessThanOrEqual } from 'typeorm';
import { CloudinaryService } from './cloudinary.service';
import { PhotoCleanupEntity } from './photo-cleanup.entity';
import { IMAGE_FOLDERS, ImagePurpose } from './image-purpose';

@Injectable()
export class MediaService implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private running = false;
  private readonly logger = new Logger(MediaService.name);
  constructor(
    private readonly db: DataSource,
    private readonly cloudinary: CloudinaryService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.cleanup();
    }, 60000);
    this.timer.unref();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async uploadImage(dataUrl: string, purpose: ImagePurpose): Promise<string> {
    if (!Object.hasOwn(IMAGE_FOLDERS, purpose)) throw new BadRequestException();
    const publicId = `${IMAGE_FOLDERS[purpose]}/${randomUUID()}`;
    // Persist a cleanup ticket BEFORE upload, including ambiguous timeouts/crashes.
    await this.db.getRepository(PhotoCleanupEntity).insert({
      publicId,
      notBefore: new Date(Date.now() + 3600000),
    });
    await this.cloudinary.uploadImage(dataUrl, publicId);
    return publicId;
  }

  async retainImage(manager: EntityManager, publicId: string) {
    // Remove the ticket atomically with the transaction that references this image.
    await manager.delete(PhotoCleanupEntity, { publicId });
  }

  async enqueueDelete(manager: EntityManager, publicId: string) {
    // DATETIME has second precision; avoid rounding a due ticket into the future.
    await manager.insert(PhotoCleanupEntity, {
      publicId,
      notBefore: new Date(Math.floor(Date.now() / 1000) * 1000),
    });
  }

  imageUrl(publicId: string) {
    return this.cloudinary.imageUrl(publicId);
  }

  async cleanup() {
    if (this.running) return;
    this.running = true;
    try {
      const repo = this.db.getRepository(PhotoCleanupEntity);
      const pending = await repo.find({
        where: { notBefore: LessThanOrEqual(new Date()) },
        take: 20,
      });
      for (const row of pending) {
        try {
          await this.cloudinary.deleteImage(row.publicId);
          await repo.delete({ publicId: row.publicId });
        } catch {
          this.logger.warn('Photo cleanup deferred for retry.');
        }
      }
    } catch {
      this.logger.warn('Photo cleanup queue unavailable.');
    } finally {
      this.running = false;
    }
  }
}
