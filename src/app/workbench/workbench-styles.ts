/**
 * Styles for the workbench, scoped inside the element's Shadow DOM. Because the
 * panel is injected into the live Primo page, Shadow DOM is what keeps Primo's
 * CSS from breaking the panel and the panel's CSS from leaking into Primo.
 */
export const WORKBENCH_STYLES = /* css */ `
  :host {
    --wb-bg: #1e1e24;
    --wb-bg-elev: #2a2a32;
    --wb-border: #3a3a44;
    --wb-text: #e4e4ea;
    --wb-text-dim: #9a9aa6;
    --wb-accent: #4aa3ff;
    --wb-accent-soft: rgba(74, 163, 255, 0.15);
    --wb-ok: #4cc38a;
    --wb-warn: #e2b340;
    --wb-danger: #e35d6a;
    --wb-radius: 8px;
    --wb-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --wb-mono: "SF Mono", "Roboto Mono", Menlo, Consolas, monospace;

    all: initial;
    font-family: var(--wb-font);
    color: var(--wb-text);
    line-height: 1.4;
  }

  * { box-sizing: border-box; }

  /* Floating toggle button */
  .wb-fab {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 2147483000;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 1px solid var(--wb-border);
    background: var(--wb-bg);
    color: var(--wb-accent);
    font-size: 18px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.12s ease, background 0.12s ease;
  }
  .wb-fab:hover { transform: scale(1.08); background: var(--wb-bg-elev); }

  /* Docked panel */
  .wb-panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 2147483001;
    width: 420px;
    max-width: 100vw;
    background: var(--wb-bg);
    border-left: 1px solid var(--wb-border);
    box-shadow: -8px 0 32px rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;
    transform: translateX(100%);
    transition: transform 0.18s ease;
  }
  .wb-panel.open { transform: translateX(0); }

  /* Header */
  .wb-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-bottom: 1px solid var(--wb-border);
    background: var(--wb-bg-elev);
  }
  .wb-title { font-size: 13px; font-weight: 700; letter-spacing: 0.02em; }
  .wb-title .wb-dot { color: var(--wb-accent); }
  .wb-spacer { flex: 1; }
  .wb-vid {
    font-family: var(--wb-mono);
    font-size: 10px;
    color: var(--wb-text-dim);
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .wb-close {
    border: none;
    background: transparent;
    color: var(--wb-text-dim);
    font-size: 18px;
    cursor: pointer;
    line-height: 1;
    padding: 2px 6px;
  }
  .wb-close:hover { color: var(--wb-text); }

  /* Tab bar */
  .wb-tabs {
    display: flex;
    border-bottom: 1px solid var(--wb-border);
    background: var(--wb-bg-elev);
  }
  .wb-tab {
    flex: 1;
    padding: 8px 6px;
    border: none;
    background: transparent;
    color: var(--wb-text-dim);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    border-bottom: 2px solid transparent;
  }
  .wb-tab:hover { color: var(--wb-text); }
  .wb-tab.active { color: var(--wb-accent); border-bottom-color: var(--wb-accent); }
  .wb-tab .wb-count {
    display: inline-block;
    margin-left: 4px;
    padding: 0 5px;
    border-radius: 8px;
    background: var(--wb-border);
    color: var(--wb-text);
    font-size: 10px;
  }

  /* Content */
  .wb-content {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
  }
  .wb-placeholder {
    color: var(--wb-text-dim);
    font-size: 12px;
    text-align: center;
    padding: 40px 16px;
  }

  /* Component list (Phase 1) */
  .wb-list { display: flex; flex-direction: column; gap: 6px; }
  .wb-card {
    border: 1px solid var(--wb-border);
    border-radius: var(--wb-radius);
    background: var(--wb-bg-elev);
    overflow: hidden;
  }
  .wb-card.inactive { opacity: 0.6; }
  .wb-card-head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    cursor: pointer;
  }
  .wb-card-head:hover { background: var(--wb-accent-soft); }
  .wb-card-name { font-size: 12px; font-weight: 600; flex: 1; }
  .wb-badge {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 1px 6px;
    border-radius: 4px;
    letter-spacing: 0.03em;
  }
  .wb-badge.ok { background: rgba(76, 195, 138, 0.18); color: var(--wb-ok); }
  .wb-badge.warn { background: rgba(226, 179, 64, 0.18); color: var(--wb-warn); }
  .wb-badge.count {
    background: var(--wb-border);
    color: var(--wb-text-dim);
    font-family: var(--wb-mono);
  }
  .wb-card-body {
    padding: 8px 10px;
    border-top: 1px solid var(--wb-border);
    display: none;
    font-size: 11px;
  }
  .wb-card.expanded .wb-card-body { display: block; }
  .wb-row { display: flex; gap: 8px; padding: 2px 0; }
  .wb-row .k { color: var(--wb-text-dim); min-width: 92px; }
  .wb-row .v { font-family: var(--wb-mono); color: var(--wb-text); word-break: break-all; }
  .wb-actions { margin-top: 8px; display: flex; gap: 6px; flex-wrap: wrap; }
  .wb-btn {
    border: 1px solid var(--wb-border);
    background: var(--wb-bg);
    color: var(--wb-text);
    font-size: 10px;
    padding: 4px 8px;
    border-radius: 5px;
    cursor: pointer;
  }
  .wb-btn:hover { border-color: var(--wb-accent); color: var(--wb-accent); }
  .wb-note {
    margin-top: 6px;
    padding: 6px 8px;
    border-radius: 5px;
    background: rgba(226, 179, 64, 0.1);
    color: var(--wb-warn);
    font-size: 10px;
  }

  /* Host tab */
  .wb-toolbar { display: flex; justify-content: flex-end; margin-bottom: 8px; }
  .wb-section { margin-bottom: 14px; }
  .wb-section-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--wb-text-dim);
    margin: 0 0 6px 2px;
  }
  .wb-section-sub {
    font-family: var(--wb-mono);
    font-weight: 400;
    color: var(--wb-text-dim);
    margin-left: 4px;
  }
  .wb-empty {
    font-size: 11px;
    color: var(--wb-text-dim);
    padding: 6px 8px;
    border: 1px dashed var(--wb-border);
    border-radius: 5px;
  }
  .wb-mono { font-family: var(--wb-mono); font-size: 11px; color: var(--wb-text); }
  .wb-dim { color: var(--wb-text-dim); }

  .wb-srow {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 8px;
    border: 1px solid var(--wb-border);
    border-radius: 5px;
    background: var(--wb-bg-elev);
    margin-bottom: 4px;
  }
  .wb-clickable { cursor: pointer; }
  .wb-clickable:hover { border-color: var(--wb-accent); }

  .wb-drow {
    border: 1px solid var(--wb-border);
    border-radius: 5px;
    background: var(--wb-bg-elev);
    padding: 6px 8px;
    margin-bottom: 4px;
    cursor: pointer;
  }
  .wb-drow:hover { border-color: var(--wb-accent); }
  .wb-drow-head { display: flex; align-items: center; gap: 6px; }
  .wb-attrs { margin-top: 5px; display: flex; flex-wrap: wrap; gap: 4px; font-size: 10px; }
  .wb-chip {
    font-family: var(--wb-mono);
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 4px;
    background: var(--wb-border);
    color: var(--wb-text);
  }

  .wb-origin {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 1px 5px;
    border-radius: 4px;
    letter-spacing: 0.03em;
    flex: 0 0 auto;
  }
  .wb-origin-custom { background: rgba(74, 163, 255, 0.18); color: var(--wb-accent); }
  .wb-origin-nde { background: rgba(76, 195, 138, 0.18); color: var(--wb-ok); }
  .wb-origin-primo { background: rgba(226, 179, 64, 0.18); color: var(--wb-warn); }
  .wb-origin-other { background: var(--wb-border); color: var(--wb-text-dim); }

  /* Store tab */
  .wb-store-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }
  .wb-domain {
    border: 1px solid var(--wb-border);
    border-radius: var(--wb-radius);
    background: var(--wb-bg-elev);
    margin-bottom: 6px;
    overflow: hidden;
  }
  .wb-domain-head {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    cursor: pointer;
  }
  .wb-domain-head:hover { background: var(--wb-accent-soft); }
  .wb-domain-name { font-size: 12px; font-weight: 700; font-family: var(--wb-mono); }
  .wb-domain-body { display: none; padding: 6px 10px 10px; border-top: 1px solid var(--wb-border); }
  .wb-domain.expanded .wb-domain-body { display: block; }
  .wb-domain-desc { font-size: 11px; color: var(--wb-text-dim); margin: 4px 0 8px; }

  .wb-field {
    border: 1px solid var(--wb-border);
    border-radius: 6px;
    background: var(--wb-bg);
    margin-bottom: 4px;
    overflow: hidden;
  }
  .wb-field-head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    cursor: pointer;
  }
  .wb-field-head:hover { background: var(--wb-accent-soft); }
  .wb-field-name { font-size: 11px; font-weight: 600; }
  .wb-field-type { font-size: 10px; color: var(--wb-text-dim); }
  .wb-field-body { display: none; padding: 6px 8px 8px; border-top: 1px solid var(--wb-border); }
  .wb-field.expanded .wb-field-body { display: block; }
  .wb-field-doc { font-size: 10px; color: var(--wb-text-dim); margin-bottom: 6px; }

  .wb-vchip {
    font-family: var(--wb-mono);
    font-size: 9px;
    font-weight: 700;
    width: 14px;
    height: 14px;
    line-height: 14px;
    text-align: center;
    border-radius: 3px;
    background: var(--wb-border);
    color: var(--wb-text-dim);
  }

  .wb-live {
    display: flex;
    align-items: baseline;
    gap: 6px;
    padding: 5px 7px;
    border-radius: 5px;
    background: rgba(76, 195, 138, 0.08);
    margin-bottom: 6px;
  }
  .wb-live-label {
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--wb-ok);
    flex: 0 0 auto;
  }
  .wb-live-val {
    font-family: var(--wb-mono);
    font-size: 10px;
    color: var(--wb-text);
    word-break: break-all;
  }

  .wb-snippet {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 0;
  }
  .wb-snippet-kind {
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--wb-accent);
    flex: 0 0 58px;
  }
  .wb-snippet code,
  .wb-write code {
    font-family: var(--wb-mono);
    font-size: 10px;
    color: var(--wb-text);
    flex: 1;
    word-break: break-all;
  }
  .wb-copy {
    border: 1px solid var(--wb-border);
    background: var(--wb-bg-elev);
    color: var(--wb-text-dim);
    font-size: 11px;
    border-radius: 4px;
    cursor: pointer;
    padding: 1px 5px;
    flex: 0 0 auto;
  }
  .wb-copy:hover { color: var(--wb-accent); border-color: var(--wb-accent); }

  .wb-writes-title {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--wb-text-dim);
    margin: 8px 0 4px;
  }
  .wb-write {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 0;
  }
  .wb-write-doc { font-size: 10px; color: var(--wb-text-dim); flex: 1; }

  /* On-page highlight overlay */
  .wb-highlight-box {
    position: fixed;
    z-index: 2147482999;
    pointer-events: none;
    border: 2px solid var(--wb-accent);
    background: var(--wb-accent-soft);
    border-radius: 3px;
    transition: all 0.08s ease;
  }
  .wb-highlight-label {
    position: absolute;
    top: -18px;
    left: -2px;
    background: var(--wb-accent);
    color: #0b1a2b;
    font-family: var(--wb-mono);
    font-size: 10px;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 3px;
    white-space: nowrap;
  }
`;
