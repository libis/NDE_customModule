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
  constructor(private translate: TranslateService) {
    console.log('[LandingBlocks] Component constructed');

    setTimeout(() => {
      this.dumpState();
    }, 1000);
  }

  private dumpState(): void {
    console.log('================ LANDING BLOCKS ================');

    console.log('block1Title:', this.block1Title);
    console.log('block1Description:', this.block1Description);

    console.log('block2Title:', this.block2Title);
    console.log('block2Description:', this.block2Description);

    console.log('block3Title:', this.block3Title);
    console.log('block3Description:', this.block3Description);

    console.log('hasBlock1Title:', this.hasBlock1Title);
    console.log('hasBlock1Description:', this.hasBlock1Description);

    console.log('hasBlock2Title:', this.hasBlock2Title);
    console.log('hasBlock2Description:', this.hasBlock2Description);

    console.log('hasBlock3Title:', this.hasBlock3Title);
    console.log('hasBlock3Description:', this.hasBlock3Description);

    console.log('showBlock1:', this.showBlock1);
    console.log('showBlock2:', this.showBlock2);
    console.log('showBlock3:', this.showBlock3);

    console.log('numberOfBlocks:', this.numberOfBlocks);
    console.log('columnClass:', this.columnClass);

    console.log('===============================================');
  }
  // for clickable image
  isImageHtml(value: string): boolean {
    if (!value) {
      return false;
    }

    const lowerValue = value.toLowerCase();

    return lowerValue.includes('<img') && lowerValue.includes('<a ');
  }
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

  get hasBlock1Title(): boolean {
    return this.isValidValue(
      this.block1Title,
      'nde.custom.landing.block1.title',
    );
  }

  get hasBlock1Description(): boolean {
    return this.isValidValue(
      this.block1Description,
      'mde.custom.landing.block1.description',
    );
  }

  get hasBlock2Title(): boolean {
    return this.isValidValue(
      this.block2Title,
      'nde.custom.landing.block2.title',
    );
  }

  get hasBlock2Description(): boolean {
    return this.isValidValue(
      this.block2Description,
      'nde.custom.landing.block2.description',
    );
  }

  get hasBlock3Title(): boolean {
    return this.isValidValue(
      this.block3Title,
      'nde.custom.landing.block3.title',
    );
  }

  get hasBlock3Description(): boolean {
    return this.isValidValue(
      this.block3Description,
      'nde.custom.landing.block3.description',
    );
  }

  get showBlock1(): boolean {
    return this.hasBlock1Title || this.hasBlock1Description;
  }

  get showBlock2(): boolean {
    return this.hasBlock2Title || this.hasBlock2Description;
  }

  get showBlock3(): boolean {
    return this.hasBlock3Title || this.hasBlock3Description;
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
