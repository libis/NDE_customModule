import { Injectable, Inject, effect } from '@angular/core';
import { NDEEvent, NDEEventBase } from '../decorators/nde-event.decorator';
import { GlobalHttpEventService } from '../services/global-http-event.service';

import {
  STYLE_CONFIG,
  StyleConfig,
  TOPBAR_STYLE_MAP,
  BooleanOrViews,
} from '../config/style-config';
import { TranslateService } from '@ngx-translate/core';
import { PrimoStateService } from '@libis/primo-shared-state';

@NDEEvent({
  stream: 'all',
  enabled: true,
  description: 'Injects styles eagerly at bootstrap',
})
@Injectable()
export class styleConfigEvent extends NDEEventBase {
  private currentView: string = '';

  constructor(
    globalHttp: GlobalHttpEventService,
    @Inject(STYLE_CONFIG) private config: StyleConfig,
    private translate: TranslateService,
    private primo: PrimoStateService,
  ) {
    super(globalHttp);
    // this.config.topbarColor = this.getStyleValueFromCodeTable(
    //   this.config.topbarColor,
    //   'nde.style_config.topbarColor',
    // );
    this.config.topbarSize = this.getStyleValueFromCodeTable(
      this.config.topbarSize,
      'nde.style_config.topbarSize',
    );
    console.log('[styleConfigEvent] config', this.config);
    this.currentView = this.resolveCurrentView();
    this.injectStyles();
    // this.injectLandingPageFonts();
    this.applyDefaultListView();
    this.injectPrimaryColor();
    this.hideEmptyBannerButton();
  }

  private getStyleValueFromCodeTable(param: any, code: string): any {
    const value = this.translate.instant(code);
    if (value == code) return param;
    return value;
  }

  private resolveCurrentView(): string {
    const params = new URLSearchParams(window.location.search);
    return params.get('vid') ?? '';
  }

