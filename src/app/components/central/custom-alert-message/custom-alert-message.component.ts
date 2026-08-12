import { NDEComponent } from 'src/app/decorators/nde-component.decorator';
import {
  Component,
  Input,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { UserStateService } from '@libis/primo-shared-state';

@NDEComponent({
  selector: 'nde-header',
  position: 'bottom',
  viewPattern: /32KUL.*/,
})
@Component({
  selector: 'custom-alert-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custom-alert-message.component.html',
  styleUrl: './custom-alert-message.component.scss',
})
export class CustomAlertMessageComponent implements AfterViewInit {
  @ViewChild('banner') banner?: ElementRef;
  @Input({ required: true }) hostComponent!: any;

  public isLoggedIn = this.userState.isLoggedInSignal();

  constructor(private userState: UserStateService) {
    console.log('[CustomAlert] component constructed');
  }

  // ✅ TEMP: force TRUE to verify rendering
  get showAlert(): boolean {
    const finesDismissed = localStorage.getItem('finesDismissed') === 'true';

    // console.log('[CustomAlert] isLoggedIn:', this.isLoggedIn());
    // console.log('[CustomAlert] finesDismissed:', finesDismissed);

    // 👉 TEST MODE (forces display)
    // return true;

    // ✅ later switch back to:
    
    if (!this.isLoggedIn()) return true;
    return finesDismissed;
    
  }

  ngAfterViewInit() {
    console.log('[CustomAlert] ngAfterViewInit triggered');

    setTimeout(() => {
      this.renderBanner();
    }, 0);
  }

  dismiss() {
    console.log('[CustomAlert] dismiss clicked');

    localStorage.setItem('generalDismissed', 'true');

    if (this.banner?.nativeElement) {
      this.banner.nativeElement.remove();
    }
  }

  private renderBanner() {
    console.log('[CustomAlert] renderBanner called');
    console.log('[CustomAlert] showAlert:', this.showAlert);
    console.log('[CustomAlert] banner ref:', this.banner);

    if (!this.showAlert || !this.banner) {
      console.log('[CustomAlert] banner NOT rendered (condition failed)');
      return;
    }

    const ndeHeader = document.querySelector('nde-header');

    console.log('[CustomAlert] nde-header:', ndeHeader);

    if (!ndeHeader) {
      console.log('[CustomAlert] nde-header NOT FOUND');
      return;
    }

    const el = this.banner.nativeElement;

    console.log('[CustomAlert] moving banner element', el);

    if (!el._moved) {
      ndeHeader.appendChild(el);
      el._moved = true;
      console.log('[CustomAlert] banner moved to header ✅');
    }
  }
}
