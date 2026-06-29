import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

import type { Logger } from '../logger';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{
      status: (code: number) => { json: (body: unknown) => void };
    }>();
    const request = ctx.getRequest<{ id?: string; url?: string; method?: string }>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    this.logger.error(
      {
        requestId: request.id,
        method: request.method,
        url: request.url,
        status,
        err: exception instanceof Error ? exception.message : String(exception),
      },
      'Request failed',
    );

    response.status(status).json({
      statusCode: status,
      message,
      requestId: request.id,
      timestamp: new Date().toISOString(),
    });
  }
}
