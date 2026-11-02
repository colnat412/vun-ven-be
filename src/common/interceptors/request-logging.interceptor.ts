import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const start = Date.now();
    return next.handle().pipe(
      tap({
        next: () =>
          this.logger.log(
            `${response.locals.requestId} ${request.method} ${request.route?.path ?? '[route]'} ${response.statusCode} ${Date.now() - start}ms`,
          ),
        error: () =>
          this.logger.warn(
            `${response.locals.requestId} ${request.method} ${request.route?.path ?? '[route]'} failed ${Date.now() - start}ms`,
          ),
      }),
    );
  }
}
