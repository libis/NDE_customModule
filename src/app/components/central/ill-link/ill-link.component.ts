import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { NDEComponent } from 'src/app/decorators/nde-component.decorator';

const ILL_LABEL_KEY = 'nde.custom.blank-ill-request';

@NDEComponent({
  selector: 'nde-requests-page',
  position: 'before',
  viewPattern: /32KUL_KUL:KULeuven.*/,
})
@Component({
  selector: 'custom-ill-link',
  standalone: true,
  template: `
    <div #ill class="ill-link" [style.display]="show() ? '' : 'none'">
      <a href="#" (click)="goToIll($event)">{{ label() }}</a>
    </div>
  `,
})
export class IllLinkComponent implements AfterViewInit, OnDestroy {
  @ViewChild('ill', { static: true }) ill!: ElementRef<HTMLElement>;

  private translate = inject(TranslateService);

  /** Updates by itself when the translations arrive later. */
  label = toSignal(this.translate.stream(ILL_LABEL_KEY), { initialValue: '' });

  show = computed(() => {
    const v = (this.label() ?? '').trim();
    const ok = !!v && v !== 'NOT_DEFINED' && v !== ILL_LABEL_KEY;
    console.log('[IllLink] label =', JSON.stringify(v), '-> show =', ok);
    return ok;
  });

  private destroyed = false;

  ngAfterViewInit(): void {
    // The requests page renders AFTER this "before" slot, so wait for its title.
    const start = performance.now();
    const tryMove = () => {
      if (this.destroyed) return;
      const title = document.querySelector(
        'nde-requests-page .requests-section-title',
      );
      if (title) {
        title.insertAdjacentElement('afterend', this.ill.nativeElement);
        console.log('[IllLink] moved under the Requests title');
        return;
      }
      if (performance.now() - start < 5000) {
        requestAnimationFrame(tryMove);
      } else {
        console.warn(
          '[IllLink] .requests-section-title not found, link stays on top',
        );
      }
    };
    tryMove();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.ill?.nativeElement.remove(); // it lives outside our host after the move
  }

  goToIll(event: Event): void {
    event.preventDefault();
    const vid = new URLSearchParams(window.location.search).get('vid') ?? '';
    window.location.href = `/discovery/blankIll?vid=${encodeURIComponent(vid)}`;
  }
}
