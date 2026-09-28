import { NDEComponent } from 'src/app/decorators/nde-component.decorator';
import {
  Component,
  Input,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { UserStateService } from '@libis/primo-shared-state';
import { MATERIAL_IMPORTS } from 'src/app/shared/material.imports'; // Added Material Imports
import { CustomlandingAboutComponent } from '../custom-landing-about/custom-landing-about.component';
import { CustomLandingBlocksComponent } from '../custom-landing-blocks/custom-landing-blocks.component';
import { CustomLandingQuickLinksComponent } from '../custom-landing-quick-links/custom-landing-quick-links.component';

@NDEComponent({
  selector: 'nde-landing-page',
  position: 'replace',
  viewPattern: /32KUL.*/,
})
@Component({
  selector: 'custom-landing-container',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ...MATERIAL_IMPORTS,
    CustomlandingAboutComponent,
    CustomLandingBlocksComponent,
    CustomLandingQuickLinksComponent
  ], // other custom landing components also
  templateUrl: './custom-landing-container.component.html',
  styleUrl: './custom-landing-container.component.scss',
})
export class CustomLandingContainerComponent  implements OnInit  {
  @Input({ required: true }) hostComponent!: any;


  ngOnInit(): void {
      console.log ( "[CustomLandingContainerComponent] this.hostComponent", this.hostComponent);
  }
}
