import {
  ApplicationRef,
  ComponentRef,
  EnvironmentInjector,
  Injectable,
  NgZone,
  createComponent,
  inject,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { filter, take } from 'rxjs';
import { LIBISProgressSpinnerComponent } from 'src/app/shared/components/libis-progress-spinner/libis-progress-spinner.component';

/** The page counts as "ready" when no new content has appeared for this long. */
const QUIET_MS = 600;
/** Failsafe: always show the page after this, whatever happens. */
const MAX_WAIT_MS = 10000;
/** A label that exists on every view; we wait for it, but at most TRANSLATION_WAIT_MS. */
const PROBE_TRANSLATION_KEY = 'nde.custom.footer.copyright';
const TRANSLATION_WAIT_MS = 3000;
/** Set to false once everything works: logs why the spinner is still showing. */
const DEBUG = true;

const OVERLAY_ID = 'libis-loading-overlay';

const OVERLAY_CSS = `
#${OVERLAY_ID} {
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  transition: opacity 300ms ease;
}
#${OVERLAY_ID}.is-hiding { opacity: 0; pointer-events: none; }
#${OVERLAY_ID} libis-progress-spinner { display: block; width: 930px; height: 280px; max-width: 100vw; transform: scale(2); }
#${OVERLAY_ID} .mat-dialog-container {
  background: transparent; box-shadow: none; padding: 0;
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
}
`;

@Injectable({ providedIn: 'root' })
export class LibisLoadingOverlayService {
  private readonly appRef = inject(ApplicationRef);
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly zone = inject(NgZone);
  private readonly translate = inject(TranslateService);

  private overlay?: HTMLElement;
  private spinner?: ComponentRef<LIBISProgressSpinnerComponent>;
  private observer?: MutationObserver;
  private quietTimer?: number;
  private hidden = false;
  private readonly startedAt = performance.now();
  private lastChange: Node | null = null;
  /** Things that must finish before we hide, e.g. 'landing-background'. */
  private readonly holds = new Set<string>();

  show(): void {
    if (this.overlay) return;

    const style = document.createElement('style');
    style.textContent = OVERLAY_CSS;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.setAttribute('role', 'progressbar');
    overlay.setAttribute('aria-label', 'Loading');
    document.body.appendChild(overlay);
    this.overlay = overlay;

    // Failsafe FIRST: plain browser timer, so the page is always shown.
    window.setTimeout(() => {
      if (!this.hidden) {
        this.log(
          'FAILSAFE reached. Still on hold:',
          [...this.holds],
          'last DOM change in:',
          this.lastChange,
        );
      }
      this.hide();
    }, MAX_WAIT_MS);

    try {
      this.spinner = createComponent(LIBISProgressSpinnerComponent, {
        environmentInjector: this.envInjector,
      });
      overlay.appendChild(this.spinner.location.nativeElement);
      this.appRef.attachView(this.spinner.hostView);
      this.spinner.changeDetectorRef.detectChanges();
    } catch (error) {
      console.warn('[LibisLoadingOverlay] spinner failed, showing page', error);
      this.hide();
      return;
    }

    // Translations are just another hold, released when they arrive
    // or after TRANSLATION_WAIT_MS, so a missing label can never block us.
    this.hold('translations');
    const translationTimer = window.setTimeout(
      () => this.release('translations'),
      TRANSLATION_WAIT_MS,
    );
    this.translate
      .stream(PROBE_TRANSLATION_KEY)
      .pipe(
        filter((v) => !!v && v !== PROBE_TRANSLATION_KEY),
        take(1),
      )
      .subscribe(() => {
        window.clearTimeout(translationTimer);
        this.release('translations');
      });

    this.watchDom();
  }

  /** A component says: "don't hide yet, I'm still busy with <key>". */
  hold(key: string): void {
    if (this.hidden) return;
    this.holds.add(key);
    this.log('hold', key);
  }

  /** A component says: "<key> is done". */
  release(key: string): void {
    if (!this.holds.delete(key)) return;
    this.log('release', key, '- remaining:', [...this.holds]);
    this.restartQuietTimer(); // one more quiet period so the result is painted
  }

  private restartQuietTimer(): void {
    if (this.hidden) return;
    window.clearTimeout(this.quietTimer);
    this.quietTimer = window.setTimeout(() => {
      if (this.holds.size === 0) this.hide();
    }, QUIET_MS);
  }

  /**
   * Restarts the quiet timer whenever new content is added to the page.
   * Ignores attribute changes and anything inside an <svg> or our overlay:
   * spinners/animations change those constantly and would block us forever.
   */
  private watchDom(): void {
    this.zone.runOutsideAngular(() => {
      this.observer = new MutationObserver((mutations) => {
        const relevant = mutations.find((m) => this.isRelevant(m.target));
        if (relevant) {
          this.lastChange = relevant.target;
          this.restartQuietTimer();
        }
      });
      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      this.restartQuietTimer();
    });
  }

  private isRelevant(node: Node): boolean {
    const el = node instanceof Element ? node : node.parentElement;
    if (!el) return false;
    if (this.overlay?.contains(el)) return false;
    if (el.closest('svg, ng-lottie, libis-progress-spinner')) return false;
    return true;
  }

  private hide(): void {
    if (this.hidden || !this.overlay) return;
    this.hidden = true;
    this.log(
      `hidden after ${Math.round(performance.now() - this.startedAt)} ms`,
    );

    this.holds.clear();
    this.observer?.disconnect();
    window.clearTimeout(this.quietTimer);

    const overlay = this.overlay;
    overlay.classList.add('is-hiding');
    document.body.classList.add('libis-ready');

    window.setTimeout(() => {
      this.spinner?.destroy();
      overlay.remove();
    }, 300);
  }

  private log(...args: unknown[]): void {
    if (DEBUG) console.log('[LibisLoadingOverlay]', ...args);
  }
}
