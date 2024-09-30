import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, body, query, headers } = req;
    const requestLog = `
      --- Incoming Request ---
      Method: ${method}
      URL: ${originalUrl}
      Query Params: ${JSON.stringify(query)}
      Body: ${JSON.stringify(body)}
      Headers: ${JSON.stringify(headers)}
      -----------------------
    `;
    this.logger.log(requestLog);
    next();
  }
}
