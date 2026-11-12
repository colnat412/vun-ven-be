import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MediaService } from '../media/media.service';
import { UserEntity } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { hashPassword, verifyPassword } from './utils/password.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly db: DataSource,
    private readonly media: MediaService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.users.create(
      dto.displayName,
      dto.email,
      await hashPassword(dto.password),
    );
    return { id: user.id, displayName: user.name, email: user.email };
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmailForAuth(dto.email);
    if (!user || !(await verifyPassword(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    return {
      accessToken: await this.jwt.signAsync({ sub: user.id }),
      tokenType: 'Bearer',
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.users.updateName(userId, dto.displayName);
    return this.profile(user);
  }

  private profile(user: UserEntity) {
    return { id: user.id, displayName: user.name, email: user.email, hasAvatar: !!user.avatarPublicId };
  }

  async avatar(userId: string) {
    const user = await this.users.findById(userId);
    if (!user?.avatarPublicId) throw new NotFoundException();
    return this.media.imageUrl(user.avatarPublicId);
  }

  async updateAvatar(userId: string, dataUrl: string) {
    const publicId = await this.media.uploadImage(dataUrl, 'avatar');
    return this.db.transaction(async (manager) => {
      const user = await manager.findOne(UserEntity, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) throw new NotFoundException();
      if (user.avatarPublicId) await this.media.enqueueDelete(manager, user.avatarPublicId);
      user.avatarPublicId = publicId;
      await manager.save(UserEntity, user);
      await this.media.retainImage(manager, publicId);
      return this.profile(user);
    });
  }
}
