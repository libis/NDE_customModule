import { NDEComponent } from '../../decorators/nde-component.decorator';
import {
  Component,
  Input,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  effect,
} from '@angular/core';

import { CommonModule, DecimalPipe } from '@angular/common';
import { UserStateService } from '@libis/primo-shared-state';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { MATERIAL_IMPORTS } from 'src/app/shared/material.imports';
import { Subscription } from 'rxjs';

@NDEComponent({
  selector: 'nde-header',
  position: 'bottom',
  viewPattern: /32KUL.*/,
})
@Component({
  selector: 'custom-alert-message',
  standalone: true,
  imports: [CommonModule, TranslateModule, ...MATERIAL_IMPORTS],
  templateUrl: './custom-alert-message.component.html',
  styleUrl: './custom-alert-message.component.scss',
  providers: [DecimalPipe],
})
export class CustomAlertMessageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('generalBanner') generalBanner?: ElementRef;
  @ViewChild('finesBanner') finesBanner?: ElementRef;

  @Input({ required: true }) hostComponent!: any;

  // --- general alert state ---
  private generalDismissed = false;

  // --- fines state ---
  private finesDismissed = false;
  private counters?: Subscription;
  public finesValue = 0;
  public finesString = '';

  public isLoggedIn = this.userState.isLoggedInSignal();

  private viewInitialized = false;

  constructor(
    private userState: UserStateService,
    private translate: TranslateService,
    private decimalPipe: DecimalPipe,
  ) {
    effect(() => {
      if (this.isLoggedIn() && this.viewInitialized) {
        this.waitForAccountService();
      }
    });
  }

  // --- computed visibility ---

  get showGeneralAlert(): boolean {
    return !this.generalDismissed;
  }

  get showFinesBanner(): boolean {
    return this.isLoggedIn() && !this.finesDismissed && this.finesValue > 0;
  }

  // --- lifecycle ---

  ngAfterViewInit() {
    this.viewInitialized = true;
    setTimeout(() => {
      this.renderBanners();
      if (this.isLoggedIn()) {
        this.waitForAccountService();
      }
    });
  }

  ngOnDestroy() {
    this.counters?.unsubscribe();
  }

  // --- actions ---

  dismissGeneral() {
    this.generalDismissed = true;
    this.generalBanner?.nativeElement?.remove();
  }

  dismissFines() {
    this.finesDismissed = true;
    this.finesBanner?.nativeElement?.remove();
  }

  async payFines() {
    const webhookUrl =
      'https://eu-workflows.hosted.exlibrisgroup.com/19868343-9f49-454d-b9b5-84e5dba9923f/webhook-test/a027a91c-6603-49b1-b35b-87d70efc4bfb';

    const token = await this.userState.getJwt();
    if (!token) {
      console.error('[CustomAlert] No JWT found');
      return;
    }

    fetch(webhookUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.url) window.location.href = data.url;
      })
      .catch((err) => console.error('[CustomAlert] Webhook call failed:', err));
  }

  // --- private ---

  private waitForAccountService(attempts = 0) {
    const accountService = this.hostComponent?.userAreaService?.accountService;

    if (accountService) {
      this.loadFines();
      return;
    }

    if (attempts >= 10) {
      console.warn(
        '[CustomAlert] accountService never became available, giving up',
      );
      return;
    }

    console.log(
      `[CustomAlert] accountService not ready, retrying... (attempt ${attempts + 1})`,
    );
    setTimeout(() => this.waitForAccountService(attempts + 1), 500);
  }

  private loadFines() {
    const accountService = this.hostComponent?.userAreaService?.accountService;

    console.log(
      '[CustomAlert] loadFines called, accountService:',
      accountService,
    );

    if (!accountService) return;

    this.counters = accountService.makeIlsRequest('counters', {}).subscribe({
      next: (res: any) => {
        console.log('[CustomAlert] counters response:', res.data);
        const actionList = res.data?.listofactions?.action;
        console.log('[CustomAlert] actionList:', actionList);

        if (!actionList) return;

        const finesAction = actionList.find((a: any) => a.type === 'Fines');
        console.log('[CustomAlert] finesAction:', finesAction);

        this.finesValue = parseFloat(finesAction?.value ?? '0');
        console.log('[CustomAlert] finesValue:', this.finesValue);

        if (this.finesValue > 0) {
          const template: string = this.translate.instant('fines.banner');
          const formatted =
            this.decimalPipe.transform(this.finesValue, '1.2-2') ?? '';
          this.finesString = template.replace('{{idx_1}}', formatted);

          setTimeout(() => this.renderBanners());
        }
      },
      error: (err: any) => console.error('[CustomAlert] counters error:', err),
    });
  }

  private renderBanners() {
    const ndeHeader = document.querySelector('nde-header');
    if (!ndeHeader) return;

    for (const ref of [this.generalBanner, this.finesBanner]) {
      const el = ref?.nativeElement;
      if (el && !el._moved) {
        ndeHeader.appendChild(el);
        el._moved = true;
      }
    }
  }
}
