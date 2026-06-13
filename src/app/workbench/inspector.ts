import { reflectComponentType } from '@angular/core';
import {
  getAllRegistrations,
  RegistrationRecord,
} from '../decorators/nde-component.decorator';

/**
 * A flattened, display-ready view of one @NDEComponent registration for the
 * Components tab of the workbench.
 */
export interface InspectorItem {
  /** Component class name, e.g. `SearchStatsComponent`. */
  name: string;
  /** NDE slot selector, e.g. `nde-header`. */
  selector: string;
  /** Full slot key including the position suffix, e.g. `nde-header-before`. */
  fullSelector: string;
  position: string;
  priority: number;
  viewPattern: string | undefined;
  description: string | undefined;
  /** `vid` present when the component was decorated. */
  vid: string | undefined;
  /** Whether the component is active in the current view. */
  registered: boolean;
  reason: RegistrationRecord['reason'];
  /**
   * The DOM tag this component renders as (its Angular `@Component` selector),
   * e.g. `custom-search-stats`. Used to locate and highlight it on the page.
   * `null` when the selector can't be reflected.
   */
  domSelector: string | null;
}

/** Resolve the Angular element selector for a decorated component class. */
function resolveDomSelector(component: any): string | null {
  try {
    const meta = reflectComponentType(component);
    const sel = meta?.selector;
    if (!sel) return null;
    // Take the first element selector token; ignore attribute/class selectors.
    const first = sel.split(',')[0].trim();
    return /^[a-z][a-z0-9-]*$/i.test(first) ? first : null;
  } catch {
    return null;
  }
}

/** Build the display list for the Components tab, sorted active-first. */
export function getInspectorItems(): InspectorItem[] {
  return getAllRegistrations()
    .map((r): InspectorItem => ({
      name: r.component?.name ?? '(anonymous)',
      selector: r.config.selector,
      fullSelector: r.fullSelector,
      position: r.config.position || 'replace',
      priority: r.config.priority ?? 100,
      viewPattern: r.config.viewPattern
        ? String(r.config.viewPattern)
        : undefined,
      description: r.config.description,
      vid: r.vid,
      registered: r.registered,
      reason: r.reason,
      domSelector: resolveDomSelector(r.component),
    }))
    .sort((a, b) => {
      if (a.registered !== b.registered) return a.registered ? -1 : 1;
      return a.priority - b.priority;
    });
}

/** Find the live DOM nodes a component currently renders as, if any. */
export function findRenderedNodes(domSelector: string | null): HTMLElement[] {
  if (!domSelector) return [];
  return Array.from(
    document.querySelectorAll<HTMLElement>(domSelector),
  ).filter((el) => el.offsetParent !== null || el.getClientRects().length > 0);
}

/** The current view id, as seen by the decorator. */
export function getCurrentVid(): string | undefined {
  return (window as any).__BOOTSTRAP_CFG__?.vid;
}