  private isActive(value: BooleanOrViews | undefined): boolean {
    if (value === undefined || value === false) return false;
    if (value === true) return true;
    return value.includes(this.currentView);
  }
  private injectPrimaryColor(): void {
    const key = 'nde.custom.primaryColor';

    this.translate.get(key).subscribe((value: string) => {
      const color = value?.trim();
      const isSet = !!color && color !== key && color !== 'NOT_DEFINED';
      const isValidHex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color ?? '');

      const light = (pct: number) =>
        `color-mix(in oklab, ${color} ${pct}%, white)`;
      const dark = (pct: number) =>
        `color-mix(in oklab, ${color} ${pct}%, black)`;

      const tokens: Record<string, string> = {
        primary: color,
        'on-primary': '#ffffff',
        'primary-container': light(20),
        'on-primary-container': dark(35),
        'primary-fixed': light(20),
        'primary-fixed-dim': light(40),
        'on-primary-fixed': dark(35),
        'on-primary-fixed-variant': dark(70),
        'inverse-primary': light(40),
      };

      const declarations = Object.entries(tokens)
        .flatMap(([name, val]) => [
          `--sys-${name}: ${val} !important;`,
          `--mat-sys-${name}: ${val} !important;`,
        ])
        .join('\n');

      this.toggleStyle(
        'style_primary_color',
        isSet && isValidHex,
        `html, body {\n${declarations}\n}`,
      );
    });
  }
  private getTopbarStyles(
    specs: (typeof TOPBAR_STYLE_MAP)[keyof typeof TOPBAR_STYLE_MAP],
  ): string {
    const isKulView = this.currentView?.startsWith('32KUL_KUL');
    const topbarBg = isKulView ? '#F8EEE8' : '#FFFFFF';
    // background-color: ${topbarBg} !important;
    return `
      header.top-bar.flex-column.header {
        height: ${specs.height} !important;
        min-height: ${specs.minHeight} !important;
        width: 100% !important;
      }
      header.top-bar .header-container {
        height: 100% !important;
        width: 100% !important;
        max-width: 100% !important;
        padding-left: 3rem !important;
        padding-right: 3rem !important;
        align-items: center !important;
        box-sizing: border-box !important;
      }
      nde-logo img {
        transform: scale(${specs.logoScale}) !important;
        transform-origin: left center;
      }
    `;
  }

  private getHideLandingPageOverlayStyles(): string {
    if (!this.isActive(this.config.HideLandingPageOverlay)) return '';
    return `
    .background-overlay {
      display: none !important;
    }
  `;
  }

  private getHideSignInStyles(): string {
    if (!this.isActive(this.config.HideSignIn)) return '';
    return `nde-user-area { display: none !important; }`;
  }

  private getHideLiriasLinksStyles(): string {
    if (!this.isActive(this.config.HideLinksInLiriasRecords)) return '';
    return `nde-view-it-card { display: none !important; }`;
  }

  private getHideLoginBannerStyles(): string {
    if (!this.isActive(this.config.HideLoginBannerInFullRecordView)) return '';
    return `nde-custom-snack-bar { display: none !important; }`;
  }

  private injectHideHowToGetItStyles(): void {
    if (!this.isActive(this.config.HideHowToGetIt)) return;

    const service = {
      title: 'nui.getit.service_howtogetit',
      scrollId: 'getit_link1_0',
    };

    this.translate.get(service.title).subscribe((translatedLabel) => {
      const styleId = 'style_' + service.scrollId;
      if (document.getElementById(styleId)) return;

      const s = document.createElement('style');
      s.id = styleId;
      s.innerHTML = `
        div#services-index button[aria-label="${translatedLabel}"] { display: none !important; }
        div.full-view-section#${service.scrollId} { display: none !important; }
      `;
      document.head.appendChild(s);
    });
  }

  private injectHideWhereToFindItStyles(): void {
    if (!this.isActive(this.config.HideWhereToFindIt)) return;

    const service = {
      title: 'nui.getit.service_getit',
      scrollId: 'getit_link1_1',
    };

    this.translate.get(service.title).subscribe((translatedLabel) => {
      const styleId = 'style_' + service.scrollId;
      if (document.getElementById(styleId)) return;

      const s = document.createElement('style');
      s.id = styleId;
      s.innerHTML = `
        div#services-index button[aria-label="${translatedLabel}"] { display: none !important; }
        div.full-view-section#${service.scrollId} { display: none !important; }
      `;
      document.head.appendChild(s);
    });
  }

  private applyDefaultListView(): void {
    if (!this.isActive(this.config.DefaultListView)) return;

    const observer = new MutationObserver(() => {
      const listBtn = document.querySelector(
        '[data-qa="view-as-list"]',
      ) as HTMLElement;
      const gridBtn = document.querySelector(
        '[data-qa="view-as-grid"]',
      ) as HTMLElement;

      if (listBtn && gridBtn) {
        const isGridActive = gridBtn.getAttribute('aria-pressed') === 'true';

        if (isGridActive) {
          console.log('[styleConfigEvent] switching to list view');
          listBtn.click();
        }

        observer.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  private getLocationNumberInBoldStyles(): string {
    if (!this.isActive(this.config.LocationNumberInBold)) return '';

    return `
    [data-qa="location-call-number"] {
      font-weight: bold !important;
    }
  `;
  }

  private getCloseBannerIconStyles(): string {
    return `
    .banner-close-button mat-icon {
      background: white !important;
      border-radius: 50% !important;
      padding: 4px !important;
      color: black !important;
    }

    .banner-close-button mat-icon svg path {
      fill: black !important;
    }
  `;
  }
  private getHideVirtualBrowseStyles(): string {
    if (!this.isActive(this.config.HideVirtualBrowse)) return '';
    return `div[id="brief.results.tabs.browseshelf"] { display: none !important; }`;
  }

  // Search inside journal is not ready yet -> hidden for ALL institutions
  private getHideSearchInsideStyles(): string {
    if (!this.isActive(this.config.HideSearchInside)) return '';
    return `nde-search-within-journal { display: none !important; }`;
  }

  /**
   * Associatie-views: "Report a problem" enkel tonen als de gebruiker aangemeld is.
   * Andere views: niets doen -> altijd zichtbaar.
   */
  private getHideReportAProblemStyles(): void {
    if (!this.isActive(this.config.HideReportAProblemWhenLoggedOut)) return;

    const isLoggedIn = this.primo.user.isLoggedInSignal();

    effect(() => {
      this.toggleStyle(
        'style_hide_report_a_problem',
        !isLoggedIn(),
        'nde-report-a-problem { display: none !important; }',
      );
    });
  }

  private toggleStyle(id: string, enabled: boolean, css: string): void {
    const existing = document.getElementById(id);
    if (enabled && !existing) {
      const s = document.createElement('style');
      s.id = id;
      s.textContent = css;
      document.head.appendChild(s);
    } else if (!enabled && existing) {
      existing.remove();
    }
  }

  /** Banner above results: hide the button when its text is empty / not filled in. */
  private hideEmptyBannerButton(): void {
    if (!this.isActive(this.config.HideBannerButtonWithoutUrl)) return;

    const check = () => {
      document.querySelectorAll<HTMLElement>('#bannerButton').forEach((btn) => {
        const text =
          btn.querySelector('.mdc-button__label')?.textContent?.trim() ?? '';
        const isEmpty =
          !text || text === 'NOT_DEFINED' || /^(nui|nde)\.[\w.]+$/.test(text); // raw label key = not filled in
        btn.style.display = isEmpty ? 'none' : '';
      });
    };

    // the banner can appear later (search results), so keep watching
    new MutationObserver(check).observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    check();
  }
  private injectStyles() {
    const styleId = 'nde-custom-topbar-styles';
    if (document.getElementById(styleId)) return;

    const specs = TOPBAR_STYLE_MAP[this.config.topbarSize ?? 'thin'];

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = [
      // this.getGlobalThemeStyles(),
      // this.getTopbarStyles(specs),
      this.getHideSignInStyles(),
      this.getHideLiriasLinksStyles(), // niet zeker? lirias in kuleuven relevant?
      // this.getHideLoginBannerStyles(),
      this.getLocationNumberInBoldStyles(),
      this.getCloseBannerIconStyles(),
      this.getHideVirtualBrowseStyles(),
      this.getHideSearchInsideStyles(),
      this.getHideLoginBannerStyles(),
      this.getHideReportAProblemStyles(),
      // `nde-landing-page > *:not(custom-landing-about) { display: none !important; }`,
    ].join('\n');

    document.head.appendChild(style);

    this.injectHideHowToGetItStyles();
    this.injectHideWhereToFindItStyles();
    console.log(
      'semmi test style injected from config via nde event:',
      this.config,
    );
  }
}
