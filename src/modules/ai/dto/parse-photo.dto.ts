import { Validate } from 'class-validator';
import { TransactionPhotoValidator } from '../../../common/validators/transaction-photo.validator';

export class ParsePhotoDto {
  @Validate(TransactionPhotoValidator)
  photoDataUrl!: string;
}
