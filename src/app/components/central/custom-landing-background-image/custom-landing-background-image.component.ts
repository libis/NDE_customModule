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
    setTimeout(() => {
      const hero = document.querySelector(
        '.top-bar-background-image',
      ) as HTMLElement;

      console.log('[BackgroundImage] hero:', hero);
      console.log('[BackgroundImage] imageUrl:', this.imageUrl);

      if (hero && this.showImage) {
        hero.style.setProperty(
          'background-image',
          `url("${this.imageUrl}")`,
          'important',
        );

        hero.style.backgroundSize = 'cover';
        hero.style.backgroundPosition = 'center';

        console.log('[BackgroundImage] applied:', hero.style.backgroundImage);

        this.backgroundApplied.emit();
      }
    }, 2000);
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
