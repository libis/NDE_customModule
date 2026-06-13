import { WORKBENCH_STYLES } from './workbench-styles';
import {
  getInspectorItems,
  findRenderedNodes,
  getCurrentVid,
  InspectorItem,
} from './inspector';
import { HighlightController } from './highlight';
import {
  getHostSurfaceView,
  findNodesByTag,
  HostSurfaceView,
  SlotRow,
  ScannedElement,
} from './host-surface-view';
import { DefinedElementInfo, ElementOrigin } from './host-probes';
import {
  getStoreManifest,
  isInjectorAvailable,
  bindField,
  fieldSnippets,
  writeSignature,
  writeSnippet,
  LiveHandle,
  StoreDomain,
  StoreField,
} from './store-view';

type TabId = 'components' | 'host' | 'store' | 'environments';

const TABS: { id: TabId; label: string }[] = [
  { id: 'components', label: 'Components' },
  { id: 'host', label: 'Host' },
  { id: 'store', label: 'Store' },
  { id: 'environments', label: 'Env' },
];

/**
 * `<nde-workbench>` — a self-contained, Shadow-DOM dev panel injected into the
 * live Primo page. Phase 0 shell + Phase 1 Components inspector + Phase 2 Host
 * surface discovery.
 */
export class NdeWorkbenchElement extends HTMLElement {
  private root: ShadowRoot;
  private highlighter: HighlightController;
  private activeTab: TabId = 'components';
  private open = false;
  /** Live store subscriptions, keyed by the field element they feed. */
  private storeHandles = new Map<HTMLElement, LiveHandle>();

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
    this.highlighter = new HighlightController(this.root);
  }

  connectedCallback(): void {
    this.render();
  }

  // ── Shell ────────────────────────────────────────────────────────────────

  private render(): void {
    const vid = getCurrentVid() ?? 'unknown';
    this.root.innerHTML = `
      <style>${WORKBENCH_STYLES}</style>
      <button class="wb-fab" title="NDE Workbench">⚙</button>
      <section class="wb-panel" role="dialog" aria-label="NDE Workbench">
        <header class="wb-header">
          <span class="wb-title"><span class="wb-dot">●</span> NDE Workbench</span>
          <span class="wb-spacer"></span>
          <span class="wb-vid" title="${vid}">${vid}</span>
          <button class="wb-close" title="Close">×</button>
        </header>
        <nav class="wb-tabs">
          ${TABS.map(
            (t) =>
              `<button class="wb-tab" data-tab="${t.id}">${t.label}<span class="wb-count" data-count="${t.id}"></span></button>`,
          ).join('')}
        </nav>
        <div class="wb-content"></div>
      </section>
    `;

    this.root.querySelector('.wb-fab')!.addEventListener('click', () =>
      this.toggle(),
    );
    this.root.querySelector('.wb-close')!.addEventListener('click', () =>
      this.toggle(false),
    );
    this.root.querySelectorAll<HTMLButtonElement>('.wb-tab').forEach((btn) =>
      btn.addEventListener('click', () =>
        this.setTab(btn.dataset['tab'] as TabId),
      ),
    );

    this.refreshTabBar();
    this.renderActiveTab();
  }

  private toggle(force?: boolean): void {
    this.open = force ?? !this.open;
    const panel = this.root.querySelector('.wb-panel')!;
    panel.classList.toggle('open', this.open);
    if (this.open) {
      this.refreshTabBar();
      this.renderActiveTab();
    } else {
      this.highlighter.clear();
      this.stopAllStoreHandles();
    }
  }

  private setTab(tab: TabId): void {
    this.activeTab = tab;
    this.refreshTabBar();
    this.renderActiveTab();
  }

  private refreshTabBar(): void {
    this.root.querySelectorAll<HTMLButtonElement>('.wb-tab').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset['tab'] === this.activeTab);
    });
    this.setBadge('components', getInspectorItems().filter((i) => i.registered).length);
    this.setBadge('host', getHostSurfaceView().slots.length);
    this.setBadge('store', getStoreManifest().domains.length);
  }

  private setBadge(tab: TabId, n: number): void {
    const badge = this.root.querySelector<HTMLElement>(
      `.wb-count[data-count="${tab}"]`,
    );
    if (badge) badge.textContent = n ? String(n) : '';
  }

  private renderActiveTab(): void {
    const content = this.root.querySelector<HTMLElement>('.wb-content');
    if (!content) return;
    this.highlighter.clear();
    this.stopAllStoreHandles();

    switch (this.activeTab) {
      case 'components':
        this.renderComponents(content);
        break;
      case 'host':
        this.renderHost(content);
        break;
      case 'store':
        this.renderStore(content);
        break;
      case 'environments':
        content.innerHTML = `<div class="wb-placeholder">Environment editor — coming in Phase 4.</div>`;
        break;
    }
  }

  // ── Components tab (Phase 1) ───────────────────────────────────────────────

  private renderComponents(content: HTMLElement): void {
    const items = getInspectorItems();
    if (!items.length) {
      content.innerHTML = `<div class="wb-placeholder">No @NDEComponent registrations found.</div>`;
      return;
    }

    content.innerHTML = `<div class="wb-list">${items
      .map((it, i) => this.componentCardHtml(it, i))
      .join('')}</div>`;

    content.querySelectorAll<HTMLElement>('.wb-card').forEach((card) => {
      const idx = Number(card.dataset['idx']);
      const item = items[idx];

      card.querySelector('.wb-card-head')!.addEventListener('click', () => {
        card.classList.toggle('expanded');
      });
      card.addEventListener('mouseenter', () =>
        this.highlighter.show(
          findRenderedNodes(item.domSelector),
          item.domSelector ?? '',
        ),
      );
      card.addEventListener('mouseleave', () => this.highlighter.clear());

      card
        .querySelector<HTMLButtonElement>('[data-act="scroll"]')
        ?.addEventListener('click', (e) => {
          e.stopPropagation();
          const nodes = findRenderedNodes(item.domSelector);
          nodes[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          this.highlighter.show(nodes, item.domSelector ?? '');
        });
    });
  }

  private componentCardHtml(it: InspectorItem, idx: number): string {
    const count = findRenderedNodes(it.domSelector).length;
    const statusBadge = it.registered
      ? `<span class="wb-badge ok">active</span>`
      : `<span class="wb-badge warn">inactive</span>`;
    const countBadge =
      it.domSelector && it.registered
        ? `<span class="wb-badge count" title="rendered DOM nodes">${count}×</span>`
        : '';

    const reasonNote =
      it.reason === 'unmatched'
        ? `<div class="wb-note">Not rendering: <code>viewPattern</code> ${escapeHtml(
            it.viewPattern ?? '',
          )} did not match current vid <code>${escapeHtml(
            it.vid ?? 'unknown',
          )}</code>.</div>`
        : '';
    const zeroNote =
      it.registered && it.domSelector && count === 0
        ? `<div class="wb-note">Active but 0 nodes on this view — the host slot <code>${escapeHtml(
            it.fullSelector,
          )}</code> may not be present here.</div>`
        : '';

    return `
      <div class="wb-card ${it.registered ? '' : 'inactive'}" data-idx="${idx}">
        <div class="wb-card-head">
          <span class="wb-card-name">${escapeHtml(it.name)}</span>
          ${countBadge}
          ${statusBadge}
        </div>
        <div class="wb-card-body">
          ${row('Slot', it.fullSelector)}
          ${row('Selector', it.selector)}
          ${row('Position', it.position)}
          ${row('Priority', String(it.priority))}
          ${row('DOM tag', it.domSelector ?? '—')}
          ${it.viewPattern ? row('viewPattern', it.viewPattern) : ''}
          ${it.description ? row('Description', it.description) : ''}
          ${reasonNote}
          ${zeroNote}
          <div class="wb-actions">
            ${
              it.domSelector
                ? `<button class="wb-btn" data-act="scroll">Scroll to &amp; flash</button>`
                : ''
            }
          </div>
        </div>
      </div>
    `;
  }

  // ── Host tab (Phase 2) ─────────────────────────────────────────────────────

  private renderHost(content: HTMLElement): void {
    const view = getHostSurfaceView();
    content.innerHTML = `
      <div class="wb-toolbar">
        <button class="wb-btn" data-act="refresh">↻ Rescan page</button>
      </div>
      ${this.slotsSectionHtml(view)}
      ${this.definedSectionHtml(view)}
      ${this.scannedSectionHtml(view)}
    `;

    content
      .querySelector<HTMLButtonElement>('[data-act="refresh"]')
      ?.addEventListener('click', () => this.renderHost(content));

    // Hover-highlight any element that carries data-tag.
    content.querySelectorAll<HTMLElement>('[data-tag]').forEach((el) => {
      const tag = el.dataset['tag']!;
      el.addEventListener('mouseenter', () =>
        this.highlighter.show(findNodesByTag(tag), tag),
      );
      el.addEventListener('mouseleave', () => this.highlighter.clear());
      el.addEventListener('click', () => {
        const nodes = findNodesByTag(tag);
        nodes[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this.highlighter.show(nodes, tag);
      });
    });
  }

  private slotsSectionHtml(view: HostSurfaceView): string {
    const rows = view.slots.length
      ? view.slots.map((s) => this.slotRowHtml(s)).join('')
      : `<div class="wb-empty">No slot queries recorded yet — navigate the page (search, full display, account) to populate.</div>`;

    const unqueried = view.unqueriedKnownSlots.length
      ? `<div class="wb-note">Known slots not yet queried here: ${view.unqueriedKnownSlots
          .map((s) => `<code>${escapeHtml(s)}</code>`)
          .join(' ')}</div>`
      : '';

    return `
      <div class="wb-section">
        <div class="wb-section-title">Slots queried by host <span class="wb-section-sub">${view.slots.length}</span></div>
        ${rows}
        ${unqueried}
      </div>
    `;
  }

  private slotRowHtml(s: SlotRow): string {
    const fill = s.filled
      ? `<span class="wb-badge ok" title="host received a component">filled</span>`
      : `<span class="wb-badge warn" title="host asked, nothing returned">unfilled</span>`;
    const known = s.known
      ? ''
      : `<span class="wb-badge warn" title="not in NDE_SLOTS constant">unlisted</span>`;
    const counts = `<span class="wb-badge count" title="hits / misses">${s.hits}✓ ${s.misses}✗</span>`;
    return `
      <div class="wb-srow">
        <span class="wb-mono">${escapeHtml(s.key)}</span>
        <span class="wb-spacer"></span>
        ${known} ${counts} ${fill}
      </div>
    `;
  }

  private definedSectionHtml(view: HostSurfaceView): string {
    if (!view.defined.length) {
      return `
        <div class="wb-section">
          <div class="wb-section-title">Defined web components <span class="wb-section-sub">0</span></div>
          <div class="wb-empty">No <code>customElements.define</code> calls captured. This module loads <em>into</em> an already-running host, so only components the host defines <em>after</em> we load (e.g. lazily on navigation) are caught — see “On this page” below for what's actually rendered.</div>
        </div>`;
    }
    return `
      <div class="wb-section">
        <div class="wb-section-title">Defined web components <span class="wb-section-sub">${view.defined.length}</span></div>
        ${view.defined.map((d) => this.definedRowHtml(d)).join('')}
      </div>
    `;
  }

  private definedRowHtml(d: DefinedElementInfo): string {
    const attrs = d.observedAttributes.length
      ? `<div class="wb-attrs">${d.observedAttributes
          .map((a) => `<span class="wb-chip">${escapeHtml(a)}</span>`)
          .join('')}</div>`
      : `<div class="wb-attrs wb-dim">no observed attributes</div>`;
    return `
      <div class="wb-drow" data-tag="${escapeHtml(d.tag)}">
        <div class="wb-drow-head">
          ${originBadge(d.origin)}
          <span class="wb-mono">${escapeHtml(d.tag)}</span>
        </div>
        ${attrs}
      </div>
    `;
  }

  private scannedSectionHtml(view: HostSurfaceView): string {
    if (!view.scanned.length) {
      return '';
    }
    return `
      <div class="wb-section">
        <div class="wb-section-title">On this page <span class="wb-section-sub">${view.scanned.length} tags</span></div>
        ${view.scanned.map((s) => this.scannedRowHtml(s)).join('')}
      </div>
    `;
  }

  private scannedRowHtml(s: ScannedElement): string {
    return `
      <div class="wb-srow wb-clickable" data-tag="${escapeHtml(s.tag)}" title="hover to highlight, click to scroll">
        ${originBadge(s.origin)}
        <span class="wb-mono">${escapeHtml(s.tag)}</span>
        <span class="wb-spacer"></span>
        <span class="wb-badge count">${s.count}×</span>
      </div>
    `;
  }

  // ── Store tab (Phase 3) ────────────────────────────────────────────────────

  private renderStore(content: HTMLElement): void {
    const manifest = getStoreManifest();
    const injectorWarn = isInjectorAvailable()
      ? ''
      : `<div class="wb-note">Live values unavailable — the host app injector isn't exposed yet. Open this tab after the page finishes loading.</div>`;

    content.innerHTML = `
      <div class="wb-store-head">
        <span class="wb-mono">@libis/primo-shared-state</span>
        <span class="wb-badge count">v${escapeHtml(manifest.version)}</span>
      </div>
      ${injectorWarn}
      ${manifest.domains.map((d) => this.domainHtml(d)).join('')}
    `;

    content.querySelectorAll<HTMLElement>('.wb-domain').forEach((dEl) => {
      dEl
        .querySelector('.wb-domain-head')!
        .addEventListener('click', () => this.toggleDomain(dEl));
    });

    content.querySelectorAll<HTMLElement>('.wb-field').forEach((fEl) => {
      fEl
        .querySelector('.wb-field-head')!
        .addEventListener('click', () => this.toggleField(fEl));
    });

    this.wireCopyButtons(content);
  }

  private domainHtml(d: StoreDomain): string {
    const access = d.writable
      ? `<span class="wb-badge ok" title="exposes write helpers">writable</span>`
      : `<span class="wb-badge count" title="host owns writes">read-only</span>`;
    const dispatch = d.hasDispatch
      ? `<span class="wb-badge count" title="low-level dispatch() available">dispatch</span>`
      : '';
    const warnings = d.warnings
      .map((w) => `<div class="wb-note">${escapeHtml(w)}</div>`)
      .join('');
    const writes = d.writes.length
      ? `<div class="wb-writes-title">Writes</div>${d.writes
          .map((w) => this.writeHtml(d.name, w))
          .join('')}`
      : '';

    return `
      <div class="wb-domain" data-domain="${escapeHtml(d.name)}">
        <div class="wb-domain-head">
          <span class="wb-domain-name">primo.${escapeHtml(d.name)}</span>
          <span class="wb-spacer"></span>
          ${dispatch} ${access}
          <span class="wb-badge count">${d.fields.length}</span>
        </div>
        <div class="wb-domain-body">
          <div class="wb-domain-desc">${escapeHtml(d.description)}</div>
          ${warnings}
          ${d.fields.map((f) => this.fieldHtml(d.name, f)).join('')}
          ${writes}
        </div>
      </div>
    `;
  }

  private fieldHtml(domain: string, f: StoreField): string {
    const v = f.variants;
    const chips = [
      v.observable ? 'O' : '',
      v.signal ? 'S' : '',
      v.promise ? 'P' : '',
    ]
      .filter(Boolean)
      .map((c) => `<span class="wb-vchip" title="Observable/Signal/Promise">${c}</span>`)
      .join('');
    const snippets = fieldSnippets(domain, f)
      .map(
        (s) => `
          <div class="wb-snippet">
            <span class="wb-snippet-kind">${s.kind}</span>
            <code>${escapeHtml(s.code)}</code>
            <button class="wb-copy" data-copy="${encodeURIComponent(s.code)}" title="Copy">⧉</button>
          </div>`,
      )
      .join('');

    return `
      <div class="wb-field" data-domain="${escapeHtml(domain)}" data-key="${escapeHtml(f.key)}">
        <div class="wb-field-head">
          <span class="wb-field-name">${escapeHtml(f.label)}</span>
          <span class="wb-field-type wb-mono">${escapeHtml(f.type)}</span>
          <span class="wb-spacer"></span>
          ${chips}
        </div>
        <div class="wb-field-body">
          ${f.jsdoc ? `<div class="wb-field-doc">${escapeHtml(f.jsdoc)}</div>` : ''}
          <div class="wb-live"><span class="wb-live-label">live</span> <span class="wb-live-val">…</span></div>
          ${snippets}
        </div>
      </div>
    `;
  }

  private writeHtml(domain: string, w: { name: string; params: any[]; jsdoc: string }): string {
    const sig = writeSignature(w as any);
    const code = writeSnippet(domain, w as any);
    return `
      <div class="wb-write">
        <code class="wb-mono">${escapeHtml(sig)}</code>
        ${w.jsdoc ? `<span class="wb-write-doc">${escapeHtml(w.jsdoc)}</span>` : ''}
        <button class="wb-copy" data-copy="${encodeURIComponent(code)}" title="Copy">⧉</button>
      </div>
    `;
  }

  private toggleDomain(dEl: HTMLElement): void {
    const willOpen = !dEl.classList.contains('expanded');
    dEl.classList.toggle('expanded', willOpen);
    if (!willOpen) {
      // Collapsing — stop any live subscriptions inside it.
      dEl.querySelectorAll<HTMLElement>('.wb-field.expanded').forEach((fEl) => {
        fEl.classList.remove('expanded');
        this.unbindFieldEl(fEl);
      });
    }
  }

  private toggleField(fEl: HTMLElement): void {
    const willOpen = !fEl.classList.contains('expanded');
    fEl.classList.toggle('expanded', willOpen);
    if (willOpen) this.bindFieldEl(fEl);
    else this.unbindFieldEl(fEl);
  }

  private bindFieldEl(fEl: HTMLElement): void {
    if (this.storeHandles.has(fEl)) return;
    const domain = fEl.dataset['domain']!;
    const key = fEl.dataset['key']!;
    const field = getStoreManifest()
      .domains.find((d) => d.name === domain)
      ?.fields.find((f) => f.key === key);
    const valEl = fEl.querySelector<HTMLElement>('.wb-live-val');
    if (!field || !valEl) return;
    const handle = bindField(domain, field, (text) => {
      valEl.textContent = text;
    });
    this.storeHandles.set(fEl, handle);
  }

  private unbindFieldEl(fEl: HTMLElement): void {
    this.storeHandles.get(fEl)?.stop();
    this.storeHandles.delete(fEl);
  }

  private stopAllStoreHandles(): void {
    this.storeHandles.forEach((h) => h.stop());
    this.storeHandles.clear();
  }

  private wireCopyButtons(content: HTMLElement): void {
    content.querySelectorAll<HTMLButtonElement>('.wb-copy').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const text = decodeURIComponent(btn.dataset['copy'] ?? '');
        navigator.clipboard?.writeText(text).then(
          () => {
            const prev = btn.textContent;
            btn.textContent = '✓';
            setTimeout(() => (btn.textContent = prev), 900);
          },
          () => {},
        );
      });
    });
  }
}

// ── small html helpers ───────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function row(k: string, v: string): string {
  return `<div class="wb-row"><span class="k">${escapeHtml(
    k,
  )}</span><span class="v">${escapeHtml(v)}</span></div>`;
}

function originBadge(origin: ElementOrigin): string {
  const labels: Record<ElementOrigin, string> = {
    primo: 'primo',
    nde: 'nde',
    custom: 'yours',
    other: 'other',
  };
  return `<span class="wb-origin wb-origin-${origin}">${labels[origin]}</span>`;
}
