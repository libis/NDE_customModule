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
 * subscribes directly to the XHR/fetch patch events and feeds them into
 * AnalyticsService. See global-http-event.service.ts.
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
    return next.handle(request);
  }
}


/**
 * Example: Authentication Interceptor
 * 
 * Adds authentication headers to API requests.
 * Order: 10 (runs early to add auth before other processing)
 */
@NDEInterceptor({
  order: 10,
  description: 'Adds authentication headers to API requests'
})
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    
    // Only add auth headers for API requests
    if (!this.isApiRequest(request.url)) {
      return next.handle(request);
    }
    
    // Get auth token (from your auth service)
    const token = this.getAuthToken();
    
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    
    return next.handle(request);
  }
  
  private isApiRequest(url: string): boolean {
    return url.includes('/primaws/') || url.includes('/api/');
  }
  
  private getAuthToken(): string | null {
    // In a real app, get this from an auth service
    // return inject(AuthService).getToken();
    return localStorage.getItem('auth_token');
  }
}


/**
 * Example: Error Handling Interceptor
 * 
 * Provides consistent error handling across the application.
 * Order: 90 (runs very late to catch all errors)
 */
@NDEInterceptor({
  order: 90,
  description: 'Provides consistent error handling'
})
@Injectable()
export class ErrorHandlingInterceptor implements HttpInterceptor {
  
  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Log the error
        console.error('[HTTP Error]', {
          url: request.url,
          status: error.status,
          message: error.message
        });
        
        // Handle specific error codes
        switch (error.status) {
          case 401:
            this.handleUnauthorized();
            break;
          case 403:
            this.handleForbidden();
            break;
          case 404:
            this.handleNotFound(request.url);
            break;
          case 500:
            this.handleServerError();
            break;
        }
        
        // Re-throw the error for component-level handling
        return throwError(() => error);
      })
    );
  }
  
  private handleUnauthorized(): void {
    console.log('[Error Handler] Session expired, redirecting to login...');
    // Redirect to login or refresh token
  }
  
  private handleForbidden(): void {
    console.log('[Error Handler] Access denied');
    // Show access denied message
  }
  
  private handleNotFound(url: string): void {
    console.log('[Error Handler] Resource not found:', url);
    // Show not found message
  }
  
  private handleServerError(): void {
    console.log('[Error Handler] Server error');
    // Show generic error message
  }
}
