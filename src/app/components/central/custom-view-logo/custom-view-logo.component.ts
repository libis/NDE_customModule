import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { NDEComponent } from 'src/app/decorators/nde-component.decorator';

@NDEComponent({
  selector: 'nde-logo',
  position: 'replace',
  viewPattern: /32KUL_.*:.*/,
})
@Component({
  selector: 'custom-view-logo',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './custom-view-logo.component.html',
  styleUrl: './custom-view-logo.component.scss',
  encapsulation: ViewEncapsulation.None // To make the style global and not scoped (hide the original nde-logo)
})
export class ViewLogoComponent {
  private defaultLogo = '/nde/custom/assets/images/default-logo.png';
  private failedSrc = '';
  private dashedVid = '';

  constructor(private translate: TranslateService) {
    const bootstrapCfg = (window as any).__BOOTSTRAP_CFG__ ?? {};
    this.defaultLogo = `/nde/custom/${bootstrapCfg["nzVid"]}-CENTRAL_PACKAGE/assets/images/default-logo.png`;
    this.dashedVid = bootstrapCfg["dashedVid"]
  }

  get logoUrl(): string {
    return this.fromCodeTable('nui.customization.institutionWebsiteUrl') || '/';
  }

  get logoSrc(): string {
    let src =
      this.fromCodeTable(`nde.custom.library.logo.src`) ||
      this.defaultLogo;
    src = src.replace("{{dashedVid}}", this.dashedVid.replace(/_NDE$/, ""));
   
    // if this exact URL already failed to load, use the default instead
    return src === this.failedSrc ? this.defaultLogo : src;
  }

  onImgError(): void {
    const current = this.logoSrc;
    if (current !== this.defaultLogo) {
      this.failedSrc = current;
    }
  }

  // Same checks as in the alert component: empty, NOT_DEFINED, or key echoed back
  private fromCodeTable(key: string): string {
    const value = this.translate.instant(key);
    return !value || value === 'NOT_DEFINED' || value === key ? '' : value;
  }
}
