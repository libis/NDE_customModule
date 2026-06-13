/**
 * Draws highlight boxes over live DOM nodes, inside the workbench's Shadow DOM
 * (so they pick up the workbench styles). Shared by the Components and Host
 * tabs. While a highlight is active it repositions on scroll/resize so the box
 * tracks the node.
 */
export class HighlightController {
  private boxes: HTMLElement[] = [];
  private nodes: HTMLElement[] = [];
  private label = '';
  private tracking = false;

  private readonly onViewportChange = () => this.reposition();

  constructor(private readonly root: ShadowRoot) {}

  /** Highlight the given nodes with a label. Clears any previous highlight. */
  show(nodes: HTMLElement[], label: string): void {
    this.clear();
    this.nodes = nodes;
    this.label = label;
    if (!nodes.length) return;

    for (let i = 0; i < nodes.length; i++) {
      const box = document.createElement('div');
      box.className = 'wb-highlight-box';
      // Only the first box carries the label, to avoid clutter.
      if (i === 0) {
        box.innerHTML = `<span class="wb-highlight-label"></span>`;
      }
      this.root.appendChild(box);
      this.boxes.push(box);
    }
    this.reposition();
    this.startTracking();
  }

  /** Remove all highlight boxes and stop tracking. */
  clear(): void {
    this.boxes.forEach((b) => b.remove());
    this.boxes = [];
    this.nodes = [];
    this.stopTracking();
  }

  private reposition(): void {
    let drawn = 0;
    for (let i = 0; i < this.nodes.length; i++) {
      const rect = this.nodes[i].getBoundingClientRect();
      const box = this.boxes[i];
      if (!box) continue;
      if (rect.width === 0 && rect.height === 0) {
        box.style.display = 'none';
        continue;
      }
      box.style.display = 'block';
      box.style.top = `${rect.top}px`;
      box.style.left = `${rect.left}px`;
      box.style.width = `${rect.width}px`;
      box.style.height = `${rect.height}px`;
      if (i === 0) {
        const lbl = box.querySelector('.wb-highlight-label');
        if (lbl) {
          lbl.textContent =
            this.nodes.length > 1
              ? `${this.label} (${this.nodes.length})`
              : this.label;
        }
      }
      drawn++;
    }
    if (drawn === 0) this.stopTracking();
  }

  private startTracking(): void {
    if (this.tracking) return;
    this.tracking = true;
    window.addEventListener('scroll', this.onViewportChange, true);
    window.addEventListener('resize', this.onViewportChange);
  }

  private stopTracking(): void {
    if (!this.tracking) return;
    this.tracking = false;
    window.removeEventListener('scroll', this.onViewportChange, true);
    window.removeEventListener('resize', this.onViewportChange);
  }
}
