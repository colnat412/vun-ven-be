import { Transform } from 'class-transformer';
import { IsString, Length, Matches, ValidateBy } from 'class-validator';
import { isCategoryIcon } from '../category-icon';

export class SaveCategoryDto {
  @ValidateBy({ name: 'categoryIcon', validator: { validate: isCategoryIcon } })
  icon?: string | null;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 120)
  @Matches(/\S/)
  name: string;
}
