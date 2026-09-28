import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MATERIAL_IMPORTS } from 'src/app/shared/material.imports';
import { NDEComponent } from 'src/app/decorators/nde-component.decorator';

@NDEComponent({
  selector: 'nde-footer',
  position: 'after',
  viewPattern: /32KUL.*/,
})
@Component({
  selector: 'custom-static-footer',
  standalone: true,
  imports: [CommonModule, TranslateModule, ...MATERIAL_IMPORTS],
  template: `
    @if (showFooter) {
      <footer class="custom-footer">
        <div class="footer-content">
          <div class="footer-links">
            <span *ngIf="hasCopyright" [innerHTML]="copyrightHtml"> </span>

            <img
              *ngIf="hasLogo"
              [src]="logoUrl"
              alt="Footer logo"
              class="footer-logo"
            />
            <span> </span>
            <span *ngIf="hasPrivacy" [innerHTML]="privacyHtml"> </span>

            <span *ngIf="hasPrivacy && hasCookie" class="separator"> </span>

            <a
              *ngIf="hasCookie"
              class="cookie-link"
              (click)="openCookieDialog()"
            >
              {{ cookieLabel }}
            </a>
          </div>
        </div>
      </footer>
    }

    @if (cookieDialogOpen) {
      <div class="cookie-overlay">
        <div class="cookie-dialog">
          <div [innerHTML]="cookieHtml"></div>

          <button mat-button (click)="closeCookieDialog()">
            {{ closeLabel }}
          </button>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .custom-footer {
        background-color: var(--sys-primary);
        color: whitesmoke;
        padding: 1rem;
      }

      .footer-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
      }

      .footer-links {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.4rem;
        color: whitesmoke !important;
      }

      .custom-footer,
      .custom-footer span,
      .custom-footer a,
      .custom-footer a:visited,
      .custom-footer a:hover,
      .custom-footer a:active {
        color: whitesmoke !important;
      }

      /* IMPORTANT: links rendered through innerHTML */
      :host ::ng-deep .footer-links * {
        color: whitesmoke !important;
      }

      :host ::ng-deep .footer-links a,
      :host ::ng-deep .footer-links a:visited,
      :host ::ng-deep .footer-links a:hover,
      :host ::ng-deep .footer-links a:active {
        color: whitesmoke !important;
        text-decoration: none;
      }

      .cookie-link {
        cursor: pointer;
      }

      .footer-logo {
        max-height: 2rem;
        width: auto;
        display: block;
      }

      .cookie-overlay {
        position: fixed;
        inset: 0;
        background: rgb(0 0 0 / 50%);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }

      .cookie-dialog {
        background: white;
        max-width: 800px;
        max-height: 80vh;
        overflow: auto;
        padding: 2rem;
        border-radius: 8px;
      }
    `,
  ],
})
export class StaticFooterComponent {
  cookieDialogOpen = false;

  constructor(private translate: TranslateService) {
    console.log('footerrcopyright', this.copyrightHtml);
    console.log('footerrprivacy', this.privacyHtml);
    console.log('footerrcookieLabel', this.cookieLabel);
    console.log('footerrcookieHtml', this.cookieHtml);
    console.log('footerrlogoUrl', this.logoUrl);

    console.log('footerhasCopyright', this.hasCopyright);
    console.log('footerhasPrivacy', this.hasPrivacy);
    console.log('footerhasCookie', this.hasCookie);
    console.log('footerhasLogo', this.hasLogo);
    console.log('footerrshowFooter', this.showFooter);
  }

  get copyrightHtml(): string {
    return this.translate.instant('nde.custom.footer.copyright');
  }

  get privacyHtml(): string {
    return this.translate.instant('nde.custom.footer.privacy');
  }

  get cookieHtml(): string {
    return this.translate.instant('nde.custom.footer.cookie');
  }

  get cookieLabel(): string {
    return this.translate.instant('nde.custom.footer.cookie.label');
  }

  get closeLabel(): string {
    return this.translate.instant('nde.custom.footer.close.label');
  }

  get logoUrl(): string {
    return this.translate.instant('nde.custom.footer.logo');
  }

  private isValidValue(value: string, key: string): boolean {
    return (
      !!value && value.trim() !== '' && value !== 'NOT_DEFINED' && value !== key
    );
  }

  get hasCopyright(): boolean {
    return this.isValidValue(this.copyrightHtml, 'nde.custom.footer.copyright');
  }

  get hasPrivacy(): boolean {
    return this.isValidValue(this.privacyHtml, 'nde.custom.footer.privacy');
  }

  get hasCookie(): boolean {
    return (
      this.isValidValue(this.cookieLabel, 'nde.custom.footer.cookie.label') &&
      this.isValidValue(this.cookieHtml, 'nde.custom.footer.cookie')
    );
  }

  get hasLogo(): boolean {
    return this.isValidValue(this.logoUrl, 'nde.custom.footer.logo');
  }

  get showFooter(): boolean {
    return (
      this.hasCopyright || this.hasPrivacy || this.hasCookie || this.hasLogo
    );
  }

  openCookieDialog(): void {
    this.cookieDialogOpen = true;
  }

  closeCookieDialog(): void {
    this.cookieDialogOpen = false;
  }
}
