import 'reflect-metadata';
import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { databaseConfig } from '../database/database-options';
import { CloudinaryService } from '../modules/media/cloudinary.service';
import { MediaService } from '../modules/media/media.service';
import { TransactionEntity } from '../modules/transactions/entities/transaction.entity';
import { isTransactionPhoto } from '../common/validators/transaction-photo.validator';

async function migrate() {
  const db = await new DataSource(databaseConfig(process.env)).initialize();
  const media = new MediaService(db, new CloudinaryService(new ConfigService(process.env)));
  let migrated = 0;
  try {
    // One image per iteration keeps memory bounded. Restarting skips completed rows.
    while (true) {
      const repo = db.getRepository(TransactionEntity);
      const row = await repo
        .createQueryBuilder('tx')
        .addSelect('tx.photoDataUrl')
        .where('tx.photoDataUrl IS NOT NULL AND tx.photoPublicId IS NULL')
        .orderBy('tx.id', 'ASC')
        .getOne();
      if (!row) break;
      if (!isTransactionPhoto(row.photoDataUrl)) throw new Error('Legacy photo failed validation.');
      const publicId = await media.uploadImage(row.photoDataUrl, 'transaction');
      await db.transaction(async (manager) => {
        const current = await manager.findOne(TransactionEntity, {
          where: { id: row.id },
          select: { id: true, photoPublicId: true, photoDataUrl: true },
          lock: { mode: 'pessimistic_write' },
        });
        // A concurrent delete or migration leaves the new upload queued for cleanup.
        if (!current || current.photoPublicId || current.photoDataUrl !== row.photoDataUrl) return;
        await manager.update(TransactionEntity, row.id, {
          photoPublicId: publicId,
          photoDataUrl: null,
        });
        await media.retainImage(manager, publicId);
        migrated++;
      });
      console.log(`Migrated ${migrated} photos.`);
    }
  } finally {
    await db.destroy();
  }
}

migrate().catch(() => {
  console.error(
    'Photo migration stopped. Check DB and Cloudinary configuration; rerun to resume. Existing photos are preserved.',
  );
  process.exitCode = 1;
});
