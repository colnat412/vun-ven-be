import { Transform } from 'class-transformer';
import {
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Validate,
} from 'class-validator';
import { TransactionPhotoValidator } from '../../../common/validators/transaction-photo.validator';
import { TransactionKindEnum } from '../../../config/enums/transaction-kind.enum';

export class CreateTransactionDto {
  @IsOptional()
  @Validate(TransactionPhotoValidator)
  photoDataUrl?: string;

  @IsOptional()
  @IsUUID()
  clientRequestId?: string;

  @IsIn([TransactionKindEnum.Income, TransactionKindEnum.Expense])
  kind!: TransactionKindEnum;
  @IsString()
  @Matches(/^(?:[1-9]\d{0,11}|1000000000000)$/)
  amountVnd!: string;
  @IsUUID() categoryId!: string;
  @IsUUID() walletId!: string;
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(160)
  note = '';
  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(
    /^[1-9]\d{3}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/,
  )
  occurredAt!: string;
}
