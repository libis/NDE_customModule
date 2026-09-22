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
import {
  NDE_POSITION,
  NDE_SLOTS,
  NDEComponent,
} from 'src/app/decorators/nde-component.decorator';
import { AltmetricEmbedService } from 'src/app/services/altmetric-embed.service';

@NDEComponent({
  selector: NDE_SLOTS.RECORD_AVAILABILITY,
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

  // Inject the embed service so its singleton effect spins up
  // and listens for search-status + script-ready changes.
  private _embedService = inject(AltmetricEmbedService);

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
    // Recreate this row's badge DOM whenever doi/isbn changes,
    // so Altmetric sees fresh, unprocessed elements when it scans.
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
  }
}
