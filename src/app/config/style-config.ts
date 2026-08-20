// import { InjectionToken } from '@angular/core';

// export type TopbarSize = 'thin' | 'medium' | 'thick';
// // to accept either boolean or viewlist
// export type ViewList = string[]; // list of views, if set as a value => those views the value is true
// export type BooleanOrViews = boolean | ViewList;

// export interface StyleConfig {
//   topbarSize?: TopbarSize;
//   topbarColor?: string;
//   HideSignIn?: BooleanOrViews;
//   HideLinksInLiriasRecords?: BooleanOrViews;
//   HideLoginBannerInFullRecordView?: BooleanOrViews;
//   HideHowToGetIt?: BooleanOrViews;
//   HideWhereToFindIt?: BooleanOrViews;
//   DefaultListView?: BooleanOrViews;
//   LocationNumberInBold?: BooleanOrViews;
//   AutoLoginFirstOption?: BooleanOrViews;
//   CloseBannerIconWhite?: BooleanOrViews;
// }

// export const TOPBAR_STYLE_MAP = {
//   thin: { height: '80px', minHeight: '80px', logoScale: 0.8 },
//   medium: { height: '120px', minHeight: '120px', logoScale: 1 },
//   thick: { height: '200px', minHeight: '200px', logoScale: 1.2 },
// } as const;

// export const DEFAULT_STYLE_CONFIG: StyleConfig = {
//   // topbarSize: 'thin',
//   // topbarColor: 'red',
//   HideSignIn: false, // if a view is included -> value will be true
//   HideLinksInLiriasRecords: ['32KUL_KUL:KULeuven_NDE'], // if a view is included -> value will be true
//   HideLoginBannerInFullRecordView: ['32KUL_KUL:KULeuven_NDE'], // if a view is included -> value will be true
//   HideHowToGetIt: ['32KUL_KUL:KULeuven_NDE'], // if a view is included -> value will be true
//   HideWhereToFindIt: ['32KUL_KUL:KULeuven_NDE'], // if a view is included -> value will be true
//   DefaultListView: ['32KUL_KUL:KULeuven_NDE'],
//   LocationNumberInBold: ['32KUL_KUL:KULeuven_NDE'],
//   AutoLoginFirstOption: [
//     '32KUL_LIBS:LIBS',
//     '32KUL_LIBS:RVAONEM',
//     '32KUL_LIBS:PLEC',
//   ],
//   CloseBannerIconWhite: ['32KUL_KUL:KULeuven_NDE'],
// };

// export const STYLE_CONFIG = new InjectionToken<StyleConfig>('STYLE_CONFIG', {
//   factory: () => DEFAULT_STYLE_CONFIG,
// });
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { InjectionToken } from '@angular/core';

export type TopbarSize = 'thin' | 'medium' | 'thick';
// to accept either boolean or viewlist
export type ViewList = string[]; // list of views, if set as a value => those views the value is true
export type BooleanOrViews = boolean | ViewList;

export interface LandingPageStyling {
  views: ViewList; // which views this styling object applies to
  backgroundColor: string;
  hideBackgroundImage: boolean;
  landingImage: string;
  colors: {
    lightGreen: string;
    darkGreen: string;
    seaGreen: string;
    text: string;
    // NEW EASY COLOR OVERRIDES:
    title?: string; // Color for "Zoek in Limo" and section headings
    advancedSearchButtons?: string; // Color for "Geavanceerd zoeken" & "Vraag wat je wilt"
    topbarBackground?: string; // Color for the header topbar
  };
  // Fonts are fully optional. Anything left unset simply inherits NDE's
  // default typography instead of having a font-family forced on it.
  fonts?: {
    // Adobe Fonts / Typekit path: one kit stylesheet covers all weights.
    kitUrl?: string;
    titleFamily?: string; // e.g. bold weight
    subtitleFamily?: string; // e.g. semibold weight
    textFamily?: string; // e.g. regular weight

    // Google Fonts path (used by KU Leuven today).
    titleUrl?: string;
    textUrl?: string;
  };
}

export interface StyleConfig {
  topbarSize?: TopbarSize;
  topbarColor?: string;
  HideSignIn?: BooleanOrViews;
  HideLinksInLiriasRecords?: BooleanOrViews;
  HideLoginBannerInFullRecordView?: BooleanOrViews;
  HideHowToGetIt?: BooleanOrViews;
  HideWhereToFindIt?: BooleanOrViews;
  DefaultListView?: BooleanOrViews;
  LocationNumberInBold?: BooleanOrViews;
  AutoLoginFirstOption?: BooleanOrViews;
  CloseBannerIconWhite?: BooleanOrViews;
  HideLandingPageOverlay?: BooleanOrViews;
  // Only views listed here get the bespoke KU Leuven hero / search-pill /
  // announcement-card layout rebuild. Everyone else keeps NDE's default
  // landing page structure and only gets themed via landingPageStyling.
  CustomLandingPageLayout?: BooleanOrViews;
  // Array now: each entry declares which views it applies to, so multiple
  // institutions can each get their own colors/fonts/image.
  landingPageStyling?: LandingPageStyling[];
}

