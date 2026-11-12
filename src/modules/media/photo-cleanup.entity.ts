import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('photo_cleanup')
export class PhotoCleanupEntity {
  @PrimaryColumn({ name: 'public_id', type: 'varchar', length: 255 }) publicId: string;
  @Column({ name: 'not_before', type: 'datetime' }) notBefore: Date;
}
