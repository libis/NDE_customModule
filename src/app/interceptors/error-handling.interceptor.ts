import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, catchError, throwError } from "rxjs";
import { NDEInterceptor } from "../decorators/nde-interceptor.decorator";

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