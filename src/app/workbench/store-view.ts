import { Observable, Subscription } from 'rxjs';
import { PrimoStateService } from '@libis/primo-shared-state';
import { STORE_MANIFEST } from './store-manifest.generated';
import { StoreManifest, StoreDomain, StoreField, StoreWrite } from './store-manifest.types';

export function getStoreManifest(): StoreManifest {
  return STORE_MANIFEST;
}

/** Resolve the shared singleton PrimoStateService via the exposed injector. */
export function getPrimoService(): any | null {
  const injector = (window as any).__NDE_INJECTOR__;
  if (!injector) return null;
  try {
    return injector.get(PrimoStateService);
  } catch {
    return null;
  }
}

export function isInjectorAvailable(): boolean {
  return !!(window as any).__NDE_INJECTOR__;
}

/** Handle returned by {@link bindField}; call `stop()` to release. */
export interface LiveHandle {
  stop(): void;
}

const NOOP: LiveHandle = { stop() {} };

/**
 * Bind a field to its current live value, calling `onValue` with a formatted
 * string whenever it changes. Prefers the Observable variant (live), falling
 * back to Signal (single read) then Promise (snapshot). Parameterised
 * selectors aren't bound.
 */
export function bindField(
  domainName: string,
  field: StoreField,
  onValue: (text: string) => void,
): LiveHandle {
  if (field.hasArgs) {
    onValue('(takes an argument — not bound)');
    return NOOP;
  }

  const primo = getPrimoService();
  if (!primo) {
    onValue('(store not available — is the app bootstrapped?)');
    return NOOP;
  }
  const svc = primo[domainName];
  if (!svc) {
    onValue('(domain unavailable)');
    return NOOP;
  }

  if (field.variants.observable) {
    try {
      const obs = svc[field.variants.observable]() as Observable<unknown>;
      const sub: Subscription = obs.subscribe({
        next: (v) => onValue(formatValue(v)),
        error: (e) => onValue('⚠ ' + errMsg(e)),
      });
      return { stop: () => sub.unsubscribe() };
    } catch (e) {
      onValue('⚠ ' + errMsg(e));
      return NOOP;
    }
  }

  if (field.variants.signal) {
    try {
      const sig = svc[field.variants.signal]();
      onValue(formatValue(typeof sig === 'function' ? sig() : sig));
    } catch (e) {
      onValue('⚠ ' + errMsg(e));
    }
    return NOOP;
  }

  if (field.variants.promise) {
    try {
      Promise.resolve(svc[field.variants.promise]()).then(
        (v) => onValue(formatValue(v)),
        (e) => onValue('⚠ ' + errMsg(e)),
      );
    } catch (e) {
      onValue('⚠ ' + errMsg(e));
    }
    return NOOP;
  }

  onValue('(no readable variant)');
  return NOOP;
}

// ── copy-paste snippets ──────────────────────────────────────────────────────

export function fieldSnippets(
  domain: string,
  field: StoreField,
): { kind: string; code: string }[] {
  const out: { kind: string; code: string }[] = [];
  const v = field.variants;
  const arg = field.hasArgs ? 'id' : '';
  if (v.observable)
    out.push({
      kind: 'Observable',
      code: `this.primo.${domain}.${v.observable}(${arg}).subscribe(v => { /* … */ });`,
    });
  if (v.signal)
    out.push({
      kind: 'Signal',
      code: `readonly ${field.label} = this.primo.${domain}.${v.signal}(${arg});`,
    });
  if (v.promise)
    out.push({
      kind: 'Promise',
      code: `const ${field.label} = await this.primo.${domain}.${v.promise}(${arg});`,
    });
  return out;
}

export function writeSignature(write: StoreWrite): string {
  return `${write.name}(${write.params.map((p) => p.name).join(', ')})`;
}

export function writeSnippet(domain: string, write: StoreWrite): string {
  return `this.primo.${domain}.${write.name}(${write.params
    .map((p) => p.name)
    .join(', ')});`;
}

// ── value formatting ─────────────────────────────────────────────────────────

function formatValue(v: unknown): string {
  if (v === undefined) return 'undefined';
  if (v === null) return 'null';
  if (typeof v === 'string') return JSON.stringify(v);
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) {
    const head = `Array(${v.length})`;
    if (!v.length) return head;
    return `${head} ${truncate(safeStringify(v))}`;
  }
  return truncate(safeStringify(v));
}

function safeStringify(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function truncate(s: string, n = 280): string {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export type { StoreDomain, StoreField, StoreWrite };
