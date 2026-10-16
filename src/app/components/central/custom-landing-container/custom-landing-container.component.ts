import { NDEComponent } from 'src/app/decorators/nde-component.decorator';
import {
  Component,
  Input,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewInit,
  inject,
} from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { MATERIAL_IMPORTS } from 'src/app/shared/material.imports'; // Added Material Imports
import { CustomlandingAboutComponent } from '../custom-landing-about/custom-landing-about.component';
import { CustomLandingBlocksComponent } from '../custom-landing-blocks/custom-landing-blocks.component';
import { CustomLandingQuickLinksComponent } from '../custom-landing-quick-links/custom-landing-quick-links.component';
import { CustomLandingBackgroundImageComponent } from '../custom-landing-background-image/custom-landing-background-image.component';
import { LIBISProgressSpinnerComponent } from 'src/app/shared/components/libis-progress-spinner/libis-progress-spinner.component';
import { LibisLoadingOverlayService } from 'src/app/services/libis-loading-overlay.service';

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
    CustomLandingQuickLinksComponent,
    CustomLandingBackgroundImageComponent,
    //LIBISProgressSpinnerComponent,
  ], // other custom landing components also
  templateUrl: './custom-landing-container.component.html',
  styleUrl: './custom-landing-container.component.scss',
})
export class CustomLandingContainerComponent implements OnInit {
  @Input({ required: true }) hostComponent!: any;

  public isLoading = true;

  private overlay = inject(LibisLoadingOverlayService);
  ngOnInit(): void {}

  constructor() {
    this.overlay.hold('landing-background');
  }

  onBackgroundApplied(): void {
    console.log('[LandingContainer] Background applied');
    this.isLoading = false;
    this.overlay.release('landing-background');
  }

  ngOnDestroy(): void {
    this.overlay.release('landing-background');
  }
}
