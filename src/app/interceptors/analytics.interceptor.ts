/**
 * Example: Analytics HTTP Interceptor
 * 
 * This interceptor demonstrates how to use the @NDEInterceptor decorator
 * to auto-register HTTP interceptors for NDE customization.
 */

import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';

// Import the NDE interceptor decorator
import { NDEInterceptor } from '../decorators/nde-interceptor.decorator';

/**
 * Interface for analytics events
 */
interface AnalyticsEvent {
  type: 'request' | 'response' | 'error';
  method: string;
  url: string;
  timestamp: number;
  duration?: number;
  status?: number;
  error?: string;
}

/**
 * Simple analytics service (replace with your analytics provider)
 */
class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  
  track(event: AnalyticsEvent): void {
    this.events.push(event);
    console.log('[Analytics]', event);
    
    // In production, send to analytics service
    // this.sendToServer(event);
  }
  
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }
}

// Singleton analytics service
const analyticsService = new AnalyticsService();

/**
 * Analytics HTTP Interceptor
 * 
 * Tracks all HTTP requests and responses for analytics purposes.
 * 
 * Order: 80 (runs late in request chain, early in response chain)
 * This ensures we capture the final request state and can measure timing.
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
    console.log('[Analytics]', JSON.stringify(analyticsService.getEvents()));
    // Skip analytics for certain URLs
    if (this.shouldSkip(request.url)) {
      return next.handle(request);
    }
    
    const startTime = Date.now();
    
    // Track request
    analyticsService.track({
      type: 'request',
      method: request.method,
      url: this.sanitizeUrl(request.url),
      timestamp: startTime
    });
    
    return next.handle(request).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          // Track successful response
          analyticsService.track({
            type: 'response',
            method: request.method,
            url: this.sanitizeUrl(request.url),
            timestamp: Date.now(),
            duration: Date.now() - startTime,
            status: event.status
          });
        }
      }),
      catchError((error: HttpErrorResponse) => {
        // Track error
        analyticsService.track({
          type: 'error',
          method: request.method,
          url: this.sanitizeUrl(request.url),
          timestamp: Date.now(),
          duration: Date.now() - startTime,
          status: error.status,
          error: error.message
        });
        
        return throwError(() => error);
      })
    );
  }
  
  /**
   * Check if URL should be skipped from tracking
   */
  private shouldSkip(url: string): boolean {
    const skipPatterns = [
      '/analytics',  // Don't track analytics calls
      '/health',     // Don't track health checks
      '.svg',        // Don't track asset loads
      '.png',
      '.jpg',
      '.css',
      '.js'
    ];
    
    return skipPatterns.some(pattern => url.includes(pattern));
  }
  
  /**
   * Remove sensitive data from URLs before tracking
   */
  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url, window.location.origin);
      
      // Remove sensitive query parameters
      const sensitiveParams = ['token', 'key', 'password', 'secret'];
      sensitiveParams.forEach(param => {
        if (urlObj.searchParams.has(param)) {
          urlObj.searchParams.set(param, '[REDACTED]');
        }
      });
      
      return urlObj.pathname + urlObj.search;
    } catch {
      return url;
    }
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
