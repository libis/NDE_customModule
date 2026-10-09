// import { Component, Input } from '@angular/core';
// import { TranslateService, TranslateModule } from '@ngx-translate/core';
// import { CommonModule } from '@angular/common';
// import { MATERIAL_IMPORTS } from 'src/app/shared/material.imports';

// @Component({
//   selector: 'custom-landing-about',
//   standalone: true,
//   imports: [CommonModule, TranslateModule, ...MATERIAL_IMPORTS],
//   templateUrl: './custom-landing-about.component.html',
//   styleUrl: './custom-landing-about.component.scss',
// })
// export class CustomlandingAboutComponent {
//   @Input() params: { image?: string } = {};

//   constructor(private translate: TranslateService) {
//     console.log(
//       'TITLE:',
//       this.translate.instant('nde.custom.landing.about.title'),
//     );
//     console.log(
//       'DESCRIPTION:',
//       this.translate.instant('nde.custom.landing.about.description'),
//     );
//     console.log(
//       'IMAGE:',
//       this.translate.instant('nde.custom.landing.about.imageUrl'),
//     );
//   }
//   // for clickable image
//   isImageHtml(value: string): boolean {
//     if (!value) {
//       return false;
//     }

//     const lowerValue = value.toLowerCase();

//     return lowerValue.includes('<img') && lowerValue.includes('<a ');
//   }
//   // check if is an actual imageurl or text block
//   get isImageUrl(): boolean {
//     const url = this.aboutImgSrc?.trim();

//     if (!url) {
//       // alert('Not an image (empty URL)\nURL: ' + url);
//       return false;
//     }

//     try {
//       const result = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);

//       // alert(
//       //   (result ? ' Image URL detected' : ' Not an image URL') +
//       //     '\n\nURL: ' +
//       //     url,
//       // );

//       return result;
//     } catch {
//       // alert(' Error while checking URL\n\nURL: ' + url);
//       return false;
//     }
//   }
//   get title(): string {
//     return this.translate.instant('nde.custom.landing.about.title');
//   }

//   get description(): string {
//     return this.translate.instant('nde.custom.landing.about.description');
//   }

//   get aboutImgSrc(): string {
//     return this.translate.instant('nde.custom.landing.about.imageUrl');
//   }

//   private isValidValue(value: string, key: string): boolean {
//     return !!value && value !== 'NOT_DEFINED' && value !== key;
//   }

//   get showAbout(): boolean {
//     return (
//       this.isValidValue(this.title, 'nde.custom.landing.about.title') &&
//       this.isValidValue(
//         this.description,
//         'nde.custom.landing.about.description',
//       ) &&
//       this.isValidValue(this.aboutImgSrc, 'nde.custom.landing.about.imageUrl')
//     );
//   }
// }
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

  private readonly KEY_TITLE = 'nde.custom.landing.about.title';
  private readonly KEY_DESC = 'nde.custom.landing.about.description';
  private readonly KEY_IMG = 'nde.custom.landing.about.imageUrl';

  constructor(private translate: TranslateService) {}

  // for clickable image
  isImageHtml(value: string): boolean {
    if (!value) {
      return false;
    }
    const lowerValue = value.toLowerCase();
    return lowerValue.includes('<img') && lowerValue.includes('<a ');
  }

  // check if it is an actual image url or a text block
  get isImageUrl(): boolean {
    const url = this.aboutImgSrc?.trim();
    if (!url) {
      return false;
    }
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
  }

  get title(): string {
    return this.translate.instant(this.KEY_TITLE);
  }

  get description(): string {
    return this.translate.instant(this.KEY_DESC);
  }

  get aboutImgSrc(): string {
    return this.translate.instant(this.KEY_IMG);
  }

  private isValidValue(value: string, key: string): boolean {
    const v = value?.trim();
    return !!v && v !== 'NOT_DEFINED' && v !== key;
  }

  get hasTitle(): boolean {
    return this.isValidValue(this.title, this.KEY_TITLE);
  }

  get hasDescription(): boolean {
    return this.isValidValue(this.description, this.KEY_DESC);
  }

  get hasImage(): boolean {
    return this.isValidValue(this.aboutImgSrc, this.KEY_IMG);
  }

  get hasText(): boolean {
    return this.hasTitle || this.hasDescription;
  }

  // show the section if at least one part has a value
  get showAbout(): boolean {
    return this.hasText || this.hasImage;
  }
}
