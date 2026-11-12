import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { BaseResponse } from '../../common/dto/base-response.dto';
import { SaveWalletDto } from './dto/save-wallet.dto';
import { WalletsService } from './wallets.service';

@Controller('books/:bookId/wallets')
export class WalletsController {
  constructor(private readonly wallets: WalletsService) {}

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bookId', new ParseUUIDPipe()) bookId: string,
    @Body() dto: SaveWalletDto,
  ) {
    return BaseResponse.success(await this.wallets.save(user.id, bookId, dto));
  }

  @Put(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bookId', new ParseUUIDPipe()) bookId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SaveWalletDto,
  ) {
    return BaseResponse.success(await this.wallets.save(user.id, bookId, dto, id));
  }

  @Delete(':id')
  @HttpCode(200)
  async archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bookId', new ParseUUIDPipe()) bookId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    await this.wallets.archive(user.id, bookId, id);
    return BaseResponse.success(undefined, 'Wallet archived.');
  }
}
