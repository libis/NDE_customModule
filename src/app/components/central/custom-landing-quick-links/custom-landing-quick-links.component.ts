import {
  Component,
  Input,
  OnInit,
  OnChanges,
  DestroyRef,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MATERIAL_IMPORTS } from 'src/app/shared/material.imports';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
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

const MAX_LINKS = 10;
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
  private destroyRef = inject(DestroyRef);

  constructor(
    // private paths: AssetPathService,
    private translate: TranslateService,
    private iconRegistry: MatIconRegistry,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.loadLinks();
  }

  private loadLinks(): void {
    const keys: string[] = ['nde.aria.landing.quickLinks'];

    for (let i = 1; i <= MAX_LINKS; i++) {
      keys.push(
        `nde.custom.landing.links.link${i}.label`,
        `nde.custom.landing.links.link${i}.icon`,
        `nde.custom.landing.links.link${i}.url`,
        `nde.custom.landing.links.link${i}.openInNewTab`,
      );
    }

    this.translate
      .stream(keys)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((translations) => {
        this.quickLinksAriaLabel = translations['nde.aria.landing.quickLinks'];

        const links: LandingQuickLink[] = [];

        for (let i = 1; i <= MAX_LINKS; i++) {
          const base = `nde.custom.landing.links.link${i}`;

          links.push({
            id: `link${i}`,
            label: translations[`${base}.label`],
            icon: translations[`${base}.icon`],
            url: translations[`${base}.url`],
            openInNewTab: translations[`${base}.openInNewTab`] === 'true',
          });
        }

        console.log(
          '[CustomLandingQuickLinksComponent] links unfiltered',
          links,
        );

        this.links = links.filter(
          (link) =>
            link.enabled !== false &&
            !link.label?.startsWith('nde.custom.landing.links.'),
        );

        console.log(
          '[CustomLandingQuickLinksComponent] links filtered',
          this.links,
        );

        this.registerIcons();
      });
  }

  private registerIcons(): void {
    const entries: [string, string][] = [];

    for (const link of this.links) {
      if (!link.icon) {
        continue;
      }

      const url = `/nde/custom/32KUL_LIBIS_NETWORK-CENTRAL_PACKAGE/assets/icons/${link.icon}`;

      const iconName = link.icon.replace(/\.svg$/i, '');

      this.iconRegistry.addSvgIconInNamespace(
        LANDING_ICON_NAMESPACE,
        iconName,
        this.sanitizer.bypassSecurityTrustResourceUrl(url),
      );

      entries.push([link.id, `${LANDING_ICON_NAMESPACE}:${iconName}`]);
    }

    this.iconSvgNameById = Object.fromEntries(entries);

    console.log('[CustomLandingQuickLinksComponent] icon entries', entries);
  }

  onClick(ev: MouseEvent, link: LandingQuickLink): void {
    console.log('[CustomLandingQuickLinksComponent] onclick link', link);

    if (!link.url) {
      ev.preventDefault();
      ev.stopPropagation();
    }
  }

  // ngOnInit(): void {
  //   console.log('[CustomLandingQuickLinksComponent] this', this);

  //   https://libis-kul-psb.primo.exlibrisgroup.com/nde/custom/32KUL_KUL-KULeuven_NDE/assets/landingpage/landingpage.json?lang=en&vid=32KUL_KUL:KULeuven_NDE

  //   Use get() instead of instant() for the initial loading of your quick links.
  //   get() returns an Observable and waits for ngx-translate to have the translation available.

  //   this.quickLinksAriaLabel = this.translate.instant('nde.aria.landing.quickLinks',);

  //   for (let i = 1; i <= MAX_LINKS; i++) {
  //     this.links.push({
  //       id: `link${i}`,
  //       label: this.translate.instant(
  //         `nde.custom.landing.links.link${i}.label`,
  //       ),
  //       icon: this.translate.instant(`nde.custom.landing.links.link${i}.icon`),
  //       url: this.translate.instant(`nde.custom.landing.links.link${i}.url`),
  //       openInNewTab:
  //         this.translate.instant(
  //           `nde.custom.landing.links.link${i}.openInNewTab`,
  //         ) === 'true',
  //     });
  //   }

  //   console.log ("[CustomLandingQuickLinksComponent] links unfiltered: ", this.links )

  //   this.links = (this.links ?? []).filter(
  //     (l) => l.enabled !== false && !l.label.match(/nde.custom.landing.links/),
  //   );

  //   console.log ("[CustomLandingQuickLinksComponent] links filtered: ", this.links )

  //   Register each landing page icon SVG individually with MatIconRegistry
  //   so it renders inline in the DOM and can be styled by the color theme.
  //   const entries: [string, string][] = [];
  //   for (const link of this.links) {
  //     if (!link.icon) continue;

  //     const rel = `assets/landingpage/${link.icon}`;
  //     const url = await this.paths.  (rel);

  //     const url = `/nde/custom/32KUL_LIBIS_NETWORK-CENTRAL_PACKAGE/assets/icons/${link.icon}`;
  //     if (url) {
  //       const iconName = link.icon.replace(/\.svg$/i, '');
  //       this.iconRegistry.addSvgIconInNamespace(
  //         LANDING_ICON_NAMESPACE,
  //         iconName,
  //         this.sanitizer.bypassSecurityTrustResourceUrl(url),
  //       );
  //       entries.push([link.id, `${LANDING_ICON_NAMESPACE}:${iconName}`]);
  //     }
  //   }
  //   console.log('[CustomLandingQuickLinksComponent] links', this.links);
  //   console.log('[CustomLandingQuickLinksComponent] entries', entries);

  //   this.iconSvgNameById = Object.fromEntries(entries);
  // }

  // onClick(ev: MouseEvent, link: LandingQuickLink) {
  //   if there is no URL (Step 1), prevent jumping to top
  //   console.log('[CustomLandingQuickLinksComponent] onclick link', link);
  //   if (!link.url) {
  //     ev.preventDefault();
  //     ev.stopPropagation();
  //   }
  // }
}
