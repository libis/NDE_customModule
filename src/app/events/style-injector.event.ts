import { Injectable, Inject } from '@angular/core';
import { NDEEvent, NDEEventBase } from '../decorators/nde-event.decorator';
import { GlobalHttpEventService } from '../services/global-http-event.service';
import {
  STYLE_CONFIG,
  StyleConfig,
  TOPBAR_STYLE_MAP,
} from '../config/style-config';

@NDEEvent({
  stream: 'all',
  order: 1,
  description: 'Injects custom styles from StyleConfig into the document head',
})
@Injectable()
export class StyleInjectorEvent extends NDEEventBase {
  constructor(
    globalHttp: GlobalHttpEventService,
    @Inject(STYLE_CONFIG) private config: StyleConfig,
  ) {
    super(globalHttp);
    // Inject immediately at construction — no need to wait for any HTTP event
    this.injectStyles();
  }

  private getTopbarStyles(
    specs: (typeof TOPBAR_STYLE_MAP)[keyof typeof TOPBAR_STYLE_MAP],
  ): string {
    console.log('in the gettopbarstyles ');
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
    if (!this.config.HideSignIn) return '';
    return `
      nde-user-area {
        display: none !important;
      }
    `;
  }

  private getHideLiriasLinksStyles(): string {
    if (!this.config.HideLinksInLiriasRecords) return '';
    return `
      nde-view-it-card {
        display: none !important;
      }
    `;
  }

  private getHideLoginBannerStyles(): string {
    if (!this.config.HideLoginBannerInFullRecordView) return '';
    return `
      nde-custom-snack-bar {
        display: none !important;
      }
    `;
  }

  private injectStyles(): void {
    const styleId = 'nde-custom-topbar-styles';
    if (document.getElementById(styleId)) return;

    const specs = TOPBAR_STYLE_MAP[this.config.topbarSize];

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = [
      this.getTopbarStyles(specs),
      this.getHideSignInStyles(),
      this.getHideLiriasLinksStyles(),
      this.getHideLoginBannerStyles(),
    ].join('\n');

    document.head.appendChild(style);
    console.log(
      '[StyleInjectorEvent] Styles injected from config:',
      this.config,
    );
  }
}
