
/* 
  Aanmelden is niet voldoende om de 'fines' op te halen en in de state op te slaan
  @libis/primo-shared-state zal dus geen fines kunnen ophalen zolang er niet is genavigeerd naar account/overview
  
  Fines kunnen wel worden opgehaald via hostComponent
  subscribe to this.hostComponent?.userAreaService?.accountService.makeIlsRequest()

  Of via dispatch maar in de shared state staat !!!
  * ACTIONS INTENTIONALLY NOT EXPORTED (unsafe for remote dispatch):
  * - All [Account] Start * actions — trigger HTTP calls to ILS

  this.hostComponent.store.dispatch({
    type: '[Account] Start Get Account Counters For Menu First Section',
    path: '/account/overview'
  });

*/

import { NDEComponent } from '../../decorators/nde-component.decorator';
import { Component, OnInit, Input, effect, OnDestroy , ElementRef, ViewChild } from '@angular/core';


import { CommonModule, DecimalPipe  } from '@angular/common';
import { UserStateService  } from '@libis/primo-shared-state';
import { TranslateService, TranslateModule} from "@ngx-translate/core";
import { MATERIAL_IMPORTS } from 'src/app/shared/material.imports';

import { Subscription } from 'rxjs';

interface CounterAction {
  type: string;
  value: string;
}

@NDEComponent({ 
  selector: 'nde-user-area',  
  position: 'after',   
  viewPattern: /32KUL.*/ 
})
@Component({
  selector: 'custom-pay-fines',
  imports: [CommonModule, TranslateModule, ...MATERIAL_IMPORTS],
  templateUrl: './pay-fines-banner.component.html',
  styleUrl: './pay-fines-banner.component.scss',
  providers: [DecimalPipe]  
})
export class PayFinesComponent implements OnDestroy {

  @ViewChild('banner') banner?: ElementRef;

  private counters?: Subscription;
  public amountOfFines?: CounterAction;
  public finesValue = 0;
  public finesString = ""
  
  public isLoggedIn = this.userState.isLoggedInSignal();
  
  private loadFines() {

    const accountService = this.hostComponent?.userAreaService?.accountService;

    if (!accountService) return;
    this.counters = accountService.makeIlsRequest('counters', {}).subscribe({
      next: (res: any) => {
        console.log('[PayFinesComponent : ngOnInit ] counters:', res.data);
        let actiontList = res.data?.listofactions?.action  
        console.log('[PayFinesComponent : ngOnInit ] actiontList:', actiontList);
        if (actiontList) {
          this.amountOfFines = actiontList.find( (a: any) => a.type === "Fines");
          
          this.finesValue = parseFloat(this.amountOfFines?.value ?? '0');
          if (this.finesValue > 0) {
            console.log(
              "%cFines:%c User has %c"+ this.amountOfFines?.value + " %cfines",
              "color: red; font-weight: bold;",
              "color: initial';",
              "color: red;",
              "color: initial';"
            );
          }

          let finesString: string = this.translate.instant("fines.banner");
          const formatted = this.decimalPipe.transform(this.finesValue, '1.2-2') ?? '';

          this.finesString = finesString.replace('{{idx_1}}', formatted);

          setTimeout(() => this.renderBanner()); 
        }       
      },
      error: (err: any) => console.error('counters error:', err),
    });
  }


  @Input({ required: true }) hostComponent!: any;

  constructor(
    private userState: UserStateService,
  
    private translate: TranslateService,  
    private decimalPipe: DecimalPipe
    
  ) {
    effect(() => {
      if (this.isLoggedIn()) {
        console.log('[PayFinesComponent : constructor ] loggin effect');
        this.loadFines();
      }
    });
  }
  


  get hasFines(): boolean {
    return this.finesValue > 0;
  }

  ngOnDestroy() {
    this.counters?.unsubscribe();
  }

  private renderBanner() {
    if (!this.hasFines || !this.banner) return;

    const ndeHeader = document.querySelector('nde-header');
    if (!ndeHeader) return;

    const el = this.banner.nativeElement;

    console.log (ndeHeader)
    console.log (el)

    if (!el._moved) {
      ndeHeader.appendChild(el);
      el._moved = true;
    }
  }


}
