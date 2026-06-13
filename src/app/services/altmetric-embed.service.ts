import { Injectable, effect, inject } from '@angular/core';
import { PrimoStateService, SUCCESS } from '@libis/primo-shared-state';
import { ScriptLoaderService } from './script-loader.service';

declare global {
  interface Window {
    _altmetric_embed_init: (parent?: Element | Document) => void;
  }
}

@Injectable({ providedIn: 'root' })
export class AltmetricEmbedService {
  private scriptLoader = inject(ScriptLoaderService);
  private primo = inject(PrimoStateService);
  private scriptReady = this.scriptLoader.isLoaded('Altmetric');
  private searchStatus = this.primo.search.searchStatusSignal();

  constructor() {
    effect(() => {
      const ready = this.scriptReady();
      const status = this.searchStatus();
      if (!ready || status !== SUCCESS) return;

      setTimeout(() => window._altmetric_embed_init(document.body), 0);
    });
  }
}
