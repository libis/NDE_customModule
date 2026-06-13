import { NDE_SLOTS } from '../decorators/nde-component.decorator';
import {
  getHostSurface,
  classifyOrigin,
  ElementOrigin,
  DefinedElementInfo,
  SlotQueryInfo,
} from './host-probes';

export interface SlotRow extends SlotQueryInfo {
  /** Base selector with any position suffix stripped, e.g. `nde-header`. */
  base: string;
  /** Whether `base` is one of the known NDE_SLOTS constants. */
  known: boolean;
  /** Whether the host ever got a component back for this slot. */
  filled: boolean;
}

export interface ScannedElement {
  tag: string;
  origin: ElementOrigin;
  count: number;
}

export interface HostSurfaceView {
  slots: SlotRow[];
  /** Known NDE_SLOTS values the host never queried in this session. */
  unqueriedKnownSlots: string[];
  defined: DefinedElementInfo[];
  scanned: ScannedElement[];
}

const POSITION_SUFFIXES = ['-before', '-after', '-top', '-bottom'];

/** Strip a trailing position suffix to get the base slot selector. */
function baseSelector(key: string): string {
  for (const suffix of POSITION_SUFFIXES) {
    if (key.endsWith(suffix)) return key.slice(0, -suffix.length);
  }
  return key;
}

/** Build the full Host tab view model from probes + a live DOM scan. */
export function getHostSurfaceView(): HostSurfaceView {
  const snapshot = getHostSurface();
  const knownSlots = new Set<string>(Object.values(NDE_SLOTS));

  const slots: SlotRow[] = snapshot.slotQueries.map((q) => {
    const base = baseSelector(q.key);
    return { ...q, base, known: knownSlots.has(base), filled: q.hits > 0 };
  });

  const queriedBases = new Set(slots.map((s) => s.base));
  const unqueriedKnownSlots = [...knownSlots]
    .filter((s) => !queriedBases.has(s))
    .sort();

  return {
    slots,
    unqueriedKnownSlots,
    defined: snapshot.defined,
    scanned: scanCustomElements(),
  };
}

/** Live scan of the page for custom elements (hyphenated tags), counted by tag. */
export function scanCustomElements(): ScannedElement[] {
  const counts = new Map<string, number>();
  for (const el of Array.from(document.querySelectorAll('*'))) {
    const tag = el.tagName.toLowerCase();
    if (!tag.includes('-') || tag === 'nde-workbench') continue;
    counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, origin: classifyOrigin(tag), count }))
    .sort(
      (a, b) => originRank(a.origin) - originRank(b.origin) || a.tag.localeCompare(b.tag),
    );
}

function originRank(o: ElementOrigin): number {
  return { custom: 0, nde: 1, primo: 2, other: 3 }[o];
}

/** Find visible live nodes for a tag, for highlighting. */
export function findNodesByTag(tag: string): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(tag)).filter(
    (el) => el.getClientRects().length > 0,
  );
}
