import { Validate } from 'class-validator';
import { TransactionPhotoValidator } from '../../../common/validators/transaction-photo.validator';

export class UpdateAvatarDto {
  @Validate(TransactionPhotoValidator)
  avatarDataUrl!: string;
}