export const TOPBAR_STYLE_MAP = {
  thin: { height: '80px', minHeight: '80px', logoScale: 0.8 },
  medium: { height: '120px', minHeight: '120px', logoScale: 1 },
  thick: { height: '200px', minHeight: '200px', logoScale: 1.2 },
} as const;

// KU Leuven's own bespoke design — pairs with CustomLandingPageLayout.
export const standardViewLandingpageStyling: LandingPageStyling = {
  views: ['32KUL_KUL:KULeuven_NDE'],
  backgroundColor: '#F8EEE8',
  hideBackgroundImage: false,
  landingImage: '/assets/views/kuleuven/images/book.svg',
  colors: {
    lightGreen: '#C8D4D2',
    darkGreen: '#01434C',
    seaGreen: '#056D7C',
    text: '#00070F',
  },
  fonts: {
    titleFamily: "'Inria Serif', serif",
    titleUrl:
      'https://fonts.googleapis.com/css2?family=Inria+Serif:wght@400;700&display=swap',
    textFamily: "'Montserrat', sans-serif",
    textUrl:
      'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap',
  },
};

// Out-of-the-box NDE look, just recolored for Odisee — no bespoke layout.
// Colors converted from Odisee's brand spec:
//   Nachtblauw   R31 G65 B107   -> #1F416B  (darkGreen slot / titles)
//   Helderwit    R255 G255 B255 -> #FFFFFF  (backgroundColor)
//   Printerzwart R24 G23 B22    -> #181716  (text / body copy)
//   Mistblauw    R211 G221 B242 -> #D3DDF2  (lightGreen slot / card bg)
//   Muntgroen    R60 G180 B151  -> #3CB497  (seaGreen slot / accents, borders)
export const standardViewNDELandingpageStyling: LandingPageStyling = {
  views: ['32KUL_HUB:ODISEE_NDE'], //
  backgroundColor: '#FFFFFF', // Helderwit
  hideBackgroundImage: false,
  landingImage:
    'https://wmimages.bruzz.be/styles/1f8c29ed4efcaed916a7e270e4064aaa5d961eac/2019-09/odisee_2019_nachtblauw_rgb.jpg?style=W3sianBlZyI6eyJxdWFsaXR5Ijo3MH19LHsicmVzaXplIjp7ImZpdCI6Imluc2lkZSIsIndpZHRoIjoxMjk2LCJoZWlnaHQiOjg2NCwid2l0aG91dEVubGFyZ2VtZW50Ijp0cnVlfX1d&sign=4417df69d44bf54603642602bc26a210390ce4ae2300ab79c5d234a8591dfb34', // TODO: real asset from "Startpagina-inhoud"
  colors: {
    darkGreen: '#1F416B', // Nachtblauw
    lightGreen: '#D3DDF2', // Mistblauw
    seaGreen: '#3CB497', // Muntgroen
    text: '#181716', // Printerzwart
    // EASY CONFIGURABLE COLORS FOR ODISEE:
    title: '#FFFFFF', // "Zoek in Limo" on hero banner (White)
    advancedSearchButtons: '#FFFFFF', // "Geavanceerd zoeken" & "Vraag wat je wilt" (White)
    topbarBackground: '#FFFFFF', // Header background
  },
  fonts: {
    // TODO: paste the real Adobe Fonts kit URL, e.g. https://use.typekit.net/xxxxxxx.css
    kitUrl: '',
    titleFamily: "'source-sans-pro', sans-serif", // Bold
    subtitleFamily: "'source-sans-pro', sans-serif", // Semibold
    textFamily: "'source-sans-pro', sans-serif", // Regular
  },
};

export const DEFAULT_STYLE_CONFIG: StyleConfig = {
  // topbarSize: 'thin',
  // topbarColor: 'red',
  HideSignIn: ['32KUL_KATHO:VIVES_NDE'], // if a view is included -> value will be true
  HideLinksInLiriasRecords: ['32KUL_KUL:KULeuven_NDE'], // if a view is included -> value will be true
  HideLoginBannerInFullRecordView: ['32KUL_KUL:KULeuven_NDE'], // if a view is included -> value will be true
  HideHowToGetIt: ['32KUL_KATHO:VIVES_NDE'], // if a view is included -> value will be true
  HideWhereToFindIt: ['32KUL_KATHO:VIVES_NDE'], // if a view is included -> value will be true
  DefaultListView: ['32KUL_KUL:KULeuven_NDE'],
  LocationNumberInBold: ['32KUL_KUL:KULeuven_NDE'],
  AutoLoginFirstOption: [
    '32KUL_LIBS:LIBS',
    '32KUL_LIBS:RVAONEM',
    '32KUL_LIBS:PLEC',
  ],
  CloseBannerIconWhite: ['32KUL_KUL:KULeuven_NDE'],
  HideLandingPageOverlay: ['32KUL_KUL:KULeuven_NDE', '32KUL_HUB:ODISEE_NDE'],
  CustomLandingPageLayout: ['32KUL_KUL:KULeuven_NDE'], // only KU Leuven gets the bespoke layout
  landingPageStyling: [
    standardViewLandingpageStyling,
    standardViewNDELandingpageStyling,
  ],
};

export const STYLE_CONFIG = new InjectionToken<StyleConfig>('STYLE_CONFIG', {
  factory: () => DEFAULT_STYLE_CONFIG,
});
