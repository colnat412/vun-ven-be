import { Injectable, UnauthorizedException } from '@nestjs/common';
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
    return { id: user.id, displayName: user.name, email: user.email };
  }
}
