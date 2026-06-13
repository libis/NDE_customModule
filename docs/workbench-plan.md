# NDE Workbench — Implementation Plan

A browser dev-tools–style panel that mounts into the live Primo page when the
custom module is run via the dev proxy. It lets a developer inspect and tune the
NDE customization without hand-editing files or guessing at the host's surface.

## Goals

Give the developer, in one overlay inside the running Primo page:

- **Components** — list the custom components this module registers, highlight
  where each one renders, and show its `@NDEComponent` config (selector,
  position, priority, `viewPattern`) including *why* a component is or isn't
  active in the current view.
- **Host surface** — discover the host slots and web components available to
  hook into, even without host source.
- **Store** — a live, self-documenting browser of the `@libis/primo-shared-state`
  API, generated from the package's own typings, bound to live values.
- **Environments** — view and edit the `nde` node in `package.json`
  (add/delete environment, switch `defaultEnvironment`).

## Architecture & cross-cutting decisions

- **Where it lives**
  - Client UI: `src/app/workbench/`
  - Dev-server pieces (later phases): `nde/workbench/`
  - Generated artifacts (store manifest): `nde/generated/`
- **Style isolation** — the panel is injected into a foreign page (Primo). It is
  built as a **self-contained custom element using Shadow DOM** so Primo's CSS
  can't break it and its CSS can't leak. No second Angular app, no change-
  detection entanglement with the host.
- **Dev-only guarantee** — the workbench is bundled into the same
  `remoteEntry.js` that ships to production, so it must be guarded at runtime.
  It is loaded via a **dynamic `import()`** that only runs when
  `isWorkbenchEnabled()` is true (localhost / `4201`, or an explicit
  `window.__NDE_WORKBENCH__` override). The chunk is therefore never fetched in
  production. A later hardening step can have `postbuild` strip the chunk
  entirely.
- **Mount point** — `bootstrap.ts` (already dynamically imported by `main.ts`)
  calls `mountWorkbench()` behind the guard, after the remote bootstraps.
- **Backend contract (Phases 4–5)** — dev-server endpoints under `/__nde/*`,
  JSON in/out, added via the proxy's middleware hook so they're easy to guard
  and never collide with Primo routes.

## Phases

Ordered so value lands early and the risky source-writing comes last. Each phase
is independently shippable.

### Phase 0 — Workbench shell + guard
- **Goal:** an empty, dev-only floating panel mounted in the live page.
- **Deliverables:** floating toggle button; tabbed panel shell (Components ·
  Host · Store · Environments); `isWorkbenchEnabled()` guard; dynamic-import
  mount from `bootstrap.ts`; confirm no workbench code is loaded in `ng build`.
- **Touchpoints:** `src/app/workbench/`, `bootstrap.ts`.
- **Risk:** very low.

### Phase 1 — Component Inspector (read-only)
- **Goal:** see *your* components and where they land, and why.
- **Deliverables:** list every registration (including attempts that did **not**
  match `viewPattern`, so "why isn't my component showing?" is answerable);
  hover-to-highlight rendered nodes via `reflectComponentType(component).selector`
  → `querySelectorAll`; detail view of the full `NDEComponent` config and the
  current `vid`; handle the `replace` (no wrapper) and 0/N-node cases.
- **Touchpoints:** `nde-component.decorator.ts` (additive: record all attempts).
- **Risk:** very low (pure client read).

### Phase 2 — Host Surface discovery (read-only)
- **Goal:** discover host slots/components to target, even black-box.
- **Deliverables:** patch `customElements.define` (before host boot) to record
  host registrations; wrap `getComponentRef` to log slot queries **including
  misses**; DOM scan + `MutationObserver` grouped by prefix
  (`prm-`/`nde-`/yours); per-component `observedAttributes` + live attrs;
  highlight; diff against the `NDE_SLOTS` constant.
- **Touchpoints:** `bootstrap.ts`, `app.module.ts`.
- **Risk:** low.

### Phase 3 — Store Explorer (read-only)
- **Goal:** live, self-documenting API browser for `@libis/primo-shared-state`.
- **Deliverables:** prebuild step parsing the installed package's `.d.ts` into
  `nde/generated/store-manifest.json` (domain, method, kind, return type,
  JSDoc, writable flag); panel renders grouped by logical field (the
  `select$`/`Signal`/`get` trio) with copy-paste snippets; writable vs
  read-only badges; live values via injected `PrimoStateService`
  (lazy-subscribe on expand); surface `⚠️` version gotchas; mark the opaque
  slices raw-only.
- **Touchpoints:** `nde/prebuild.js`, `nde/workbench/extract-store.mjs`.
- **Risk:** low–medium (parsing only; no writes).

### Phase 4 — Environment management (first writes)
- **Goal:** edit the `nde` node without hand-editing `package.json`.
- **Deliverables:** `/__nde/env` middleware (GET/PUT the `nde` node, validated,
  with backup); UI to add/delete environment and flip `defaultEnvironment`;
  programmatic dev-server restart + tab reload (because `PROXY_TARGET` is
  resolved once in `proxy-url.mjs`).
- **Touchpoints:** `nde/proxy.conf.mjs`, `nde/proxy-url.mjs`, `package.json`.
- **Risk:** medium (writes, but JSON only — validate and back up first).

### Phase 5 — Component config write-back (highest risk, last)
- **Goal:** edit a component's `selector`/`position`/`viewPattern`/`templateUrl`/
  `styleUrl` from the panel.
- **Deliverables:** live DOM/CSS preview for instant feedback; "Commit to source"
  via **ts-morph** (not regex — that is where `nde-cli.js`'s approach corrupts
  files) editing the `@NDEComponent`/`@Component` decorators; HMR rebuild.
- **Touchpoints:** `nde/workbench/edit-component.mjs`, `/__nde/component`.
- **Risk:** high.

### Phase 6 — Optional polish
Dispatch playground (fire writable store helpers, dev-guarded); host `@Output`
event observation; diff host surface against a bundled Ex Libris reference;
persist panel layout/active tab.

## Sequencing

- **Critical path:** Phase 0 → 1 (most value, least risk, proves the approach).
- **Parallelizable:** Phases 2 and 3 are independent and both read-only.
- **Gated:** Phases 4 and 5 introduce writes; don't start until 0–3 are solid.
