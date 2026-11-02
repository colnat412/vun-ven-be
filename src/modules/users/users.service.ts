import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
  ) {}

  async create(
    name: string,
    email: string,
    password: string,
  ): Promise<UserEntity> {
    try {
      const user = this.userRepo.create({ name, email, password });
      await this.userRepo.save(user);
      return user;
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException('Email đã được sử dụng.');
      }
      throw error;
    }
  }

  findById(id: string): Promise<UserEntity | null> {
    return this.userRepo.findOneBy({ id });
  }

  findByEmailForAuth(email: string): Promise<UserEntity | null> {
    return this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }
}
