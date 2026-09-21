import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MATERIAL_IMPORTS } from 'src/app/shared/material.imports';

@Component({
  selector: 'custom-landing-blocks',
  standalone: true,
  imports: [CommonModule, TranslateModule, ...MATERIAL_IMPORTS],
  templateUrl: './custom-landing-blocks.component.html',
  styleUrl: './custom-landing-blocks.component.scss',
})
export class CustomLandingBlocksComponent {
  constructor(private translate: TranslateService) {}

  get block1Title(): string {
    return this.translate.instant('nde.custom.landing.block1.title');
  }

  get block1Description(): string {
    return this.translate.instant('nde.custom.landing.block1.description');
  }

  get block2Title(): string {
    return this.translate.instant('nde.custom.landing.block2.title');
  }

  get block2Description(): string {
    return this.translate.instant('nde.custom.landing.block2.description');
  }

  get block3Title(): string {
    return this.translate.instant('nde.custom.landing.block3.title');
  }

  get block3Description(): string {
    return this.translate.instant('nde.custom.landing.block3.description');
  }

  isImageUrl(value: string): boolean {
    if (!value) {
      return false;
    }

    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(value.trim());
  }

  private isValidValue(value: string, key: string): boolean {
    return !!value && value !== 'NOT_DEFINED' && value !== key;
  }

  get showBlock1(): boolean {
    return (
      this.isValidValue(this.block1Title, 'nde.custom.landing.block1.title') &&
      this.isValidValue(
        this.block1Description,
        'nde.custom.landing.block1.description',
      )
    );
  }

  get showBlock2(): boolean {
    return (
      this.isValidValue(this.block2Title, 'nde.custom.landing.block2.title') &&
      this.isValidValue(
        this.block2Description,
        'nde.custom.landing.block2.description',
      )
    );
  }

  get showBlock3(): boolean {
    return (
      this.isValidValue(this.block3Title, 'nde.custom.landing.block3.title') &&
      this.isValidValue(
        this.block3Description,
        'nde.custom.landing.block3.description',
      )
    );
  }

  get numberOfBlocks(): number {
    return [this.showBlock1, this.showBlock2, this.showBlock3].filter(Boolean)
      .length;
  }

  get columnClass(): string {
    switch (this.numberOfBlocks) {
      case 1:
        return 'one-column';
      case 2:
        return 'two-columns';
      case 3:
        return 'three-columns';
      default:
        return '';
    }
  }
}
