import { Injectable, Inject } from '@angular/core';
import { NDEEvent, NDEEventBase } from '../decorators/nde-event.decorator';
import { GlobalHttpEventService } from '../services/global-http-event.service';
import {
  STYLE_CONFIG,
  StyleConfig,
  TOPBAR_STYLE_MAP,
  BooleanOrViews,
} from '../config/style-config';
import { TranslateService } from '@ngx-translate/core';

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
    private translate: TranslateService, // Now available here
  ) {
    super(globalHttp);
    this.currentView = this.resolveCurrentView();
    this.injectStyles();
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

  private getTopbarStyles(
    specs: (typeof TOPBAR_STYLE_MAP)[keyof typeof TOPBAR_STYLE_MAP],
  ): string {
    return `
      header.top-bar.flex-column.header {
        background-color: ${this.config.topbarColor} !important;
        height: ${specs.height} !important;
        min-height: ${specs.minHeight} !important;
      }
      header.top-bar .header-container {
        height: 100% !important;
        align-items: center !important;
      }
      nde-logo img {
        transform: scale(${specs.logoScale}) !important;
        transform-origin: left center;
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

  private injectStyles() {
    const styleId = 'nde-custom-topbar-styles';
    if (document.getElementById(styleId)) return;

    const specs = TOPBAR_STYLE_MAP[this.config.topbarSize ?? 'thin'];

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = [
      this.getTopbarStyles(specs),
      this.getHideSignInStyles(),
      this.getHideLiriasLinksStyles(),
      this.getHideLoginBannerStyles(),
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
