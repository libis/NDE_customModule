/**
 * @NDEEvent Decorator
 *
 * Auto-registers event handlers that subscribe to GlobalHttpEventService streams.
 * Unlike interceptors (which Angular only instantiates on HttpClient usage),
 * events are eagerly created when the module bootstraps — guaranteeing their
 * constructors run and subscriptions are active immediately.
 *
 * Supports two modes:
 *
 *  1. **Observe** (default) — subscribe to RxJS streams for read-only
 *     observation of HTTP traffic. Override `onEvent()`.
 *
 *  2. **Modify** — register Layer 1 request/response handlers that can
 *     change URLs, headers, bodies, block requests, or mutate response
 *     data *before* the host application reads it.
 *     Override `onRequest()` and/or `onResponse()`.
 *
 * @example Observe-only
 * ```typescript
 * @NDEEvent({ stream: 'response', match: /\/api\/search/ })
 * @Injectable()
 * export class SearchLogger extends NDEEventBase {
 *   onEvent(event: GlobalHttpEvent): void {
 *     console.log('search completed', event.status);
 *   }
 * }
 * ```
 *
 * @example Modify response
 * ```typescript
 * @NDEEvent({ stream: 'response', match: /\/api\/search/ })
 * @Injectable()
 * export class SearchTransform extends NDEEventBase {
 *   onResponse(method: string, url: string, status: number, body: unknown): unknown {
 *     const data = body as any;
 *     // mutate and return
 *     return data;
 *   }
 * }
 * ```
 *
 * @example Modify request
 * ```typescript
 * @NDEEvent({ stream: 'request', match: /\/primaws/ })
 * @Injectable()
 * export class AuthEnricher extends NDEEventBase {
 *   onRequest(method: string, url: string, headers: Record<string, string>, body: unknown): RequestModification | void {
 *     return { headers: { ...headers, 'X-Custom': 'value' } };
 *   }
 * }
 * ```
 */

