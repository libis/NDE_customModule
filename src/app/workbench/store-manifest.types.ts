/**
 * Shape of the store manifest generated from the installed
 * `@libis/primo-shared-state` `.d.ts` files by `nde/extract-store-manifest.js`.
 * Hand-written types; the generated file imports this and must stay in sync.
 */

export interface StoreManifest {
  /** Installed package version, e.g. `2026.6.1`. */
  version: string;
  generatedAt: string;
  domains: StoreDomain[];
}

export interface StoreDomain {
  /** Facade property name, e.g. `search`, `filters`, `config`. */
  name: string;
  /** Underlying service class, e.g. `SearchStateService`. */
  service: string;
  /** One-line description from the facade property JSDoc. */
  description: string;
  /** Whether the domain exposes write helpers (setters / dispatch). */
  writable: boolean;
  /** Whether the service exposes the low-level `dispatch()` escape hatch. */
  hasDispatch: boolean;
  /** ⚠️ paragraphs pulled from the service's class JSDoc. */
  warnings: string[];
  /** Read selectors, grouped into the select$/Signal/get trio per field. */
  fields: StoreField[];
  /** Write helpers (void-returning setters / action dispatchers). */
  writes: StoreWrite[];
}

export interface StoreField {
  /** Canonical grouping key (lowercased, punctuation-stripped). */
  key: string;
  /** Human label, e.g. `allDocs`. */
  label: string;
  /** Inner type with the Observable/Signal/Promise wrapper removed. */
  type: string;
  /** Best available JSDoc for the field. */
  jsdoc: string;
  /** True if the selector takes an argument (e.g. `selectDocById$(id)`) and so
   *  can't be bound to a single live value without input. */
  hasArgs: boolean;
  variants: StoreFieldVariants;
}

export interface StoreFieldVariants {
  /** Observable selector method name, e.g. `selectAllDocs$`. */
  observable?: string;
  /** Signal selector method name, e.g. `allDocsSignal`. */
  signal?: string;
  /** Promise snapshot method name, e.g. `getAllDocs`. */
  promise?: string;
}

export interface StoreWrite {
  name: string;
  params: StoreParam[];
  jsdoc: string;
}

export interface StoreParam {
  name: string;
  type: string;
}
