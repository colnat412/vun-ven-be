/** Successful controller response. Errors are handled by Nest exception filters. */
export class BaseResponse<T> {
  readonly success = true;
  readonly message = "Thành công.";

  constructor(public readonly data: T) {}
}