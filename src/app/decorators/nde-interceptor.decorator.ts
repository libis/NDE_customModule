/**
 * @NDEInterceptor Decorator
 * 
 * Auto-registers HTTP interceptors for NDE customization.
 * Eliminates the need to manually configure providers.
 * 
 * @example
 * ```typescript
 * @NDEInterceptor({ order: 10 })
 * @Injectable()
 * export class AuthInterceptor implements HttpInterceptor {
 *   intercept(req: HttpRequest<any>, next: HttpHandler) {
 *     const authReq = req.clone({
 *       headers: req.headers.set('Authorization', 'Bearer token')
 *     });
 *     return next.handle(authReq);
 *   }
 * }
 * ```
 */

import { HTTP_INTERCEPTORS, HttpInterceptor } from '@angular/common/http';
import { Provider, Type } from '@angular/core';
import 'reflect-metadata';

/**
 * Configuration options for @NDEInterceptor decorator
 */
export interface NDEInterceptorConfig {
  /**
   * Execution order for the interceptor chain
   * Lower numbers execute first (earlier in the request, later in the response)
   * 
   * Suggested ranges:
   * - 0-20: Authentication & authorization
   * - 21-40: Request transformation
   * - 41-60: Caching
   * - 61-80: Logging & analytics
   * - 81-100: Error handling
   * 
   * Default: 50
   */
  order?: number;
  
  /**
   * Optional description for documentation
   */
  description?: string;
  
  /**
   * Whether the interceptor is enabled
   * Can be used for feature flags
   * Default: true
   */
  enabled?: boolean;
}

/**
 * Internal registry entry
 */
interface InterceptorEntry {
  constructor: Type<HttpInterceptor>;
  config: NDEInterceptorConfig;
}

/**
 * Metadata key for storing NDE interceptor configuration
 */
const NDE_INTERCEPTOR_METADATA_KEY = 'nde:interceptor:config';

/**
 * Internal interceptor registry
 */
const interceptorRegistry: InterceptorEntry[] = [];

/**
 * Decorator factory for NDE HTTP interceptors
 */
export function NDEInterceptor(config: NDEInterceptorConfig = {}) {
  return function <T extends Type<HttpInterceptor>>(constructor: T) {
    const normalizedConfig: NDEInterceptorConfig = {
      order: config.order ?? 50,
      enabled: config.enabled ?? true,
      description: config.description
    };
    
    // Store metadata on the class
    Reflect.defineMetadata(NDE_INTERCEPTOR_METADATA_KEY, normalizedConfig, constructor);
    
    // Register the interceptor
    const entry: InterceptorEntry = {
      constructor,
      config: normalizedConfig
    };
    
    // Check for duplicate registrations
    const existingIndex = interceptorRegistry.findIndex(
      e => e.constructor === constructor
    );
    
    if (existingIndex >= 0) {
      console.warn(
        `[NDEInterceptor] ${constructor.name} is already registered. Updating configuration.`
      );
      interceptorRegistry[existingIndex] = entry;
    } else {
      interceptorRegistry.push(entry);
      // Sort by order
      interceptorRegistry.sort((a, b) => 
        (a.config.order ?? 50) - (b.config.order ?? 50)
      );
    }
    
    console.log(
      `[NDEInterceptor] Registered: ${constructor.name} (order: ${normalizedConfig.order})`
    );
    
    return constructor;
  };
}

/**
 * Get Angular providers for all registered interceptors
 * 
 * @example
 * ```typescript
 * // app.module.ts
 * import { getInterceptorProviders } from '../decorators/nde-interceptor.decorator';
 * 
 * // Import all interceptors to trigger registration
 * import '../interceptors/auth.interceptor';
 * import '../interceptors/logging.interceptor';
 * 
 * @NgModule({
 *   providers: [
 *     ...getInterceptorProviders()
 *   ]
 * })
 * export class AppModule {}
 * ```
 */
export function getInterceptorProviders(): Provider[] {
  return interceptorRegistry
    .filter(entry => entry.config.enabled !== false)
    .map(entry => ({
      provide: HTTP_INTERCEPTORS,
      useClass: entry.constructor,
      multi: true
    }));
}

/**
 * Get detailed registry information for debugging
 */
export function getInterceptorInfo(): Array<{
  name: string;
  order: number;
  enabled: boolean;
  description?: string;
}> {
  return interceptorRegistry.map(entry => ({
    name: entry.constructor.name,
    order: entry.config.order ?? 50,
    enabled: entry.config.enabled ?? true,
    description: entry.config.description
  }));
}

/**
 * Clear the registry (useful for testing)
 */
export function clearInterceptorRegistry(): void {
  interceptorRegistry.length = 0;
}

/**
 * Get interceptor metadata from a decorated class
 */
export function getNDEInterceptorConfig(
  interceptor: Type<HttpInterceptor>
): NDEInterceptorConfig | undefined {
  return Reflect.getMetadata(NDE_INTERCEPTOR_METADATA_KEY, interceptor);
}

/**
 * Disable an interceptor at runtime
 */
export function disableInterceptor(interceptor: Type<HttpInterceptor>): void {
  const entry = interceptorRegistry.find(e => e.constructor === interceptor);
  if (entry) {
    entry.config.enabled = false;
    console.log(`[NDEInterceptor] Disabled: ${interceptor.name}`);
  }
}

/**
 * Enable an interceptor at runtime
 */
export function enableInterceptor(interceptor: Type<HttpInterceptor>): void {
  const entry = interceptorRegistry.find(e => e.constructor === interceptor);
  if (entry) {
    entry.config.enabled = true;
    console.log(`[NDEInterceptor] Enabled: ${interceptor.name}`);
  }
}
