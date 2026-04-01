/**
 * Example: Analytics HTTP Interceptor
 * 
 * This interceptor demonstrates how to use the @NDEInterceptor decorator
 * to auto-register HTTP interceptors for NDE customization.
 */

import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

// Import the NDE interceptor decorator
import { NDEInterceptor } from '../decorators/nde-interceptor.decorator';

/**
 * Analytics HTTP Interceptor
 *
 * This interceptor participates in the Angular HttpClient interceptor chain
 * for the remote module's own requests. Analytics tracking of ALL HTTP
 * traffic (host + module) is handled by GlobalHttpEventService, which
 * subscribes directly to the XHR/fetch patch events. Analytics tracking
 * is wired in AppModule's constructor. See app.module.ts.
 *
 * This interceptor can be extended with request/response transformation
 * logic that only applies to the remote module's own HttpClient requests.
 *
 * Order: 80 (runs late in request chain, early in response chain)
 */
@NDEInterceptor({
  order: 80,
  description: 'Tracks HTTP requests and responses for analytics'
})
@Injectable()
export class AnalyticsInterceptor implements HttpInterceptor {

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    console.log( "[NDEInterceptor] : -- TEST -- AnalyticsInterceptor ",request )
    return next.handle(request);
  }
}

