// import { AfterViewInit, Component, EventEmitter, Output } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { TranslateModule, TranslateService } from '@ngx-translate/core';

// @Component({
//   selector: 'custom-landing-background-image',
//   standalone: true,
//   imports: [CommonModule, TranslateModule],
//   template: '',
// })
// export class CustomLandingBackgroundImageComponent implements AfterViewInit {
//   @Output() backgroundApplied = new EventEmitter<void>();

//   constructor(private translate: TranslateService) {}
//   ngAfterViewInit(): void {
//     if (!this.showImage) {
//       this.backgroundApplied.emit();
//       return;
//     }

//     const url = this.imageUrl;

//     const imageLoaded = new Promise<void>((resolve) => {
//       const img = new Image();
//       img.onload = () => resolve();
//       img.onerror = () => resolve();
//       img.src = url;
//     });

//     this.waitForElement('.top-bar-background-image', 5000).then(
//       async (hero) => {
//         await imageLoaded;
//         if (hero) {
//           hero.style.setProperty(
//             'background-image',
//             `url("${url}")`,
//             'important',
//           );
//           hero.style.backgroundSize = 'cover';
//           hero.style.backgroundPosition = 'center';
//         }
//         this.backgroundApplied.emit();
//       },
//     );
//   }

//   private waitForElement(
//     selector: string,
//     maxMs: number,
//   ): Promise<HTMLElement | null> {
//     return new Promise((resolve) => {
//       const start = performance.now();
//       const check = () => {
//         const el = document.querySelector<HTMLElement>(selector);
//         if (el || performance.now() - start > maxMs) {
//           resolve(el);
//           return;
//         }
//         requestAnimationFrame(check);
//       };
//       check();
//     });
//   }

//   get imageUrl(): string {
//     return this.translate.instant('nde.custom.landing.backgroundImage');
//   }

//   get showImage(): boolean {
//     return (
//       !!this.imageUrl &&
//       this.imageUrl !== 'NOT_DEFINED' &&
//       this.imageUrl !== 'nde.custom.landing.backgroundImage'
//     );
//   }
// }
import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

const KEY = 'nde.custom.landing.backgroundImage';
const STYLE_ID = 'custom_landing_bg';

@Component({
  selector: 'custom-landing-background-image',
  standalone: true,
  template: '',
})
export class CustomLandingBackgroundImageComponent
  implements OnInit, OnDestroy
{
  @Output() backgroundApplied = new EventEmitter<void>();
  private sub?: Subscription;
  private emitted = false;

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    this.sub = this.translate.stream(KEY).subscribe((value: string) => {
      const url = value?.trim();
      const isSet = !!url && url !== KEY && url !== 'NOT_DEFINED';
      if (!isSet) return; // wait: labels may not be loaded yet

      const img = new Image();
      img.onload = img.onerror = () => {
        this.applyStyle(url);
        this.done();
      };
      img.src = url;
    });

    // safety net: release the loading overlay after 3s whatever happens
    setTimeout(() => this.done(), 3000);
  }

  private applyStyle(url: string): void {
    let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = `.top-bar-background-image {
      background-image: url("${url}") !important;
      background-size: cover !important;
      background-position: center !important;
    }`;
  }

  private done(): void {
    if (this.emitted) return;
    this.emitted = true;
    this.backgroundApplied.emit();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    document.getElementById(STYLE_ID)?.remove();
  }
}
