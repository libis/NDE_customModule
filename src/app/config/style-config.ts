import { InjectionToken } from '@angular/core';

export type TopbarSize = 'thin' | 'medium' | 'thick';
// to accept either boolean or viewlist
export type ViewList = string[]; // list of views, if set as a value => those views the value is true
export type BooleanOrViews = boolean | ViewList;

export interface StyleConfig {
  topbarSize?: TopbarSize;
  // topbarColor?: string;
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
  HideVirtualBrowse?: BooleanOrViews;
  HideSearchInside?: BooleanOrViews;
  HideReportAProblem?: BooleanOrViews;
}

export const TOPBAR_STYLE_MAP = {
  thin: { height: '80px', minHeight: '80px', logoScale: 0.8 },
  medium: { height: '120px', minHeight: '120px', logoScale: 1 },
  thick: { height: '200px', minHeight: '200px', logoScale: 1.2 },
} as const;

export const DEFAULT_STYLE_CONFIG: StyleConfig = {
  // topbarSize: 'thin',
  // topbarColor: 'red',
  HideSignIn: ['32KUL_KATHO:VIVES_NDE'], // if a view is included -> value will be true needs for : GSG, KMKG, Sportimonium, GRM.
  HideLinksInLiriasRecords: ['32KUL_KUL:Lirias_NDE'], // if a view is included -> value will be true
  HideLoginBannerInFullRecordView: ['32KUL_KATHO:VIVES_NDE'], // if a view is included -> value will be true needs for : GSG, KMKG, Sportimonium, GRM.
  HideHowToGetIt: ['32KUL_KATHO:VIVES_NDE'], // if a view is included -> value will be true
  HideWhereToFindIt: ['32KUL_KATHO:VIVES_NDE'], // if a view is included -> value will be true
  // DefaultListView: ['32KUL_KUL:KULeuven_NDE'], // kuleuven want galley view so turned of...
  LocationNumberInBold: ['32KUL_KUL:KULeuven_NDE'],
  AutoLoginFirstOption: [
    '32KUL_LIBS:LIBS',
    '32KUL_LIBS:RVAONEM',
    '32KUL_LIBS:PLEC',
  ],
  CloseBannerIconWhite: ['32KUL_KUL:KULeuven_NDE'],
  HideLandingPageOverlay: ['32KUL_KUL:KULeuven_NDE', '32KUL_HUB:ODISEE_NDE'],
  // HideVirtualBrowse: ['32KUL_KATHO:VIVES_NDE'], // moet voor iedereen verborgen behalve : ODISEE, VIVES, VLERICK EN GRM
  // Hidden for everyone EXCEPT: ODISEE, VIVES, VLERICK and GRM (they are simply not in this list)
  HideVirtualBrowse: [
    // LIBIS network
    '32KUL_LIBIS_NETWORK:LIBISNET2_UNION_NDE',
    '32KUL_LIBIS_NETWORK:DOKS_UNION_NDE',
    '32KUL_LIBIS_NETWORK:JESUITS_UNION_NDE',
    // KU Leuven
    '32KUL_KUL:KULeuven_NDE',
    '32KUL_KUL:music_NDE',
    '32KUL_KUL:Lirias_NDE',
    '32KUL_KUL:sportimonium_NDE',
    // other institutions
    '32KUL_ACV:ACV_NDE',
    '32KUL_ACV:tijdschriften_NDE',
    '32KUL_BPB:BPB_NDE',
    '32KUL_VES:VDIC_NDE',
    '32KUL_KADOC:KADOC_NDE',
    '32KUL_KBC:KBC_NDE',
    '32KUL_KMMR:KMKG_NDE',
    '32KUL_NBB:NBB_NDE',
    '32KUL_NBB:NBBMED_NDE',
    '32KUL_RBINS:RBINS_NDE',
    '32KUL_TIFA:BOSA_NDE',
    '32KUL_VCV:FARO_NDE',
    '32KUL_VLP:VLP_NDE',
    '32KUL_VLP:VLP_Archief_NDE',
    '32KUL_VLP:Archief_NDE',
    '32KUL_LUCAWENK:LUCA_NDE',
    '32KUL_LUCAWENK:music_NDE',
    '32KUL_FIN:FODFIN_NDE',
    '32KUL_KHM:TMOREMA_NDE',
    '32KUL_KHK:TMOREK_NDE',
    '32KUL_KHL:UCLL_NDE',
    '32KUL_GSB:GSB_NDE',
    '32KUL_GSG:GSG_NDE',
    '32KUL_DOCVB:docvlaamsbrabant_NDE',
    '32KUL_LIBS:LIBS_NDE',
    '32KUL_LIBS:RVAONEM_NDE',
    '32KUL_LIBS:PLEC_NDE',
    '49ECB_INST:ECB_NDE',
    '32SCKCEN_INST:SCKCEN_INST_NDE',
    // NOT in the list on purpose (browse shelf stays visible):
    // '32KUL_HUB:ODISEE_NDE'
    // '32KUL_KATHO:VIVES_NDE'
    // '32KUL_VLER:VBS_NDE'
    // GRM
  ],
  HideSearchInside: true, // hidden for ALL institutions: not ready to be shown yet
  HideReportAProblem: [
    '32KUL_KUL:KULeuven_NDE', // KU Leuven
    '32KUL_KHM:TMOREMA_NDE', // Thomas More (Mechelen/Antwerpen)
    '32KUL_KHK:TMOREK_NDE', // Thomas More (Kempen)
    '32KUL_HUB:ODISEE_NDE', // Odisee
    '32KUL_LUCAWENK:LUCA_NDE', // LUCA
    '32KUL_KATHO:VIVES_NDE', // VIVES
    '32KUL_KHL:UCLL_NDE', // UCLL
  ],
};

export const STYLE_CONFIG = new InjectionToken<StyleConfig>('STYLE_CONFIG', {
  factory: () => DEFAULT_STYLE_CONFIG,
});
