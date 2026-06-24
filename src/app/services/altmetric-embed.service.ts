import { Injectable, effect, inject } from '@angular/core';
import { SearchStateService, SUCCESS } from '@libis/primo-shared-state';
import { ScriptLoaderService } from './script-loader.service';

declare global {
  interface Window {
    _altmetric_embed_init: (parent?: Element | Document) => void;
  }
}

@Injectable({ providedIn: 'root' })
export class AltmetricEmbedService {
  private scriptLoader = inject(ScriptLoaderService);
  private searchState = inject(SearchStateService);
  private scriptReady = this.scriptLoader.isLoaded('Altmetric');
  private searchStatus = this.searchState.searchStatusSignal();

  constructor() {
    effect(() => {
      const ready = this.scriptReady();
      const status = this.searchStatus();
      if (!ready || status !== SUCCESS) return;

      setTimeout(() => window._altmetric_embed_init(document.body), 0);
    });
  }
}
