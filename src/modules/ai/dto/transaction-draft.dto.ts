import { IsBoolean, IsIn, IsString, IsUUID, MaxLength, ValidateIf } from 'class-validator';
import { kindEnum } from '../schema/transaction-draft.schema';

export class TransactionDraftDto {
  @IsIn(kindEnum)
  kind: (typeof kindEnum)[number];

  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @MaxLength(80)
  amountText: string | null;

  @ValidateIf((_object, value) => value !== null)
  @IsUUID()
  categoryId: string | null;

  @ValidateIf((_object, value) => value !== null)
  @IsUUID()
  walletId: string | null;

  @IsString()
  @MaxLength(160)
  note: string;

  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @MaxLength(120)
  dateText: string | null;

  @IsBoolean()
  hasMultipleTransactions: boolean;
}
