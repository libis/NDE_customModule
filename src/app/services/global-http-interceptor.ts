/**
 * Global HTTP Interceptor — XHR + Fetch Monkey-Patch
 *
 * Patches XMLHttpRequest and window.fetch at the browser level to capture ALL
 * HTTP traffic, including requests made by the host application across the
 * Module Federation boundary.
 *
 * Angular's DI-based HTTP_INTERCEPTORS only work within a single injector tree,
 * so this global approach is needed for cross-module observability and control.
 *
 * This is the same pattern used by Sentry, DataDog, and similar tools.
 *
 * IMPORTANT: This file has ZERO Angular dependencies. It must be importable
 * and callable before Angular bootstraps.
 *
 * State is stored on `window.__nde_*` so that multiple Module Federation
 * remotes share a single patch instance.
 */

// ---------------------------------------------------------------------------
// Types (exported for use by Angular services)
// ---------------------------------------------------------------------------

export interface GlobalHttpEvent {
  id: string;
  type: 'request' | 'response' | 'error';
  method: string;
  url: string;
  timestamp: number;
  duration?: number;
  status?: number;
  statusText?: string;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  error?: string;
  source: 'xhr' | 'fetch';
  body?: unknown;
}

export interface RequestModification {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: unknown;
  blocked?: boolean;
}

export type RequestHandler = (
  method: string,
  url: string,
  headers: Record<string, string>,
  body: unknown
) => RequestModification | void;

export type ResponseHandler = (
  method: string,
  url: string,
  status: number,
  body: unknown
) => unknown | void;

// ---------------------------------------------------------------------------
// CustomEvent names (used to bridge to Angular)
// ---------------------------------------------------------------------------

export const REQUEST_EVENT  = 'nde:http:request';
export const RESPONSE_EVENT = 'nde:http:response';
export const ERROR_EVENT    = 'nde:http:error';

// ---------------------------------------------------------------------------
// Window-scoped globals (shared across federation modules)
// ---------------------------------------------------------------------------

const W = window as any;
const GLOBAL_FLAG              = '__nde_http_interceptor_installed';
const GLOBAL_BUFFER            = '__nde_http_event_buffer';
const GLOBAL_HANDLERS          = '__nde_http_request_handlers';
const GLOBAL_RESPONSE_HANDLERS = '__nde_http_response_handlers';
const GLOBAL_COUNTER           = '__nde_http_event_counter';

function getEventBuffer(): GlobalHttpEvent[] {
  if (!W[GLOBAL_BUFFER]) W[GLOBAL_BUFFER] = [];
  return W[GLOBAL_BUFFER];
}

function getRequestHandlers(): RequestHandler[] {
  if (!W[GLOBAL_HANDLERS]) W[GLOBAL_HANDLERS] = [];
  return W[GLOBAL_HANDLERS];
}

function getResponseHandlers(): ResponseHandler[] {
  if (!W[GLOBAL_RESPONSE_HANDLERS]) W[GLOBAL_RESPONSE_HANDLERS] = [];
  return W[GLOBAL_RESPONSE_HANDLERS];
}

function generateEventId(): string {
  if (!W[GLOBAL_COUNTER]) W[GLOBAL_COUNTER] = 0;
  return 'nde-' + (++W[GLOBAL_COUNTER]);
}

// ---------------------------------------------------------------------------
// URL sanitization
// ---------------------------------------------------------------------------

const SENSITIVE_PARAMS = [
  'token', 'key', 'password', 'secret',
  'apikey', 'api_key', 'access_token', 'auth', 'jwt'
];

function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url, window.location.origin);
    SENSITIVE_PARAMS.forEach(param => {
      if (urlObj.searchParams.has(param)) {
        urlObj.searchParams.set(param, '[REDACTED]');
      }
    });
    return urlObj.pathname + urlObj.search;
  } catch {
    return url;
  }
}

// ---------------------------------------------------------------------------
// Handler chain
// ---------------------------------------------------------------------------

