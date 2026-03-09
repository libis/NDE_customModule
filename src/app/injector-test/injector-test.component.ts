import { Component, OnInit, Inject } from '@angular/core';
import {
  STYLE_CONFIG,
  StyleConfig,
  TOPBAR_STYLE_MAP,
} from '../config/style-config';

@Component({
  selector: 'nde-injector-test',
  template: ``,
})
export class InjectorTestComponent implements OnInit {
  constructor(@Inject(STYLE_CONFIG) private config: StyleConfig) {}

  ngOnInit() {
    console.log('Injector running with config:', this.config);
    this.injectStyles();
  }

  private injectStyles() {
    const styleId = 'nde-custom-topbar-styles';
    if (document.getElementById(styleId)) return;

    const specs = TOPBAR_STYLE_MAP[this.config.topbarSize];

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
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

    document.head.appendChild(style);
    console.log(' Styles injected from config:', this.config);
  }
}
