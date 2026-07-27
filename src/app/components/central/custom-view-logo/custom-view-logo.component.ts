import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { NDEComponent } from '../../decorators/nde-component.decorator';

@NDEComponent({
  selector: 'nde-logo',
  position: 'replace',
  viewPattern: /32KUL.*/,
})
@Component({
  selector: 'custom-view-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <a [href]="logoUrl" class="logo-link">
      <img [src]="logoSrc" alt="Library logo" class="logo-img" />
    </a>
  `,
  styles: [
    `
      .logo-img {
        height: 40px;
      }
    `,
  ],
})
export class ViewLogoComponent {
  logoSrc: string;
  logoUrl: string;

  constructor(private translate: TranslateService) {
    this.logoSrc = this.getFromCodeTable(
      'nui.customization.libraryLogo',
      '/assets/default-logo.png',
    );

    this.logoUrl = this.getFromCodeTable(
      'nui.customization.institutionWebsiteUrl',
      '/',
    );

    //  listen to language change
    this.translate.onLangChange.subscribe(() => {
      console.log(' Language changed');
      this.logoSrc = this.translate.instant('nui.customization.libraryLogo');
    });

    console.log(' Logo SRC:', this.logoSrc);
    console.log(' Logo URL:', this.logoUrl);
  }

  private getFromCodeTable(key: string, fallback: string): string {
    const value = this.translate.instant(key);
    return value === key ? fallback : value;
  }
}
