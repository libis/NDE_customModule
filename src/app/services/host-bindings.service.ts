import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HostBindings {

  // Keys that are known DI or Angular internals
  private readonly disallowedKeys = new Set([
    'activatedRoute',
    'route',
    'router',
    'routerState',
    'location',
    'ngZone',
    'cdr',
    'changeDetectorRef',
    'elementRef',
    'viewContainerRef',
    '_activatedRoute',
    '_route',
    '_router',
    '_location',
  ]);


  // A heuristic to detect DI instances from the host
  private isLikelyInjected(value: any): boolean {
    if (!value) return false;

    // Angular DI objects often have ng metadata
    if (value.constructor?.name?.startsWith('ɵ')) return true;
    if (value.constructor?.name?.includes('ActivatedRoute')) return true;
    if (value.constructor?.name?.includes('Router')) return true;

    // Detect host-framework Angular objects (wrong injector)
    if (value.hasOwnProperty('snapshot') && value.hasOwnProperty('params')) {
      // This is almost certainly ActivatedRoute
      return true;
    }

    return false;
  }



  applyBindings(target: any, host: any) {
    if (!host) {
      console.warn('[HostBindings - apply] host is undefined – nothing to bind.');
      return;
    }

    // ✅ Copy direct enumerable properties
    Object.keys(host).forEach((key) => {
      if (this.disallowedKeys.has(key)) {
        console.debug('[HostBindings] Skipped DI key:', key);
        return;
      }

      const value = host[key];
      if (this.isLikelyInjected(value)) {
        console.debug(`[HostBindings] Skipped DI field: ${key}`);
        return;
      }

      target[key] = host[key];
    });

    // Copy direct enumerables (fields, public properties)
    Object.keys(host).forEach((key) => {
      target[key] = host[key];
    });

    // Copy prototype methods (excluding Angular internals)
    const proto = Object.getPrototypeOf(host);

    Object.getOwnPropertyNames(proto).forEach((key) => {
      // skip Angular internals & lifecycle hooks
      console.log ("skip Angular internal: ", key)
      if (
        key === 'constructor' ||
        key.startsWith('ɵ') || // Angular internals
        key.startsWith('ng') // ngOnInit, ngOnChanges etc.
      ) {
        return;
      }

      const value = host[key];

      if (typeof value === 'function') {
        target[key] = value.bind(host);
      }
    });
  }
}