function callHandlers(
  method: string,
  url: string,
  headers: Record<string, string>,
  body: unknown
): { method: string; url: string; headers: Record<string, string>; body: unknown; blocked: boolean } {
  const result = { method, url, headers: { ...headers }, body, blocked: false };
  for (const handler of getRequestHandlers()) {
    try {
      const mod = handler(result.method, result.url, result.headers, result.body);
      if (mod) {
        if (mod.blocked) { result.blocked = true; break; }
        if (mod.method)  result.method  = mod.method;
        if (mod.url)     result.url     = mod.url;
        if (mod.headers) result.headers = { ...result.headers, ...mod.headers };
        if (mod.body !== undefined) result.body = mod.body;
      }
    } catch (err) {
      console.error('[GlobalHttpInterceptor] Handler error:', err);
    }
  }
  return result;
}

/**
 * Run all response handlers. Each handler may return a modified body,
 * or void/undefined to leave it unchanged.
 */
function callResponseHandlers(
  method: string,
  url: string,
  status: number,
  body: unknown
): unknown {
  let currentBody = body;
  for (const handler of getResponseHandlers()) {
    try {
      const result = handler(method, url, status, currentBody);
      if (result !== undefined) {
        currentBody = result;
      }
    } catch (err) {
      console.error('[GlobalHttpInterceptor] Response handler error:', err);
    }
  }
  return currentBody;
}

// ---------------------------------------------------------------------------
// Event emission
// ---------------------------------------------------------------------------

function emitEvent(event: GlobalHttpEvent): void {
  const buffer = getEventBuffer();
  buffer.push(event);
  // Cap buffer to prevent memory leak before Angular drains it
  if (buffer.length > 1000) buffer.shift();

  const eventName = event.type === 'request' ? REQUEST_EVENT
                  : event.type === 'error'   ? ERROR_EVENT
                  : RESPONSE_EVENT;
  window.dispatchEvent(new CustomEvent(eventName, { detail: event }));
}

// ---------------------------------------------------------------------------
// Parse response headers from XHR
// ---------------------------------------------------------------------------

function parseResponseHeaders(xhr: XMLHttpRequest): Record<string, string> {
  const headers: Record<string, string> = {};
  const raw = xhr.getAllResponseHeaders();
  if (!raw) return headers;
  raw.trim().split(/[\r\n]+/).forEach(line => {
    const idx = line.indexOf(':');
    if (idx > 0) {
      headers[line.substring(0, idx).trim().toLowerCase()] = line.substring(idx + 1).trim();
    }
  });
  return headers;
}

// ---------------------------------------------------------------------------
// Per-instance XHR metadata keys (used by prototype getters)
// ---------------------------------------------------------------------------

const NDE_METHOD     = '__nde_method';
const NDE_URL        = '__nde_url';
const NDE_HEADERS    = '__nde_headers';
const NDE_MOD_TEXT   = '__nde_modified_text';   // cached modified responseText
const NDE_MOD_OBJ    = '__nde_modified_obj';    // cached modified response (object)
const NDE_HANDLED    = '__nde_response_handled'; // boolean: handlers already ran

// ---------------------------------------------------------------------------
// Zone.js-aware original resolution
// ---------------------------------------------------------------------------

/**
 * Zone.js (used by Angular) monkey-patches browser APIs and stores the
 * original, unpatched functions under `__zone_symbol__<name>`.
 *
 * If we blindly grab `XMLHttpRequest.prototype.open` as our "original",
 * we get Zone.js's wrapper — meaning our interceptor still runs inside
 * Angular's zone, triggering unnecessary change detection and zone task
 * tracking.
 *
 * By preferring the `__zone_symbol__` version when it exists, we bypass
 * Zone.js entirely and talk directly to the browser's native implementation.
 */
function getOriginalXHRMethod<K extends keyof XMLHttpRequest>(name: K): XMLHttpRequest[K] {
  const zoneKey = `__zone_symbol__${name}` as keyof XMLHttpRequest;
  return (XMLHttpRequest.prototype[zoneKey] ?? XMLHttpRequest.prototype[name]) as XMLHttpRequest[K];
}

