import { InjectionToken } from '@angular/core';

export type TopbarSize = 'thin' | 'medium' | 'thick';

export interface StyleConfig {
  topbarSize: TopbarSize;
  topbarColor: string;
  HideSignIn?: boolean;
  HideLinksInLiriasRecords?: boolean;
  HideLoginBannerInFullRecordView?: boolean;
  HideHowToGetIt?: boolean;
}

export const TOPBAR_STYLE_MAP = {
  thin: { height: '80px', minHeight: '80px', logoScale: 0.8 },
  medium: { height: '120px', minHeight: '120px', logoScale: 1 },
  thick: { height: '200px', minHeight: '200px', logoScale: 1.2 },
} as const;

export const DEFAULT_STYLE_CONFIG: StyleConfig = {
  topbarSize: 'thin',
  topbarColor: 'magenta',
  HideSignIn: true,
  HideLinksInLiriasRecords: true,
  HideLoginBannerInFullRecordView: true,
  HideHowToGetIt: true,
};

export const STYLE_CONFIG = new InjectionToken<StyleConfig>('STYLE_CONFIG', {
  factory: () => DEFAULT_STYLE_CONFIG,
});
