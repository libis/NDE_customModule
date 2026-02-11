import { Injectable } from "@angular/core";
import { NDEInterceptor } from "../decorators/nde-interceptor.decorator";
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Observable } from "rxjs";

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