import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { NDEComponent } from '../../decorators/nde-component.decorator';

@NDEComponent({
  selector: 'nde-footer',
  position: 'after',
  viewPattern: /32KUL.*/,
})
@Component({
  selector: 'custom-static-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      id="footer"
      class="footer-container"
      [style.background-color]="footerColor"
    >
      <!-- LEFT -->
      <div class="footer-left">
        <a [href]="libisUrl" target="_blank">
          {{ libisLabel }}
        </a>

        <!-- <img src="/assets/logos/limo_2023.png" alt="Limo" class="limo-logo" /> -->
        <img
          src="https://kuleuven.limo.libis.be/discovery/custom/32KUL_LIBIS_NETWORK-CENTRAL_PACKAGE/img/limo_2023.png"
          alt="Limo"
          class="limo-logo"
        />
      </div>

      <!-- CENTER -->
      <div class="footer-center">
        <a [href]="privacyUrl" target="_blank">
          {{ privacyLabel }}
        </a>

        <a (click)="openDisclaimer()" class="clickable">
          {{ cookieLabel }}
        </a>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        margin-top: auto;
      }

      .footer-container {
        position: fixed; /* ✅ sticks to screen */
        bottom: 0;
        left: 0;
        width: 100%;

        z-index: 1000;

        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 20px;
        font-size: 13px;

        background-color: inherit; /* keeps your dynamic color */
      }

      .footer-left,
      .footer-center {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .limo-logo {
        height: 30px;
        padding-left: 6px;
      }

      .clickable {
        cursor: pointer;
        text-decoration: underline;
      }
    `,
  ],
})
export class StaticFooterComponent {
  libisUrl = 'https://www.libis.be/en/home';
  privacyUrl = '';
  libisLabel = 'Copyright © LIBIS';
  privacyLabel = 'Privacy Policy';
  cookieLabel = 'Cookie Policy';
  footerColor: string = '';

  constructor(private translate: TranslateService) {
    // reactive translations
    this.translate
      .stream('nui.footer.libis')
      .subscribe((v) => (this.libisLabel = v));

    this.translate
      .stream('nui.footer.privacy')
      .subscribe((v) => (this.privacyLabel = v));

    this.translate
      .stream('nui.footer.cookie')
      .subscribe((v) => (this.cookieLabel = v));

    this.translate
      .stream('nui.footer.privacyUrl')
      .subscribe((v) => (this.privacyUrl = v));

    this.footerColor = this.getFromCodeTable(
      'nde.style_config.topbarColor',
      '#000000',
    );
  }

  openDisclaimer() {
    console.log('TODO: open cookie dialog');
  }

  private getFromCodeTable(key: string, fallback: string): string {
    const value = this.translate.instant(key);
    return value === key ? fallback : value;
  }
}
