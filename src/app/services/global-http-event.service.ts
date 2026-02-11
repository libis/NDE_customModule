/**
 * GlobalHttpEventService — Angular bridge for the global HTTP interceptor.
 *
 * This service connects the browser-level XHR/fetch monkey-patch (Layer 1)
 * to Angular's dependency injection and RxJS world (Layer 2).
 *
 * It listens for CustomEvents dispatched by the global interceptor and
 * re-emits them as typed RxJS observables. On construction it also drains
 * any events that were buffered before Angular bootstrapped.
 *
 * Consumers (e.g. AnalyticsService) subscribe to the exposed observables
 * from wherever they are wired up — typically in AppModule's constructor.
 *
 * IMPORTANT: This service is NOT providedIn:'root'. In a Module Federation
 * microfrontend the "root" injector belongs to the host app. Using
 * providedIn:'root' would create the service in the host's injector scope
 * where none of the module's subscribers exist yet. Instead, this service
 * is explicitly provided in AppModule's providers array so it lives in the
 * module's own injector — the same scope as the interceptors and components
 * that depend on it.
 */

import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Observable, merge } from 'rxjs';
import {
  GlobalHttpEvent,
  RequestHandler,
  getEventBuffer,
  clearEventBuffer,
  addRequestHandler,
  removeRequestHandler,
  isInstalled,
  REQUEST_EVENT,
  RESPONSE_EVENT,
  ERROR_EVENT
} from './global-http-interceptor';

@Injectable()
export class GlobalHttpEventService implements OnDestroy {

  private readonly _request$  = new Subject<GlobalHttpEvent>();
  private readonly _response$ = new Subject<GlobalHttpEvent>();
  private readonly _error$    = new Subject<GlobalHttpEvent>();
  private readonly listeners: Array<{ event: string; fn: EventListener }> = [];

  /** All request events (emitted before send). */
  readonly request$: Observable<GlobalHttpEvent> = this._request$.asObservable();

  /** All successful response events (HTTP 2xx/3xx). */
  readonly response$: Observable<GlobalHttpEvent> = this._response$.asObservable();

  /** All error events (network failures or HTTP >= 400). */
  readonly error$: Observable<GlobalHttpEvent> = this._error$.asObservable();

  /** All events merged into a single stream. */
  readonly all$: Observable<GlobalHttpEvent> = merge(
    this.request$,
    this.response$,
    this.error$
  );

  constructor() {
    this.attachListeners();
    this.drainBuffer();

    console.log('[GlobalHttpEventService] Initialized — listening for HTTP events.');
  }

  /**
   * Register a request handler that can inspect, modify, or block requests
   * before they are sent.
   *
   * @returns A teardown function that removes the handler.
   */
  addHandler(handler: RequestHandler): () => void {
    addRequestHandler(handler);
    return () => removeRequestHandler(handler);
  }

  ngOnDestroy(): void {
    for (const { event, fn } of this.listeners) {
      window.removeEventListener(event, fn);
    }
    this._request$.complete();
    this._response$.complete();
    this._error$.complete();
  }

  // -----------------------------------------------------------------------
  // Private
  // -----------------------------------------------------------------------

  private attachListeners(): void {
    const listen = (eventName: string, subject: Subject<GlobalHttpEvent>) => {
      const fn = ((e: CustomEvent<GlobalHttpEvent>) => {
        subject.next(e.detail);
      }) as EventListener;
      window.addEventListener(eventName, fn);
      this.listeners.push({ event: eventName, fn });
    };

    listen(REQUEST_EVENT,  this._request$);
    listen(RESPONSE_EVENT, this._response$);
    listen(ERROR_EVENT,    this._error$);
  }

  /**
   * Drain any events that were buffered by Layer 1 before this Angular
   * service was instantiated. This closes the gap between XHR/fetch patch
   * installation (in bootstrap.ts) and Angular DI initialization.
   */
  private drainBuffer(): void {
    if (!isInstalled()) {
      console.warn(
        '[GlobalHttpEventService] Global interceptor not installed. ' +
        'Call installGlobalHttpInterceptor() in bootstrap.ts.'
      );
      return;
    }

    const buffered = getEventBuffer();
    for (const event of buffered) {
      switch (event.type) {
        case 'request':  this._request$.next(event); break;
        case 'response': this._response$.next(event); break;
        case 'error':    this._error$.next(event); break;
      }
    }

    if (buffered.length > 0) {
      console.log(`[GlobalHttpEventService] Drained ${buffered.length} buffered event(s).`);
    }
    clearEventBuffer();
  }
}
