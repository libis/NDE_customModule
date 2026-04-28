import { InjectionToken } from '@angular/core';

export type TopbarSize = 'thin' | 'medium' | 'thick';
// to accept either boolean or viewlist
export type ViewList = string[]; // list of views, if set as a value => those views the value is true
export type BooleanOrViews = boolean | ViewList;

export interface StyleConfig {
  topbarSize?: TopbarSize;
  topbarColor?: string;
  HideSignIn?: BooleanOrViews;
  HideLinksInLiriasRecords?: BooleanOrViews;
  HideLoginBannerInFullRecordView?: BooleanOrViews;
  HideHowToGetIt?: BooleanOrViews;
  HideWhereToFindIt?: BooleanOrViews;
}

export const TOPBAR_STYLE_MAP = {
  thin: { height: '80px', minHeight: '80px', logoScale: 0.8 },
  medium: { height: '120px', minHeight: '120px', logoScale: 1 },
  thick: { height: '200px', minHeight: '200px', logoScale: 1.2 },
} as const;

export const DEFAULT_STYLE_CONFIG: StyleConfig = {
  // topbarSize: 'thin',
  // topbarColor: 'red',
  HideSignIn: ['32KUL_KUL:KULeuven_NDE'], // if a view is included -> value will be true
  HideLinksInLiriasRecords: ['32KUL_KUL:KULeuven_NDE'], // if a view is included -> value will be true
  HideLoginBannerInFullRecordView: ['32KUL_KUL:KULeuven_NDE'], // if a view is included -> value will be true
  HideHowToGetIt: ['32KUL_KUL:KULeuven_NDE'], // if a view is included -> value will be true
  HideWhereToFindIt: ['32KUL_KUL:KULeuven_NDE'], // if a view is included -> value will be true
};

export const STYLE_CONFIG = new InjectionToken<StyleConfig>('STYLE_CONFIG', {
  factory: () => DEFAULT_STYLE_CONFIG,
});
