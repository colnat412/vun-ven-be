import { Type, Transform } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { TransactionKindEnum } from '../../../config/enums/transaction-kind.enum';

export class ListTransactionsDto {
  @Type(() => Number) @IsInt() @Min(1) @Max(1000000) page = 1;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 50;
  @IsOptional()
  @IsIn([TransactionKindEnum.Income, TransactionKindEnum.Expense])
  kind?: TransactionKindEnum;
  @IsOptional() @IsUUID() walletId?: string;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsDateString({ strict: true }) @Matches(/^[1-9]\d{3}-\d{2}-\d{2}$/) from?: string;
  @IsOptional() @IsDateString({ strict: true }) @Matches(/^[1-9]\d{3}-\d{2}-\d{2}$/) to?: string;
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(160)
  search?: string;
}
