/**
 * Host-surface probes. These must run *before the host application boots*, so
 * this module is loaded eagerly (from `bootstrap.ts`) when the workbench is
 * enabled. It has no UI and no framework deps — just lightweight instrumentation
 * that records what the host exposes, into module-level state the lazy panel
 * reads later via {@link getHostSurface}.
 *
 * Two probes:
 * 1. A `customElements.define` patch — records every web component the host
 *    registers, with its `observedAttributes` (a partial input schema we can
 *    read without host source).
 * 2. A global slot-query recorder (`window.__NDE_RECORD_SLOT__`) that
 *    `AppModule.getComponentRef` calls — capturing which NDE slots the host
 *    asks for, including misses (slots we don't fill).
 */

export type ElementOrigin = 'primo' | 'nde' | 'custom' | 'other';

export interface DefinedElementInfo {
  tag: string;
  origin: ElementOrigin;
  observedAttributes: string[];
  definedAt: number;
}

export interface SlotQueryInfo {
  key: string;
  hits: number;
  misses: number;
  lastAt: number;
}

export interface HostSurfaceSnapshot {
  defined: DefinedElementInfo[];
  slotQueries: SlotQueryInfo[];
  installedAt: number | null;
}

/** Our own workbench tag — excluded from host-surface reporting. */
const SELF_TAG = 'nde-workbench';

const definedElements = new Map<string, DefinedElementInfo>();
const slotQueries = new Map<string, SlotQueryInfo>();
let installedAt: number | null = null;

/** Classify a custom-element tag by its prefix. */
export function classifyOrigin(tag: string): ElementOrigin {
  const t = tag.toLowerCase();
  if (t.startsWith('prm-')) return 'primo';
  if (t.startsWith('nde-')) return 'nde';
  if (t.startsWith('custom-') || t.startsWith('libis-')) return 'custom';
  return 'other';
}

/**
 * Install the probes. Idempotent. Call once, synchronously, before the host
 * boots (and only when the workbench is enabled).
 */
export function installHostProbes(): void {
  if (installedAt !== null) return;
  installedAt = now();

  patchCustomElementsDefine();
  (window as any).__NDE_RECORD_SLOT__ = recordSlotQuery;
}

/** Record one host query for an NDE slot key. `hit` = a component was returned. */
export function recordSlotQuery(key: string, hit: boolean): void {
  const existing = slotQueries.get(key) ?? {
    key,
    hits: 0,
    misses: 0,
    lastAt: 0,
  };
  if (hit) existing.hits++;
  else existing.misses++;
  existing.lastAt = now();
  slotQueries.set(key, existing);
}

/** Snapshot of everything collected so far. */
export function getHostSurface(): HostSurfaceSnapshot {
  return {
    defined: Array.from(definedElements.values()).sort((a, b) =>
      a.tag.localeCompare(b.tag),
    ),
    slotQueries: Array.from(slotQueries.values()).sort(
      (a, b) => b.lastAt - a.lastAt,
    ),
    installedAt,
  };
}

// ── internals ────────────────────────────────────────────────────────────────

function patchCustomElementsDefine(): void {
  const registry = window.customElements;
  if (!registry || (registry.define as any).__ndePatched) return;

  const original = registry.define.bind(registry);
  const patched = function (
    name: string,
    ctor: CustomElementConstructor,
    options?: ElementDefinitionOptions,
  ): void {
    try {
      if (name !== SELF_TAG && !definedElements.has(name)) {
        const observed: string[] = Array.isArray(
          (ctor as any)?.observedAttributes,
        )
          ? [...(ctor as any).observedAttributes]
          : [];
        definedElements.set(name, {
          tag: name,
          origin: classifyOrigin(name),
          observedAttributes: observed,
          definedAt: now(),
        });
      }
    } catch {
      /* never let instrumentation break a host registration */
    }
    return original(name, ctor, options);
  };
  (patched as any).__ndePatched = true;
  registry.define = patched as typeof registry.define;
}

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}
