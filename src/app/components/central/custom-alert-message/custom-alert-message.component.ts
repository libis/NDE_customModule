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

@NDEComponent({
  selector: 'nde-header',
  position: 'bottom',
  viewPattern: /32KUL.*/,
})
@Component({
  selector: 'custom-alert-message',
  standalone: true,
  imports: [CommonModule, TranslateModule, ...MATERIAL_IMPORTS], // Included Material Imports
  templateUrl: './custom-alert-message.component.html',
  styleUrl: './custom-alert-message.component.scss',
})
export class CustomAlertMessageComponent implements AfterViewInit {
  @ViewChild('banner') banner?: ElementRef;
  @Input({ required: true }) hostComponent!: any;

  public isDismissed = false; // Added tracking to handle dismiss state
  public isLoggedIn = this.userState.isLoggedInSignal();

  constructor(
    private userState: UserStateService,
    private translate: TranslateService,
  ) {
    console.log('[CustomAlert] component constructed');
  }

  get alertMessage(): string {
    return this.translate.instant('nde.AlertMessage');
  }

  get showAlert(): boolean {
    if (this.isDismissed) return false;

    const msg = this.alertMessage;

    // Checks if the key is undefined, empty, equal to NOT_DEFINED,
    // or if ngx-translate returned the un-translated key back
    if (!msg || msg === 'NOT_DEFINED' || msg === 'nde.AlertMessage') {
      return false;
    }

    return true;
  }

  ngAfterViewInit() {
    console.log('[CustomAlert] ngAfterViewInit triggered');

    setTimeout(() => {
      this.renderBanner();
    }, 0);
  }

  dismiss() {
    console.log('[CustomAlert] dismiss clicked');
    this.isDismissed = true;

    localStorage.setItem('generalDismissed', 'true');

    if (this.banner?.nativeElement) {
      this.banner.nativeElement.remove();
    }
  }

  private renderBanner() {
    console.log('[CustomAlert] renderBanner called');
    console.log('[CustomAlert] showAlert:', this.showAlert);

    if (!this.showAlert || !this.banner) {
      console.log('[CustomAlert] banner NOT rendered (condition failed)');
      return;
    }

    const ndeHeader = document.querySelector('nde-header');

    if (!ndeHeader) {
      console.log('[CustomAlert] nde-header NOT FOUND');
      return;
    }

    const el = this.banner.nativeElement;

    if (!el._moved) {
      ndeHeader.appendChild(el);
      el._moved = true;
      console.log('[CustomAlert] banner moved to header ✅');
    }
  }
}
