import { Injectable, Inject } from '@angular/core';
import { NDEEvent, NDEEventBase } from '../decorators/nde-event.decorator';
import { GlobalHttpEventService } from '../services/global-http-event.service';

import {
  STYLE_CONFIG,
  StyleConfig,
  TOPBAR_STYLE_MAP,
  BooleanOrViews,
  LandingPageStyling,
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
    private translate: TranslateService,
  ) {
    super(globalHttp);
    this.config.topbarColor = this.getStyleValueFromCodeTable(
      this.config.topbarColor,
      'nde.style_config.topbarColor',
    );
    this.config.topbarSize = this.getStyleValueFromCodeTable(
      this.config.topbarSize,
      'nde.style_config.topbarSize',
    );
    console.log('[styleConfigEvent] config', this.config);
    this.currentView = this.resolveCurrentView();
    this.injectStyles();
    this.injectLandingPageFonts();
    this.applyDefaultListView();
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

  /** Finds the landingPageStyling entry (if any) whose `views` includes the current view. */
  private getMatchedLandingStyling(): LandingPageStyling | undefined {
    return this.config.landingPageStyling?.find((entry) =>
      entry.views.includes(this.currentView),
    );
  }

  private getTopbarStyles(
    specs: (typeof TOPBAR_STYLE_MAP)[keyof typeof TOPBAR_STYLE_MAP],
  ): string {
    const isKulView = this.currentView?.startsWith('32KUL_KUL');
    const topbarBg = isKulView ? '#F8EEE8' : '#FFFFFF';
    return `
      header.top-bar.flex-column.header {
        background-color: ${topbarBg} !important;
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

  private getLandingPageStyling(): string {
    const styling = this.getMatchedLandingStyling();
    if (!styling) return '';

    const { backgroundColor, colors, fonts } = styling;

    const titleFontRule = fonts?.titleFamily
      ? `font-family: ${fonts.titleFamily} !important;`
      : '';
    const subtitleFontRule = fonts?.subtitleFamily
      ? `font-family: ${fonts.subtitleFamily} !important;`
      : '';
    const textFontRule = fonts?.textFamily
      ? `font-family: ${fonts.textFamily} !important;`
      : '';

    // Paginatitels vallen terug op darkGreen zodat ze zichtbaar blijven op lichte vlakken
    const titleColor = colors?.title ?? colors?.darkGreen ?? '#056D7C';
    // Geavanceerd zoeken knoppen op de hero-banner vallen standaard terug op wit
    const advButtonsColor = colors?.advancedSearchButtons ?? '#FFFFFF';

    return `
  :root {
    --nde-landing-bg: ${backgroundColor ?? 'transparent'};
    --nde-light-green: ${colors?.lightGreen ?? '#EBF3F3'};
    --nde-dark-green: ${colors?.darkGreen ?? '#056D7C'};
    --nde-sea-green: ${colors?.seaGreen ?? '#056D7C'};
    --nde-text: ${colors?.text ?? '#333333'};
    --nde-title-color: ${titleColor};
    --nde-adv-buttons-color: ${advButtonsColor};
  }

  /* Global Background Override */
  html,
  body,
  nde-landing-page-config,
  nde-landing-page-renderer,
  nde-landing-search-section,
  nde-landing-section-host,
  .main-landing-page,
  nde-landing-about,
  nde-landing-quick-links,
  nde-landing-announcements,
  nde-home-page-showcase {
    background-color: var(--nde-landing-bg) !important;
  }

  /* Headings & Main Title Color */
  h1, h2, h3, h4, h5, h6,
  .about-text-title,
  .announcements-title,
  .announcements-item-title,
  .showcase-title,
  .quick-links-title,
  .mat-headline-1, .mat-headline-2, .mat-headline-3, .mat-headline-4, .mat-headline-5, .mat-headline-6,
  .mat-title, .mat-title-large, .mat-title-small {
    ${titleFontRule}
    color: var(--nde-title-color) !important;
  }

  /* Subtitles */
  .mat-title-medium,
  .mat-subtitle-1,
  .mat-subtitle-2,
  [class*="subtitle"] {
    ${subtitleFontRule}
    color: var(--nde-dark-green) !important;
  }

  /* Body Copy & General UI */
  body,
  p,
  span,
  a,
  button,
  input,
  label,
  .about-text-description,
  .announcements-item-description,
  .mat-body,
  .mat-body-large,
  .mat-body-medium,
  .mat-body-small,
  .mat-mdc-button,
  .mdc-button__label,
  .search-dropdown-container-button-text,
  .search-input-field,
  .mat-mdc-input-element,
  .search-input-field::placeholder {
    ${textFontRule}
    color: var(--nde-text) !important;
  }
`;
  }

  private getLandingPageLayoutStyles(): string {
    return `
  /* 1. Reset parent containers to 100% width */
  html, body,
  prm-explore,
  prm-main,
  prm-search,
  prm-search-bar,
  nde-search-bar,
  nde-top-bar,
  nde-landing-search-section,
  nde-landing-section-host,
  nde-landing-page-renderer,
  nde-landing-page-config,
  .main-landing-page {
    width: 100% !important;
    max-width: 100% !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    box-sizing: border-box !important;
  }

  /* 2. Hero Container - Vertical Space */
  .landing-search-background-image {
    position: relative !important;
    width: 100% !important;
    max-width: 100% !important;
    min-height: 80vh !important;
    height: auto !important;
    margin: 0 !important;
    padding: 60px 0 60px 0 !important;
    box-sizing: border-box !important;
    overflow: visible !important;
  }

  .landing-search-background-image .background-overlay {
    display: none !important;
  }

  /* 3. Main content wrapper stack */
  .custom-search-bar-container {
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-start !important;
    text-align: left !important;
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    padding: 0 !important;
    margin: 0 !important;
    box-sizing: border-box !important;
  }

  /* ORDER 1: FULL-WIDTH SVG IMAGE */
  .landing-search-background-img {
    display: block !important;
    visibility: visible !important;
    position: relative !important;
    top: auto !important;
    left: auto !important;
    order: 1 !important;
    width: 100% !important;
    max-width: 75vw !important;
    height: auto !important;
    object-fit: contain !important;
    margin-left: 0 !important;
    margin-top: 1rem !important;
    margin-bottom: 2rem !important;
  }

  /* ORDER 2: Title */
  .custom-search-bar-container h2 {
    order: 2 !important;
    position: relative !important;
    text-align: left !important;
    align-self: flex-start !important;
    width: calc(75vw - 3rem) !important;
    margin-left: 3rem !important;
    margin-top: 0 !important;
    margin-bottom: 1.4rem !important;
    font-size: 3.5rem !important;
    font-weight: 600 !important;
    line-height: 1.1 !important;
    box-sizing: border-box !important;
  }

  /* ORDER 3: Search Bar Area Host - Strictly capped at 50vw */
  nde-top-bar {
    order: 3 !important;
    position: relative !important;
    display: flex !important;
    flex-direction: column !important; /* stack children vertically */
    align-items: flex-start !important;
    margin-left: 3rem !important;
    width: 50vw !important;
    max-width: 50vw !important;
    box-sizing: border-box !important;
  }

  /* Force ALL internal containers inside nde-top-bar to respect the 50vw cap */
  nde-top-bar .top-bar-container,
  nde-top-bar nde-search-bar-container,
  nde-top-bar nde-search-bar-presenter,
  nde-top-bar .search-bar-container,
  nde-top-bar .flex-row.flex-1,
  nde-top-bar .search-bar-wrapper,
  nde-top-bar .search_box_container {
    width: 100% !important;
    max-width: 50vw !important;
    margin-left: 0 !important;
    padding-left: 0 !important;
    box-sizing: border-box !important;
  }

  /* Align inner elements tightly from the left */
  nde-top-bar .top-bar-container,
  nde-top-bar .search-bar-container {
    justify-content: flex-start !important;
  }
`;
  }
  private getWelcomeSectionStyles(): string {
    const styling = this.getMatchedLandingStyling();

    const titleFontFamily =
      styling?.fonts?.titleFamily || "'Inria Serif', serif";
    const textFontFamily =
      styling?.fonts?.textFamily || "'Montserrat', sans-serif";

    return `
  /* 1. Container alignment & left margin */
  .welcome.display-flex {
    margin-left: 5vw !important;
    padding-left: 0 !important;
    align-items: flex-start !important;
  }

  /* 2. "Welcome to the Library" Heading in Dark Green */
  .welcome .welcome-title,
  h2.welcome-title {
    font-family: ${titleFontFamily} !important;
    color: #056D7C !important; /* Dark Green Title */
    font-size: 2.75rem !important;
    font-weight: 700 !important;
    margin-bottom: 0.75rem !important;
    line-height: 1.2 !important;
  }

  /* 3. Subtext Description */
  .welcome .welcome-content {
    font-family: ${textFontFamily} !important;
    font-size: 1.15rem !important;
    color: #333333 !important;
    margin-bottom: 1.25rem !important;
  }

  /* 4. "Go to My Library Card" Styled Button */
  .welcome #myLibraryCard {
    display: inline-block !important;
    font-family: ${textFontFamily} !important;
    background-color: #056D7C !important; /* Dark Green Background */
    color: #F8EEE8 !important;            /* Cream Text Color */
    font-size: 1.1rem !important;
    font-weight: 600 !important;
    padding: 12px 24px !important;
    border-radius: 4px !important;
    text-decoration: none !important;
    cursor: pointer !important;
    transition: background-color 0.2s ease !important;
  }

  .welcome #myLibraryCard:hover {
    background-color: #01434C !important;
  }
  `;
  }
  private getAnnouncementCardStyles(): string {
    const styling = this.getMatchedLandingStyling();
    const titleFontRule = styling?.fonts?.titleFamily
      ? `font-family: ${styling.fonts.titleFamily} !important;`
      : '';
    const textFontRule = styling?.fonts?.textFamily
      ? `font-family: ${styling.fonts.textFamily} !important;`
      : '';

    return `
    .main-landing-page {
      position: relative !important;
    }

    nde-landing-announcements {
      position: absolute !important;
      top: 40px !important;
      right: 0 !important;
      width: 22vw !important;
      min-width: 260px !important;
      z-index: 10 !important;
      display: block !important;
    }

    nde-landing-announcements .announcements {
      background-color: var(--nde-light-green) !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      padding: 28px 24px !important;
      gap: 12px !important;
    }

    nde-landing-announcements .mat-title-medium,
    nde-landing-announcements a,
    nde-landing-announcements .announcements-title {
      ${titleFontRule}
      font-size: 1.15rem !important;
      font-weight: 600 !important;
      text-decoration: underline !important;
      color: var(--nde-dark-green) !important;
      margin: 0 0 8px 0 !important;
    }

    nde-landing-announcements .announcements-item-title {
      display: none !important;
    }

    nde-landing-announcements .mat-body-large,
    nde-landing-announcements p,
    nde-landing-announcements .announcements-item-description {
      ${textFontRule}
      font-size: 0.875rem !important;
      line-height: 1.4 !important;
      color: var(--nde-dark-green) !important;
      margin: 0 !important;
    }
  `;
  }

  private getSearchBarStyles(): string {
    return `
    /* Main Search Bar Pill */
    .search-bar-container {
      position: relative !important; /* Acts as the anchor for absolute positioning */
      display: flex !important;
      align-items: center !important;
      background-color: #FFFFFF !important;
      border: 1px solid var(--nde-sea-green, #056D7C) !important;
      border-radius: 999px !important;
      overflow: visible !important; /* Allow buttons to pop outside the pill */
      padding: 4px 8px !important;
      box-shadow: none !important;
      width: 100% !important;
      margin-bottom: 32px !important; /* Reserves vertical space below the search bar */
    }

    /* Parent wrappers must allow visible overflow */
    nde-top-bar,
    .top-bar-container,
    .search-bar-container-wrapper,
    .flex-row.flex-1 {
      overflow: visible !important;
    }

    .search-bar-container .search-dropdown-container,
    .search-bar-container .search-dropdown-container-button,
    .search-bar-container .search-bar-wrapper,
    .search-bar-container .search_box_container,
    .search-bar-container input {
      border: none !important;
      background: transparent !important;
      box-shadow: none !important;
      outline: none !important;
    }

    .search-dropdown-container-button {
      border-right: 1px solid #D8D8D8 !important;
      border-radius: 0 !important;
      padding-right: 12px !important;
      margin-right: 8px !important;
      flex-shrink: 0 !important;
    }

    .search-bar-container .flex-row.flex-1 {
      display: flex !important;
      align-items: center !important;
      flex: 1 1 auto !important;
      width: 100% !important;
    }

    .search-bar-wrapper {
      flex: 1 1 auto !important;
      display: flex !important;
      align-items: center !important;
    }

    .search_box_container {
      display: flex !important;
      align-items: center !important;
      width: 100% !important;
    }

    .search-input-field {
      flex: 1 1 auto !important;
      width: 100% !important;
      padding: 8px 4px !important;
    }

    .search-bar-actions.inline-block {
      display: flex !important;
      align-items: center !important;
      margin-left: auto !important;
      flex-shrink: 0 !important;
      gap: 2px !important;
    }

    .search-bar-container .mat-mdc-icon-button {
      background: transparent !important;
      margin: 0 !important;
    }
  `;
  }

  private getAdvancedSearchStyles(): string {
    return `
    .search-bar-container .flex-row.gap-075,
    .landing-search-background-image .flex-row.gap-075,
    .custom-search-bar-container .flex-row.gap-075,
    nde-top-bar .flex-row.gap-075 {
      position: absolute !important;
      top: calc(100% + 12px) !important;
      left: 0 !important;
      right: 0 !important;
      width: 100% !important;
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      gap: 24px !important;
      margin: 0 !important;
      padding: 0 !important;
      z-index: 10 !important;
      background: transparent !important;
      color: var(--nde-dark-green) !important;
    }

    /* Target enkel de geavanceerd zoeken knoppen en hun specifieke text/iconen */
    .flex-row.gap-075 button,
    .flex-row.gap-075 a,
    .flex-row.gap-075 [data-qa="natural-language-search-button"],
    .flex-row.gap-075 [data-qa="advanced_search_button"] {
      position: static !important;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      text-decoration: underline !important;
      color: var(--nde-dark-green) !important;
      font-size: 1rem !important;
      font-weight: 500 !important;
      cursor: pointer !important;
      padding: 0 !important;
    }

    /* Dwing alle binnenste teksten, iconen en SVG paths van deze knoppen naar de knopkleur */
    .flex-row.gap-075 button *,
    .flex-row.gap-075 a *,
    .flex-row.gap-075 mat-icon,
    .flex-row.gap-075 prm-icon,
    .flex-row.gap-075 svg,
    .flex-row.gap-075 path {
      color: var(--nde-dark-green) !important;
      fill: var(--nde-adv-buttons-color, #FFFFFF) !important;
    }
  `;
  }
  private getQuickLinksStyles(): string {
    const styling = this.getMatchedLandingStyling();

    const fontFamily =
      styling?.fonts?.textFamily ||
      styling?.fonts?.titleFamily ||
      "'Montserrat', sans-serif";

    return `
  /* 1. Container bar styling */
  nde-landing-quick-links,
  .quick-links-landing-page {
    width: 100% !important;
    max-width: 100% !important;
    background-color: #056D7C !important;
    margin: 0 !important;
    padding: 24px 0 !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    box-sizing: border-box !important;
  }

  /* 2. Menu row layout */
  .quick-links-landing-page ul.menu {
    display: flex !important;
    flex-direction: row !important;
    justify-content: center !important;
    align-items: center !important;
    gap: 48px !important;
    margin: 0 !important;
    padding: 0 !important;
    list-style: none !important;
    width: auto !important;
  }

  .quick-links-landing-page ul.menu li {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .quick-links-landing-page ul.menu a {
    display: flex !important;
    align-items: center !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    text-decoration: none !important;
    cursor: pointer !important;
  }

  /* 3. DIRECT SPAN TARGETING (3x Font Size ~3rem / 48px) */
  nde-landing-quick-links span,
  .quick-links-landing-page span,
  .quick-links-landing-page ul.menu a span,
  .quick-links-landing-page li a span {
    font-family: ${fontFamily} !important;
    font-size: 1.5rem !important; /* 3x baseline font size */
    line-height: 1.2 !important;
    font-weight: 600 !important;
    color: #F8EEE8 !important;
    white-space: nowrap !important;
    display: inline-block !important;
  }

  /* 4. Hide icons completely */
  .quick-links-landing-page .icon,
  .quick-links-landing-page mat-icon,
  .quick-links-landing-page svg {
    display: none !important;
  }
  `;
  }

  private repositionAdvancedSearchRow(): void {
    const observer = new MutationObserver(() => {
      const row = document.querySelector('.flex-row.gap-075');
      const searchContainer = document.querySelector(
        '.custom-search-bar-container',
      );

      if (
        row &&
        searchContainer &&
        row.getAttribute('data-nde-moved') !== 'true'
      ) {
        row.setAttribute('data-nde-moved', 'true');
        searchContainer.appendChild(row);
        observer.disconnect();

        // Force Angular Material to recalculate tooltip overlays
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
          window.document.dispatchEvent(new Event('scroll'));
        }, 100);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  private injectLandingPageFonts(): void {
    const styling = this.getMatchedLandingStyling();
    const fonts = styling?.fonts;
    if (!fonts?.kitUrl && !fonts?.titleUrl && !fonts?.textUrl) return;
    // Marker element guards against re-injecting fonts on repeated calls,
    // independent of which specific URL fields happen to be set.
    if (document.getElementById('nde-landing-fonts-marker')) return;

    const marker = document.createElement('meta');
    marker.id = 'nde-landing-fonts-marker';
    marker.name = 'nde-landing-fonts';
    document.head.appendChild(marker);

    if (fonts.kitUrl) {
      // Adobe Fonts: a single kit stylesheet covers every configured weight,
      // no Google preconnect needed.
      const kit = document.createElement('link');
      kit.rel = 'stylesheet';
      kit.href = fonts.kitUrl;
      document.head.appendChild(kit);
      return;
    }

    // Google Fonts path (KU Leuven).
    const preconnect1 = document.createElement('link');
    preconnect1.rel = 'preconnect';
    preconnect1.href = 'https://fonts.googleapis.com';

    const preconnect2 = document.createElement('link');
    preconnect2.rel = 'preconnect';
    preconnect2.href = 'https://fonts.gstatic.com';
    preconnect2.crossOrigin = 'anonymous';

    document.head.append(preconnect1, preconnect2);

    if (fonts.titleUrl) {
      const titleFont = document.createElement('link');
      titleFont.rel = 'stylesheet';
      titleFont.href = fonts.titleUrl;
      document.head.appendChild(titleFont);
    }

    if (fonts.textUrl) {
      const textFont = document.createElement('link');
      textFont.rel = 'stylesheet';
      textFont.href = fonts.textUrl;
      document.head.appendChild(textFont);
    }
  }

  private injectStyles() {
    const styleId = 'nde-custom-topbar-styles';
    if (document.getElementById(styleId)) return;

    const specs = TOPBAR_STYLE_MAP[this.config.topbarSize ?? 'thin'];
    const useCustomLandingLayout = this.isActive(
      this.config.CustomLandingPageLayout,
    );

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = [
      this.getTopbarStyles(specs),
      this.getHideSignInStyles(),
      this.getHideLiriasLinksStyles(),
      this.getHideLoginBannerStyles(),
      this.getLocationNumberInBoldStyles(),
      this.getCloseBannerIconStyles(),
      this.getHideLandingPageOverlayStyles(),
      // Theming (colors/fonts/background) applies to any matched view,
      // e.g. both KU Leuven and Odisee.
      this.getLandingPageStyling(),
      // The bespoke hero/search/announcement layout rebuild only applies
      // to views opted into CustomLandingPageLayout (KU Leuven today).
      useCustomLandingLayout ? this.getLandingPageLayoutStyles() : '',
      useCustomLandingLayout ? this.getAnnouncementCardStyles() : '',
      useCustomLandingLayout ? this.getSearchBarStyles() : '',
      useCustomLandingLayout ? this.getAdvancedSearchStyles() : '',
      useCustomLandingLayout ? this.getQuickLinksStyles() : '',
      useCustomLandingLayout ? this.getWelcomeSectionStyles() : '',
    ].join('\n');

    document.head.appendChild(style);

    if (useCustomLandingLayout) {
      this.repositionAdvancedSearchRow();
    }

    this.injectHideHowToGetItStyles();
    this.injectHideWhereToFindItStyles();
    console.log(
      'semmi test style injected from config via nde event:',
      this.config,
    );
  }
}