import { Type, Provider, APP_INITIALIZER, Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { GlobalHttpEventService } from '../services/global-http-event.service';
import {
  GlobalHttpEvent,
  RequestModification,
} from '../services/global-http-interceptor';
import 'reflect-metadata';

// Re-export so subclasses can import from one place
export { GlobalHttpEvent, RequestModification } from '../services/global-http-interceptor';

/* ------------------------------------------------------------------ */
/*  Public types                                                       */
/* ------------------------------------------------------------------ */

export type EventStream = 'request' | 'response' | 'error' | 'all';

export interface NDEEventConfig {
  /** Which GlobalHttpEventService stream to subscribe to. Default: 'all' */
  stream?: EventStream;

  /**
   * Optional URL filter. When set the handler / observer is only
   * called for events whose URL matches this pattern.
   * Accepts a RegExp or a plain string (tested with `url.includes(match)`).
   */
  match?: RegExp | string;

  /** Execution order when multiple events listen to the same stream.
   *  Lower numbers execute first. Default: 50 */
  order?: number;

  /** Human-readable description for debugging / dev-tools. */
  description?: string;

  /** Feature-flag: set to false to skip registration. Default: true */
  enabled?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Internal registry                                                  */
/* ------------------------------------------------------------------ */

interface EventEntry {
  constructor: Type<any>;
  config: Required<Pick<NDEEventConfig, 'order' | 'enabled'>> & NDEEventConfig;
}

const NDE_EVENT_METADATA_KEY = 'nde:event:config';
const eventRegistry: EventEntry[] = [];

/* ------------------------------------------------------------------ */
/*  Decorator                                                          */
/* ------------------------------------------------------------------ */

export function NDEEvent(config: NDEEventConfig = {}) {
  return function <T extends Type<any>>(constructor: T) {
    const normalizedConfig = {
      ...config,
      stream: config.stream ?? 'all',
      order: config.order ?? 50,
      enabled: config.enabled ?? true,
    };

    Reflect.defineMetadata(NDE_EVENT_METADATA_KEY, normalizedConfig, constructor);

    const existingIndex = eventRegistry.findIndex(e => e.constructor === constructor);
    if (existingIndex >= 0) {
      console.warn(`[NDEEvent] ${constructor.name} is already registered. Updating configuration.`);
      eventRegistry[existingIndex] = { constructor, config: normalizedConfig };
    } else {
      eventRegistry.push({ constructor, config: normalizedConfig });
      eventRegistry.sort((a, b) => a.config.order - b.config.order);
    }

    console.log(
      `[NDEEvent] Registered: ${constructor.name} ` +
      `(stream: ${normalizedConfig.stream}, order: ${normalizedConfig.order})`
    );

    return constructor;
  };
}

/* ------------------------------------------------------------------ */
/*  Base class — auto-subscribes from decorator metadata               */
/* ------------------------------------------------------------------ */

/**
 * Base class for NDE events.
 *
 * **Observe** — override `onEvent(event)` to react to HTTP traffic.
 *
 * **Modify requests** — override `onRequest(method, url, headers, body)`
 * and return a `RequestModification` (or void to pass through).
 *
 * **Modify responses** — override `onResponse(method, url, status, body)`
 * and return the (possibly mutated) body (or void to leave unchanged).
 *
 * The `match` filter from `@NDEEvent()` is applied automatically to all
 * three hooks — you only receive calls for URLs that match.
 */
@Injectable()
export abstract class NDEEventBase implements OnDestroy {
  private __sub: Subscription | null = null;
  private __removeRequestHandler: (() => void) | null = null;
  private __removeResponseHandler: (() => void) | null = null;

  constructor(protected globalHttp: GlobalHttpEventService) {
    const config: NDEEventConfig | undefined =
      Reflect.getMetadata(NDE_EVENT_METADATA_KEY, this.constructor);

    const streamName: EventStream = config?.stream ?? 'all';
    const matchFn = buildMatchFn(config?.match);
    const urlMatchFn = buildUrlMatchFn(config?.match);

    // ---- Layer 2: RxJS observation (onEvent) -------------------------
    if (this.hasOnEvent()) {
      const stream$ = streamName === 'request'  ? this.globalHttp.request$
                    : streamName === 'response' ? this.globalHttp.response$
                    : streamName === 'error'    ? this.globalHttp.error$
                    :                             this.globalHttp.all$;

      this.__sub = stream$
        .pipe(filter(matchFn))
        .subscribe(event => this.onEvent(event));
    }

    // ---- Layer 1: request handler (onRequest) ------------------------
    if (this.hasOnRequest()) {
      this.__removeRequestHandler = this.globalHttp.addHandler(
        (method, url, headers, body) => {
          if (!urlMatchFn(url)) return;
          return this.onRequest(method, url, headers, body);
        }
      );
    }

    // ---- Layer 1: response handler (onResponse) ----------------------
    if (this.hasOnResponse()) {
      this.__removeResponseHandler = this.globalHttp.addResponseHandler(
        (method, url, status, body) => {
          if (!urlMatchFn(url)) return;
          return this.onResponse(method, url, status, body);
        }
      );
    }

    const hooks = [
      this.hasOnEvent()    && 'onEvent',
      this.hasOnRequest()  && 'onRequest',
      this.hasOnResponse() && 'onResponse',
    ].filter(Boolean).join(', ');

    console.log(
      `[${this.constructor.name}] Active on "${streamName}" stream ` +
      `[hooks: ${hooks || 'none'}]`
    );
  }

  // ---- Overridable hooks -----------------------------------------------

  /**
   * Called for every matching event on the configured stream.
   * Read-only observation — runs AFTER the response was sent to the host.
   * Override this for logging, analytics, or side-effects.
   */
  onEvent(_event: GlobalHttpEvent): void {}

  /**
   * Called BEFORE a matching request is sent (Layer 1).
   * Return a `RequestModification` to change method, url, headers, body,
   * or set `blocked: true` to cancel the request entirely.
   * Return void / undefined to pass through unchanged.
   */
  onRequest(
    _method: string,
    _url: string,
    _headers: Record<string, string>,
    _body: unknown
  ): void {}

  /**
   * Called BEFORE the host reads a matching response (Layer 1).
   * Return the (possibly mutated) body to replace it, or void/undefined
   * to leave the response unchanged.
   */
  onResponse(
    _method: string,
    _url: string,
    _status: number,
    _body: unknown
  ): void {}

  // ---- Lifecycle -------------------------------------------------------

  ngOnDestroy(): void {
    this.__sub?.unsubscribe();
    this.__removeRequestHandler?.();
    this.__removeResponseHandler?.();
  }

  // ---- Private helpers -------------------------------------------------

  /**
   * Check if the subclass actually overrides a hook.
   * We skip registration for hooks that are just the empty base methods
   * to avoid unnecessary handler chains.
   */
  private hasOnEvent(): boolean {
    return this.constructor.prototype.onEvent !== NDEEventBase.prototype.onEvent;
  }

  private hasOnRequest(): boolean {
    return this.constructor.prototype.onRequest !== NDEEventBase.prototype.onRequest;
  }

  private hasOnResponse(): boolean {
    return this.constructor.prototype.onResponse !== NDEEventBase.prototype.onResponse;
  }
}

/* ------------------------------------------------------------------ */
/*  Match helpers                                                      */
/* ------------------------------------------------------------------ */

/**
 * Build a predicate for GlobalHttpEvent objects (Layer 2 streams).
 */
function buildMatchFn(match: RegExp | string | undefined): (e: GlobalHttpEvent) => boolean {
  if (match === undefined) return () => true;
  if (match instanceof RegExp) return (e) => match.test(e.url);
  return (e) => e.url.includes(match);
}

/**
 * Build a predicate for raw URL strings (Layer 1 handlers).
 */
function buildUrlMatchFn(match: RegExp | string | undefined): (url: string) => boolean {
  if (match === undefined) return () => true;
  if (match instanceof RegExp) return (url) => match.test(url);
  return (url) => url.includes(match);
}

/* ------------------------------------------------------------------ */
/*  Provider helpers                                                   */
/* ------------------------------------------------------------------ */

/**
 * Returns Angular providers that:
 *  1. Register each event class so Angular can inject its dependencies.
 *  2. Use APP_INITIALIZER to eagerly instantiate every registered event
 *     at bootstrap time (not lazily like HTTP_INTERCEPTORS).
 */
export function getEventProviders(): Provider[] {
  const enabled = eventRegistry.filter(e => e.config.enabled);

  // Each event class needs to be a regular provider so Angular can create it
  const classProviders: Provider[] = enabled.map(e => e.constructor);

  // APP_INITIALIZER that pulls every event from the injector — forcing instantiation
  const initializer: Provider = {
    provide: APP_INITIALIZER,
    multi: true,
    useFactory: (...instances: any[]) => () => {
      console.log(`[NDEEvent] Eagerly instantiated ${instances.length} event(s).`);
    },
    deps: enabled.map(e => e.constructor),
  };

  return [...classProviders, initializer];
}

/* ------------------------------------------------------------------ */
/*  Introspection / debugging helpers                                  */
/* ------------------------------------------------------------------ */

export function getEventInfo(): Array<{
  name: string;
  stream: EventStream;
  order: number;
  enabled: boolean;
  match?: RegExp | string;
  description?: string;
}> {
  return eventRegistry.map(e => ({
    name: e.constructor.name,
    stream: (e.config.stream ?? 'all') as EventStream,
    order: e.config.order,
    enabled: e.config.enabled,
    match: e.config.match,
    description: e.config.description,
  }));
}

export function getNDEEventConfig(cls: Type<any>): NDEEventConfig | undefined {
  return Reflect.getMetadata(NDE_EVENT_METADATA_KEY, cls);
}

export function disableEvent(cls: Type<any>): void {
  const entry = eventRegistry.find(e => e.constructor === cls);
  if (entry) {
    entry.config.enabled = false;
    console.log(`[NDEEvent] Disabled: ${cls.name}`);
  }
}

export function enableEvent(cls: Type<any>): void {
  const entry = eventRegistry.find(e => e.constructor === cls);
  if (entry) {
    entry.config.enabled = true;
    console.log(`[NDEEvent] Enabled: ${cls.name}`);
  }
}

export function clearEventRegistry(): void {
  eventRegistry.length = 0;
}
