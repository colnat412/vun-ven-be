import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('users')
export class UserEntity extends BaseEntity {
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