// ---------------------------------------------------------------------------
// XHR monkey-patch
// ---------------------------------------------------------------------------

function patchXHR(): void {
  const originalOpen = getOriginalXHRMethod('open');
  const originalSend = getOriginalXHRMethod('send');
  const originalSetRequestHeader = getOriginalXHRMethod('setRequestHeader');

  // ---- Prototype-level response getters ---------------------------------
  //
  // We replace the native `response` and `responseText` getters on the
  // prototype ONCE. Every XHR instance then goes through these getters.
  //
  // When readyState === 4, the getter checks for a per-instance flag
  // (__nde_response_handled). If not yet handled, it runs the response
  // handler chain, stores the result on the instance, and returns it.
  //
  // This is Zone.js-safe because:
  //  - Zone.js does NOT patch data property getters (response/responseText)
  //  - Prototype-level descriptors survive Zone.js's configurable: true
  //    force on instance-level Object.defineProperty calls
  //  - It's ordering-independent: whoever reads first triggers the chain
  //
  const nativeResponseTextDesc = Object.getOwnPropertyDescriptor(
    XMLHttpRequest.prototype, 'responseText'
  )!;
  const nativeResponseDesc = Object.getOwnPropertyDescriptor(
    XMLHttpRequest.prototype, 'response'
  )!;
  const nativeResponseTextGetter = nativeResponseTextDesc.get!;
  const nativeResponseGetter     = nativeResponseDesc.get!;

  /**
   * Run response handlers for this XHR instance (once).
   * Stores the result as __nde_modified_text / __nde_modified_obj on the instance.
   */
  function ensureHandled(xhr: any): void {
    if (xhr[NDE_HANDLED]) return;
    xhr[NDE_HANDLED] = true;

    const isError = xhr.status >= 400 || xhr.status === 0;
    if (isError || getResponseHandlers().length === 0) return;

    const method: string = xhr[NDE_METHOD] || 'UNKNOWN';
    const url: string    = xhr[NDE_URL] || '';

    // Read original via native getters
    let responseBody: unknown;
    if (xhr.responseType === 'json') {
      responseBody = nativeResponseGetter.call(xhr);
    } else {
      const text = nativeResponseTextGetter.call(xhr);
      responseBody = text;
      try { responseBody = JSON.parse(text); } catch { /* not JSON */ }
    }

    try {
      const modified = callResponseHandlers(method, url, xhr.status, responseBody);

      // Store both string and object forms
      const modifiedStr = typeof modified === 'string' ? modified : JSON.stringify(modified);
      const modifiedObj = typeof modified === 'string'
        ? (() => { try { return JSON.parse(modified); } catch { return modified; } })()
        : modified;

      xhr[NDE_MOD_TEXT] = modifiedStr;
      xhr[NDE_MOD_OBJ]  = modifiedObj;
    } catch (err) {
      console.error('[GlobalHttpInterceptor] Response handler chain error:', err);
    }
  }

  Object.defineProperty(XMLHttpRequest.prototype, 'responseText', {
    configurable: true,
    enumerable: true,
    get() {
      if (this.readyState === 4 && getResponseHandlers().length > 0) {
        ensureHandled(this);
        if (NDE_MOD_TEXT in this) return this[NDE_MOD_TEXT];
      }
      return nativeResponseTextGetter.call(this);
    }
  });

  Object.defineProperty(XMLHttpRequest.prototype, 'response', {
    configurable: true,
    enumerable: true,
    get() {
      if (this.readyState === 4 && getResponseHandlers().length > 0) {
        ensureHandled(this);
        if (NDE_MOD_OBJ in this) {
          // Return the right type for the responseType
          if (this.responseType === 'json') return this[NDE_MOD_OBJ];
          if (this.responseType === '' || this.responseType === 'text') return this[NDE_MOD_TEXT];
        }
      }
      return nativeResponseGetter.call(this);
    }
  });

  // ---- Method patches ---------------------------------------------------

  // Capture request headers
  XMLHttpRequest.prototype.setRequestHeader = function (
    this: XMLHttpRequest,
    name: string,
    value: string
  ) {
    if (!(this as any)[NDE_HEADERS]) (this as any)[NDE_HEADERS] = {};
    (this as any)[NDE_HEADERS][name] = value;
    return originalSetRequestHeader.apply(this, [name, value]);
  };

  // Capture method + URL
  XMLHttpRequest.prototype.open = function (
    this: XMLHttpRequest,
    method: string,
    url: string | URL,
    ...rest: any[]
  ) {
    (this as any)[NDE_METHOD] = method;
    (this as any)[NDE_URL] = typeof url === 'string' ? url : url.toString();
    (this as any)[NDE_HEADERS] = {};
    // Reset handler state for reused XHR instances
    (this as any)[NDE_HANDLED] = false;
    delete (this as any)[NDE_MOD_TEXT];
    delete (this as any)[NDE_MOD_OBJ];
    return originalOpen.apply(this, [method, url, ...rest] as any);
  };

  // Intercept send — call handler chain, emit events
  XMLHttpRequest.prototype.send = function (
    this: XMLHttpRequest,
    body?: Document | XMLHttpRequestBodyInit | null
  ) {
    const method: string = (this as any)[NDE_METHOD] || 'UNKNOWN';
    const url: string = (this as any)[NDE_URL] || '';
    const reqHeaders: Record<string, string> = (this as any)[NDE_HEADERS] || {};

    const mod = callHandlers(method, url, reqHeaders, body);
    if (mod.blocked) {
      console.warn('[GlobalHttpInterceptor] Request blocked:', method, url);
      this.abort();
      return;
    }

    // If the URL was modified, re-open with the new URL
    if (mod.url !== url) {
      (this as any)[NDE_URL] = mod.url;
      (this as any)[NDE_METHOD] = mod.method;
      // Preserve async flag (3rd arg to open, default true)
      originalOpen.apply(this, [mod.method, mod.url, true] as any);
      // Re-apply all headers (original + modified)
      for (const [k, v] of Object.entries(mod.headers)) {
        originalSetRequestHeader.apply(this, [k, v]);
      }
    } else {
      // Apply any new/modified headers
      for (const [k, v] of Object.entries(mod.headers)) {
        if (reqHeaders[k] !== v) {
          originalSetRequestHeader.apply(this, [k, v]);
        }
      }
    }

    // Reset handler state (in case XHR instance is reused)
    (this as any)[NDE_HANDLED] = false;
    delete (this as any)[NDE_MOD_TEXT];
    delete (this as any)[NDE_MOD_OBJ];

    const eventId = generateEventId();
    const startTime = Date.now();

    // Emit request event
    emitEvent({
      id: eventId,
      type: 'request',
      method: mod.method,
      url: sanitizeUrl(mod.url),
      timestamp: startTime,
      source: 'xhr',
      requestHeaders: mod.headers,
      body: mod.body
    });

    // Emit response/error event when the XHR completes.
    // By this point the prototype getter has already run handlers
    // on whoever read `response`/`responseText` first.
    const xhrRef = this;
    this.addEventListener('readystatechange', function ndeEmitEvent() {
      if (xhrRef.readyState !== 4) return;

      const isError = xhrRef.status >= 400 || xhrRef.status === 0;

      // Trigger handler chain if not yet triggered (e.g. nobody read response yet)
      ensureHandled(xhrRef);

      // Use modified body if available, otherwise parse original
      let finalBody: unknown;
      if (NDE_MOD_OBJ in (xhrRef as any)) {
        finalBody = (xhrRef as any)[NDE_MOD_OBJ];
      } else {
        try { finalBody = JSON.parse(nativeResponseTextGetter.call(xhrRef)); }
        catch { finalBody = nativeResponseTextGetter.call(xhrRef); }
      }

      emitEvent({
        id: eventId,
        type: isError ? 'error' : 'response',
        method: mod.method,
        url: sanitizeUrl(mod.url),
        timestamp: Date.now(),
        duration: Date.now() - startTime,
        status: xhrRef.status,
        statusText: xhrRef.statusText,
        source: 'xhr',
        responseHeaders: parseResponseHeaders(xhrRef),
        error: isError ? `${xhrRef.status} ${xhrRef.statusText}` : undefined,
        body: finalBody
      });
    });

    const sendBody = mod.body !== undefined ? mod.body : body;
    return originalSend.apply(this, [sendBody] as any);
  };
}

