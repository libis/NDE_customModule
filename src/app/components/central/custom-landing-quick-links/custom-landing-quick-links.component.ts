import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MATERIAL_IMPORTS } from 'src/app/shared/material.imports';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { PrimoStateService } from '@libis/primo-shared-state';
import { DomSanitizer } from '@angular/platform-browser';

export interface LandingQuickLink {
  id: string;
  enabled?: boolean;
  icon?: string;
  label: string;
  openInNewTab?: boolean;
  url?: string; // default URL (any language)
  urlByLang?: Record<string, string>; // per-language overrides
  code?: string; // label code (e.g. "nde.landing.links.link1")
}

const LANDING_ICON_NAMESPACE = 'landing';

@Component({
  selector: 'custom-landing-quick-links',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatIconModule, ...MATERIAL_IMPORTS],
  templateUrl: './custom-landing-quick-links.component.html',
  styleUrl: './custom-landing-quick-links.component.scss',
})
export class CustomLandingQuickLinksComponent implements OnInit {
  // @Input({ required: true }) hostComponent!: any;

  quickLinksAriaLabel = '';
  links: LandingQuickLink[] = [];
  iconSvgNameById: Record<string, string> = {};

  constructor(
    // private paths: AssetPathService,
    private translate: TranslateService,
    private iconRegistry: MatIconRegistry,
    private sanitizer: DomSanitizer,
    private primoStateService: PrimoStateService
  ) {}

  ngOnInit(): void {
    // console.log('[CustomLandingQuickLinksComponent] this', this);
    console.log('[CustomLandingQuickLinksComponent] ngOnInit primoStateService', this.primoStateService)
    // console.log('[CustomLandingQuickLinksComponent] ngOnInit primoStateService', this.primoStateService.config)
    // console.log('[CustomLandingQuickLinksComponent] ngOnInit primoStateService selectConfig', this.primoStateService.config.selectConfig$)
    // console.log('[CustomLandingQuickLinksComponent] ngOnInit primoStateService getConfig', this.primoStateService.config.getConfig)
    // console.log('[CustomLandingQuickLinksComponent] ngOnInit primoStateService getSystemConfiguration', this.primoStateService.config.getSystemConfiguration)

    // https://libis-kul-psb.primo.exlibrisgroup.com/nde/custom/32KUL_KUL-KULeuven_NDE/assets/landingpage/landingpage.json?lang=en&vid=32KUL_KUL:KULeuven_NDE

    this.quickLinksAriaLabel = this.translate.instant('nde.aria.landing.quickLinks',);

    for (let i = 1; i <= 20; i++) {
      this.links.push({
        id: `link${i}`,
        label: this.translate.instant(
          `nde.custom.landing.links.link${i}.label`,
        ),
        icon: this.translate.instant(`nde.custom.landing.links.link${i}.icon`),
        url: this.translate.instant(`nde.custom.landing.links.link${i}.url`),
        openInNewTab:
          this.translate.instant(
            `nde.custom.landing.links.link${i}.openInNewTab`,
          ) === 'true',
      });
    }

    console.log ("[CustomLandingQuickLinksComponent] links unfiltered: ", this.links )

    this.links = (this.links ?? []).filter(
      (l) => l.enabled !== false && !l.label.match(/nde.custom.landing.links/),
    );

    console.log ("[CustomLandingQuickLinksComponent] links filtered: ", this.links )

    // Register each landing page icon SVG individually with MatIconRegistry
    // so it renders inline in the DOM and can be styled by the color theme.
    const entries: [string, string][] = [];
    for (const link of this.links) {
      if (!link.icon) continue;

      const rel = `assets/landingpage/${link.icon}`;
      // const url = await this.paths.  (rel);

      const url = `/nde/custom/32KUL_LIBIS_NETWORK-CENTRAL_PACKAGE/assets/icons/${link.icon}`;
      if (url) {
        const iconName = link.icon.replace(/\.svg$/i, '');
        this.iconRegistry.addSvgIconInNamespace(
          LANDING_ICON_NAMESPACE,
          iconName,
          this.sanitizer.bypassSecurityTrustResourceUrl(url),
        );
        entries.push([link.id, `${LANDING_ICON_NAMESPACE}:${iconName}`]);
      }
    }
    console.log('[CustomLandingQuickLinksComponent] links', this.links);
    console.log('[CustomLandingQuickLinksComponent] entries', entries);

    this.iconSvgNameById = Object.fromEntries(entries);
  }

  onClick(ev: MouseEvent, link: LandingQuickLink) {
    // if there is no URL (Step 1), prevent jumping to top
    console.log('[CustomLandingQuickLinksComponent] onclick link', link);
    if (!link.url) {
      ev.preventDefault();
      ev.stopPropagation();
    }
  }
}
