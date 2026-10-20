import { Injectable, signal } from '@angular/core';
import { NDEEvent, NDEEventBase } from '../decorators/nde-event.decorator';
import { GlobalHttpEventService } from '../services/global-http-event.service';
import { GlobalHttpEvent } from '../services/global-http-interceptor';

/** The last search: read by the status bar. */
export const lastSearch = signal<{ ms: number; at: Date } | null>(null);

/**
 * Taipei demo: times every search.
 * Layer 2 (onEvent) only observes: the global interceptor already measured the request,
 * every response event carries its duration.
 */
@Injectable()
@NDEEvent({
  stream: 'response',
  match: /\/primaws\/rest\/pub\/pnxs\?/,
  order: 10,
  description: 'Taipei demo: time every search',
})
export class SearchTimerEvent extends NDEEventBase {
  constructor(globalHttp: GlobalHttpEventService) {
    super(globalHttp);
  }

  override onEvent(event: GlobalHttpEvent): void {
    if (event.duration === undefined) return;
    const ms = Math.round(event.duration);
    lastSearch.set({ ms, at: new Date() });
    console.log(`[SearchTimerEvent] search took ${ms} ms`);
  }
}
