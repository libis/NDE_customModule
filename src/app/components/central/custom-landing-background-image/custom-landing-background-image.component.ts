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
