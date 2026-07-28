import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction) {
    const startedAt = Date.now();
    const requestId = request.header('x-request-id') || randomUUID();
    response.setHeader('x-request-id', requestId);

    response.on('finish', () => {
      const message = [
        request.method,
        request.originalUrl,
        response.statusCode,
        `${Date.now() - startedAt}ms`,
        `requestId=${requestId}`,
        `ip=${request.ip}`,
      ].join(' ');

      if (response.statusCode >= 500) this.logger.error(message);
      else if (response.statusCode >= 400) this.logger.warn(message);
      else this.logger.log(message);
    });

    next();
  }
}
