import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';
import { WALLET_ICON_IDS } from '../wallet-icon';
import { WalletKindEnum } from '../../../config/enums';

export class SaveWalletDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 120)
  @Matches(/\S/)
  name!: string;

  @IsEnum(WalletKindEnum)
  kind!: WalletKindEnum;

  @IsOptional()
  @IsIn(WALLET_ICON_IDS)
  icon?: string | null;
}
