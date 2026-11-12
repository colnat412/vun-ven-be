import { BaseResponse } from '../../common/dto/base-response.dto';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return BaseResponse.success(await this.auth.register(dto));
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return BaseResponse.success(await this.auth.login(dto));
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return BaseResponse.success(user);
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return BaseResponse.success(await this.auth.updateProfile(user.id, dto));
  }

  @Get('me/avatar')
  async avatar(@CurrentUser() user: AuthenticatedUser) {
    return BaseResponse.success(await this.auth.avatar(user.id));
  }

  @Patch('me/avatar')
  async updateAvatar(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateAvatarDto) {
    return BaseResponse.success(await this.auth.updateAvatar(user.id, dto.avatarDataUrl));
  }
}
