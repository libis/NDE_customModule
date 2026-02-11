import { Injectable } from '@angular/core';

/**
 * Interface for analytics events
 */
export interface AnalyticsEvent {
  type: 'request' | 'response' | 'error';
  method: string;
  url: string;
  timestamp: number;
  duration?: number;
  status?: number;
  error?: string;
}

/**
 * Analytics service that tracks HTTP events.
 * Provided at root level so a single instance is shared
 * between interceptors and any component that injects it.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private events: AnalyticsEvent[] = [];

  track(event: AnalyticsEvent): void {
    this.events.push(event);
    // Prevent unbounded growth
    if (this.events.length > 5000) {
      this.events = this.events.slice(-2500);
    }
    //console.log('[Analytics]', event);
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  getEventCount(): number {
    return this.events.length;
  }

  clear(): void {
    this.events.length = 0;
  }
}
