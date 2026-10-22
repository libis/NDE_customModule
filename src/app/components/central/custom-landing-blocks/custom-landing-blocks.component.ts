import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription, merge } from 'rxjs';
import { MATERIAL_IMPORTS } from 'src/app/shared/material.imports';
import { HostBinding } from '@angular/core';

export interface LandingBlock {
  id: string;
  title: string;
  description: string;
  descriptionType: 'image-html' | 'image-url' | 'text' | 'none';
}

const MAX_BLOCKS_PER_ROW = 3;

@Component({
  selector: 'custom-landing-blocks',
  standalone: true,
  imports: [CommonModule, TranslateModule, ...MATERIAL_IMPORTS],
  templateUrl: './custom-landing-blocks.component.html',
  styleUrl: './custom-landing-blocks.component.scss',
})
export class CustomLandingBlocksComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() blockrowNumber: string = '1';

  blocks: LandingBlock[] = [];

  private sub = new Subscription();

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    this.buildBlocks();

    // translations may arrive/change after the component is created
    this.sub.add(
      merge(
        this.translate.onLangChange,
        this.translate.onTranslationChange,
        this.translate.onDefaultLangChange,
      ).subscribe(() => this.buildBlocks()),
    );
  }

  ngOnChanges(): void {
    this.buildBlocks();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  // private buildBlocks(): void {
  //   const result: LandingBlock[] = [];

  //   for (let i = 1; i <= MAX_BLOCKS_PER_ROW; i++) {
  //     const base = `nde.custom.landing.blockrow${this.blockrowNumber}.block${i}`;
  //     const title = this.getValue(`${base}.title`);
  //     const description = this.getValue(`${base}.description`);
  //     console.log(`title of block${i}:`, title);
  //     console.log(`description of block${i}:`, description);

  //     if (!title && !description) {
  //       continue; // block not defined -> skip
  //     }

  //     result.push({
  //       id: `row${this.blockrowNumber}-block${i}`,
  //       title,
  //       description,
  //       descriptionType: this.getDescriptionType(description),
  //     });
  //   }

  //   this.blocks = result;
  // }
  private buildBlocks(): void {
    const result: LandingBlock[] = [];

    for (let i = 1; i <= MAX_BLOCKS_PER_ROW; i++) {
      const base = `nde.custom.landing.blockrow${this.blockrowNumber}.block${i}`;

      const title = this.getValue(`${base}.title`);
      const description = this.getValue(`${base}.description`);

      console.log(base, title, description);

      if (!title && !description) {
        continue;
      }

      result.push({
        id: `row${this.blockrowNumber}-block${i}`,
        title,
        description,
        descriptionType: this.getDescriptionType(description),
      });
    }

    console.log('BLOCKS', result);

    this.blocks = result;
  }

  /** Returns the translation, or '' when it is missing / NOT_DEFINED */

  private getValue(key: string): string {
    const v = this.translate.instant(key)?.trim();
    return v && v !== 'NOT_DEFINED' && v !== key ? v : '';
  }

  private getDescriptionType(value: string): LandingBlock['descriptionType'] {
    if (!value) return 'none';
    if (this.isImageHtml(value)) return 'image-html';
    if (this.isImageUrl(value)) return 'image-url';
    return 'text';
  }

  // for clickable image
  private isImageHtml(value: string): boolean {
    const v = value.toLowerCase();
    return v.includes('<img') && v.includes('<a ');
  }

  private isImageUrl(value: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(value.trim());
  }

  get columnClass(): string {
    switch (this.blocks.length) {
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
  // dont create whitespace when no blocks on blockrow should be vivible
  @HostBinding('style.display')
  get hostDisplay(): string | null {
    return this.blocks.length ? null : 'none';
  }

  trackById(_: number, block: LandingBlock): string {
    return block.id;
  }
}
