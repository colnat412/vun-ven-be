import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

export const MAX_PHOTO_BYTES = 500 * 1024;

export function isTransactionPhoto(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > Math.ceil(MAX_PHOTO_BYTES / 3) * 4 + 23)
    return false;
  const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match || match[1].length % 4 !== 0) return false;
  const bytes = Buffer.from(match[1], 'base64');
  return (
    bytes.length <= MAX_PHOTO_BYTES &&
    bytes.length >= 4 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff &&
    bytes[bytes.length - 2] === 0xff &&
    bytes[bytes.length - 1] === 0xd9
  );
}

@ValidatorConstraint({ name: 'transactionPhoto', async: false })
export class TransactionPhotoValidator implements ValidatorConstraintInterface {
  validate(value: unknown) {
    return isTransactionPhoto(value);
  }
  defaultMessage() {
    return 'Invalid transaction photo.';
  }
}
