import { AfterViewInit, Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'custom-landing-background-image',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: '',
})
export class CustomLandingBackgroundImageComponent implements AfterViewInit {
  @Output() backgroundApplied = new EventEmitter<void>();

  constructor(private translate: TranslateService) {}
  ngAfterViewInit(): void {
    if (!this.showImage) {
      this.backgroundApplied.emit();
      return;
    }

    const url = this.imageUrl;

    const imageLoaded = new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = url;
    });

    this.waitForElement('.top-bar-background-image', 5000).then(
      async (hero) => {
        await imageLoaded;
        if (hero) {
          hero.style.setProperty(
            'background-image',
            `url("${url}")`,
            'important',
          );
          hero.style.backgroundSize = 'cover';
          hero.style.backgroundPosition = 'center';
        }
        this.backgroundApplied.emit();
      },
    );
  }

  private waitForElement(
    selector: string,
    maxMs: number,
  ): Promise<HTMLElement | null> {
    return new Promise((resolve) => {
      const start = performance.now();
      const check = () => {
        const el = document.querySelector<HTMLElement>(selector);
        if (el || performance.now() - start > maxMs) {
          resolve(el);
          return;
        }
        requestAnimationFrame(check);
      };
      check();
    });
  }

  get imageUrl(): string {
    return this.translate.instant('nde.custom.landing.backgroundImage');
  }

  get showImage(): boolean {
    return (
      !!this.imageUrl &&
      this.imageUrl !== 'NOT_DEFINED' &&
      this.imageUrl !== 'nde.custom.landing.backgroundImage'
    );
  }
}
