import {
  Component,
  Input,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchStateService, SUCCESS } from '@libis/primo-shared-state';
import {
  NDE_POSITION,
  NDEComponent,
} from 'src/app/decorators/nde-component.decorator';
import { ScriptLoaderService } from 'src/app/services/script-loader.service';

declare global {
  interface Window {
    _altmetric_embed_init: (parent?: Element | Document) => void;
  }
}

@NDEComponent({
  selector: 'nde-record-availability',
  position: NDE_POSITION.BOTTOM,
})
@Component({
  selector: 'custom-altmetric',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'altmetric.component.html',
  styleUrl: 'altmetric.component.scss',
  encapsulation: ViewEncapsulation.Emulated,
})
export class AltmetricComponent {
  private host = signal<any>(null);
  private scriptLoader = inject(ScriptLoaderService);
  private scriptReady = this.scriptLoader.isLoaded('Altmetric');
  private searchState = inject(SearchStateService);
  private searchStatus = this.searchState.searchStatusSignal();

  @Input() set hostComponent(value: any) {
    this.host.set(value);
  }

  private pnx = computed(() => {
    const h = this.host();
    return h?.searchResult?.pnx ?? h;
  });

  public doi = computed<string>(() => this.pnx()?.addata?.doi?.[0] ?? '');
  public isbn = computed<string>(() => this.pnx()?.addata?.isbn?.[0] ?? '');
  public recordid = computed<string>(
    () => this.pnx()?.control?.recordid?.[0] ?? '',
  );
  public id = signal<string>(crypto.randomUUID());
  public shouldRender = signal<boolean>(true);

  constructor() {
    // Recreate the badge DOM whenever this row's doi/isbn changes,
    // so Altmetric sees fresh, unprocessed elements.
    effect(() => {
      const doi = this.doi();
      const isbn = this.isbn();
      if (!doi && !isbn) return;

      untracked(() => {
        this.id.set(crypto.randomUUID());
        this.shouldRender.set(false);
      });
      queueMicrotask(() => untracked(() => this.shouldRender.set(true)));
    });

    // Trigger a global scan once the search results are loaded
    // and the embed script is ready.
    effect(() => {
      const ready = this.scriptReady();
      const status = this.searchStatus();
      if (!ready || status !== SUCCESS) return;

      // Defer to let the result rows render before scanning.
      setTimeout(() => window._altmetric_embed_init(document.body), 0);
    });
  }
}
