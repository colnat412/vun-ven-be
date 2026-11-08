export const GENERAL_ERROR_MESSAGE = 'An error occurred. Please try again.';

export class BaseResponse<T> {
  private constructor(
    public readonly success: boolean,
    public readonly message: string,
    public readonly data: T,
  ) {}

  static success(): BaseResponse<undefined>;
  static success<T>(data: T, message?: string): BaseResponse<T>;
  static success<T>(data?: T, message = 'Success.'): BaseResponse<T | undefined> {
    return new BaseResponse(true, message, data);
  }

  static error(message = GENERAL_ERROR_MESSAGE): BaseResponse<null> {
    return new BaseResponse(false, message, null);
  }
}
