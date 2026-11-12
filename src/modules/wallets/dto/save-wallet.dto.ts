import { Transform } from 'class-transformer';
import { IsEnum, IsString, Length, Matches } from 'class-validator';
import { WalletKindEnum } from '../../../config/enums';

export class SaveWalletDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 120)
  @Matches(/\S/)
  name!: string;

  @IsEnum(WalletKindEnum)
  kind!: WalletKindEnum;
}
