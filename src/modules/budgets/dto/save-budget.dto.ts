import { IsString, Matches, ValidateIf } from 'class-validator';

export class SaveBudgetDto {
  // null explicitly removes the total limit; undefined is invalid.
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @Matches(/^(?:0|[1-9]\d{0,11}|1000000000000)$/)
  totalLimitVnd!: string | null;
}

export class SaveCategoryBudgetDto {
  @IsString()
  @Matches(/^(?:0|[1-9]\d{0,11}|1000000000000)$/)
  limitVnd!: string;
}
