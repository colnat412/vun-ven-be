import { Body, Controller, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BaseResponse } from '../../common/dto/base-response.dto';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AiService } from './ai.service';
import { ParseTransactionDto } from './dto/parse-transaction.dto';
import { ParsePhotoDto } from './dto/parse-photo.dto';

@Controller('books/:bookId/quick-transactions')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('parse-photo')
  @HttpCode(200)
  async parsePhoto(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bookId', new ParseUUIDPipe()) bookId: string,
    @Body() dto: ParsePhotoDto,
  ) {
    return BaseResponse.success(await this.ai.parsePhoto(user.id, bookId, dto.photoDataUrl));
  }

  @Post('parse')
  @HttpCode(200)
  async parse(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bookId', new ParseUUIDPipe()) bookId: string,
    @Body() dto: ParseTransactionDto,
  ) {
    return BaseResponse.success(await this.ai.parse(user.id, bookId, dto.text, dto.walletId));
  }
}
