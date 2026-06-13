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

    switch (this.activeTab) {
      case 'components':
        this.renderComponents(content);
        break;
      case 'host':
        this.renderHost(content);
        break;
      case 'store':
        content.innerHTML = `<div class="wb-placeholder">Store explorer — coming in Phase 3.</div>`;
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
