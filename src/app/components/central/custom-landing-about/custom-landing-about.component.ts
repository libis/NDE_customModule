import { Component, Input } from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { MATERIAL_IMPORTS } from 'src/app/shared/material.imports';

@Component({
  selector: 'custom-landing-about',
  standalone: true,
  imports: [CommonModule, TranslateModule, ...MATERIAL_IMPORTS],
  templateUrl: './custom-landing-about.component.html',
  styleUrl: './custom-landing-about.component.scss',
})
export class CustomlandingAboutComponent {
  @Input() params: { image?: string } = {};

  constructor(private translate: TranslateService) {
    console.log(
      'TITLE:',
      this.translate.instant('nde.custom.landing.about.title'),
    );
    console.log(
      'DESCRIPTION:',
      this.translate.instant('nde.custom.landing.about.description'),
    );
    console.log(
      'IMAGE:',
      this.translate.instant('nde.custom.landing.about.imageUrl'),
    );
  }

  get title(): string {
    return this.translate.instant('nde.custom.landing.about.title');
  }

  get description(): string {
    return this.translate.instant('nde.custom.landing.about.description');
  }

  get aboutImgSrc(): string {
    return this.translate.instant('nde.custom.landing.about.imageUrl');
  }

  private isValidValue(value: string, key: string): boolean {
    return !!value && value !== 'NOT_DEFINED' && value !== key;
  }

  get showAbout(): boolean {
    return (
      this.isValidValue(this.title, 'nde.custom.landing.about.title') &&
      this.isValidValue(
        this.description,
        'nde.custom.landing.about.description',
      ) &&
      this.isValidValue(this.aboutImgSrc, 'nde.custom.landing.about.imageUrl')
    );
  }
}
