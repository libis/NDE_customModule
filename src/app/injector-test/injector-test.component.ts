import { Component, OnInit, Inject } from '@angular/core';
import {
  STYLE_CONFIG,
  StyleConfig,
  TOPBAR_STYLE_MAP,
  BooleanOrViews,
} from '../config/style-config';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'nde-injector-test',
  template: ``,
})
export class InjectorTestComponent implements OnInit {
  private currentView: string = '';
  constructor(
    @Inject(STYLE_CONFIG) private config: StyleConfig,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    this.currentView = this.resolveCurrentView();
    console.log(
      'Injector running with config:',
      this.config,
      'view:',
      this.currentView,
    );
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
    return `
      nde-user-area {
        display: none !important;
      }
    `;
  }

  private getHideLiriasLinksStyles(): string {
    if (!this.isActive(this.config.HideLinksInLiriasRecords)) return '';
    return `
      nde-view-it-card {
        display: none !important;
      }
    `;
  }
  private getHideLoginBannerStyles(): string {
    if (!this.isActive(this.config.HideLoginBannerInFullRecordView)) return '';
    return `
    nde-custom-snack-bar {
      display: none !important;
    }
  `;
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
      s.setAttribute('id', styleId);

      s.innerHTML = '';
      s.innerHTML += `div#services-index button[aria-label="${translatedLabel}"] { display: none !important; }`;
      s.innerHTML += `div.full-view-section#${service.scrollId} { display: none !important; }`;

      document.getElementsByTagName('primo-explore')[0]?.appendChild(s);

      console.log('HideHowToGetIt applied with label:', translatedLabel);
    });
  }

  private injectStyles() {
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
    this.injectHideHowToGetItStyles(); // seprate because async
    console.log('Styles injected from config:', this.config);
  }
}
