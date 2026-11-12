import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { BookEntity } from '../../books/entities/book.entity';

@Entity('users')
export class UserEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255, name: 'avatar_public_id', nullable: true })
  avatarPublicId: string | null;

  @OneToMany(() => BookEntity, (book) => book.owner)
  books: BookEntity[];

  @Column({ type: 'varchar', length: 120, name: 'name' })
  name: string;

  @Column({ type: 'varchar', length: 254 })
  email: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'password',
    select: false,
  })
  password: string;
}
