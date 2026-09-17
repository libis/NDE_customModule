import { NDEComponent } from 'src/app/decorators/nde-component.decorator';
import {
  Component,
  Input,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { UserStateService } from '@libis/primo-shared-state';
import { MATERIAL_IMPORTS } from 'src/app/shared/material.imports'; // Added Material Imports
import { CustomlandingAboutComponent } from '../custom-landing-about/custom-landing-about.component';

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
  ], // other custom landing components also
  templateUrl: './custom-landing-container.component.html',
  styleUrl: './custom-landing-container.component.scss',
})
export class CustomLandingContainerComponent {}
