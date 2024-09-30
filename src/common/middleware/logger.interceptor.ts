import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
    Logger,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { catchError, tap } from 'rxjs/operators';
  
  @Injectable()
  export class LoggerInterceptor implements NestInterceptor {
    private logger = new Logger('HTTP');
  
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const request = context.switchToHttp().getRequest();
      const { method, url } = request;
      const startTime = Date.now();
  
      return next.handle().pipe(
        tap((data) => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const processingTime = Date.now() - startTime;
  
          const responseLog = `
            --- Response ---
            Method: ${method}
            URL: ${url}
            Status: ${statusCode}
            Response Time: ${processingTime}ms
            Response Body: ${JSON.stringify(data)}
            ----------------
          `;
          this.logger.log(responseLog);
        }),
        catchError((err) => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const processingTime = Date.now() - startTime;
  
          const errorLog = `
            --- Error ---
            Method: ${method}
            URL: ${url}
            Status: ${statusCode || 500}  // Default to 500 if not set
            Response Time: ${processingTime}ms
            Error Message: ${err.message}
            Stack: ${err.stack}
            ----------------
          `;
          this.logger.error(errorLog);
  
          // Re-throw the original error to let NestJS handle it as usual
          throw err;
        }),
      );
    }
  }
  