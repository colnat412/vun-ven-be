import { Transform } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';

export class SaveCategoryDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 120)
  @Matches(/\S/)
  name: string;
}
