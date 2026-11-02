import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

export const GENERAL_ERROR_MESSAGE = 'Đã xảy ra lỗi. Vui lòng thử lại sau.';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly adapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      // Diagnostic details stay in backend logs, never in the HTTP response.
      this.logger.error(
        exception instanceof Error ? exception.message : 'Unhandled exception',
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const { httpAdapter } = this.adapterHost;
    const response = host.switchToHttp().getResponse();
    if (httpAdapter.isHeadersSent(response)) {
      httpAdapter.end(response);
      return;
    }

    httpAdapter.reply(response, {
      success: false,
      message: GENERAL_ERROR_MESSAGE,
      data: null,
    }, status);
  }
}