// ---------------------------------------------------------------------------
// Fetch monkey-patch
// ---------------------------------------------------------------------------

function patchFetch(): void {
  const originalFetch = window.fetch;

  window.fetch = function (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    let method = init?.method || 'GET';
    let url = typeof input === 'string' ? input
            : input instanceof URL      ? input.toString()
            : input.url;
    let headers: Record<string, string> = {};

    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((v, k) => { headers[k] = v; });
      } else if (Array.isArray(init.headers)) {
        init.headers.forEach(([k, v]) => { headers[k] = v; });
      } else {
        headers = { ...(init.headers as Record<string, string>) };
      }
    }

    const mod = callHandlers(method, url, headers, init?.body);
    if (mod.blocked) {
      console.warn('[GlobalHttpInterceptor] Fetch blocked:', method, url);
      return Promise.reject(new Error('[NDE] Request blocked by handler'));
    }

    // Apply modifications
    const modifiedInit: RequestInit = {
      ...init,
      method: mod.method,
      headers: mod.headers,
      body: mod.body as BodyInit | null | undefined,
    };
    const modifiedInput = mod.url !== url ? mod.url : input;

    const eventId = generateEventId();
    const startTime = Date.now();

    emitEvent({
      id: eventId,
      type: 'request',
      method: mod.method,
      url: sanitizeUrl(mod.url),
      timestamp: startTime,
      source: 'fetch',
      requestHeaders: mod.headers,
      body: mod.body
    });

    return originalFetch.call(window, modifiedInput, modifiedInit).then(
      (response) => {
        const isError = !response.ok;
        emitEvent({
          id: eventId,
          type: isError ? 'error' : 'response',
          method: mod.method,
          url: sanitizeUrl(mod.url),
          timestamp: Date.now(),
          duration: Date.now() - startTime,
          status: response.status,
          statusText: response.statusText,
          source: 'fetch'
        });
        return response;
      },
      (error) => {
        emitEvent({
          id: eventId,
          type: 'error',
          method: mod.method,
          url: sanitizeUrl(mod.url),
          timestamp: Date.now(),
          duration: Date.now() - startTime,
          error: error?.message || String(error),
          source: 'fetch'
        });
        throw error;
      }
    );
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Install the global XHR + fetch interceptor.
 * Safe to call multiple times — only patches once (even across federation modules).
 */
export function installGlobalHttpInterceptor(): void {
  if (W[GLOBAL_FLAG]) {
    console.warn('[GlobalHttpInterceptor] Already installed, skipping.');
    return;
  }
  W[GLOBAL_FLAG] = true;

  patchXHR();
  patchFetch();

  console.log('[GlobalHttpInterceptor] Installed — tracking all XHR + fetch traffic.');
}

export function addRequestHandler(handler: RequestHandler): void {
  getRequestHandlers().push(handler);
}

export function removeRequestHandler(handler: RequestHandler): void {
  const handlers = getRequestHandlers();
  const idx = handlers.indexOf(handler);
  if (idx >= 0) handlers.splice(idx, 1);
}

export function addResponseHandler(handler: ResponseHandler): void {
  getResponseHandlers().push(handler);
}

export function removeResponseHandler(handler: ResponseHandler): void {
  const handlers = getResponseHandlers();
  const idx = handlers.indexOf(handler);
  if (idx >= 0) handlers.splice(idx, 1);
}

export { getEventBuffer };

export function clearEventBuffer(): void {
  const buffer = getEventBuffer();
  buffer.length = 0;
}

export function isInstalled(): boolean {
  return !!W[GLOBAL_FLAG];
}
