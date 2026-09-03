import { Component, computed, inject, Input, Signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { Doc, ElectronicService, SearchStateService, stringBoolean, UserStateService, ViewConfigStateService } from '@libis/primo-shared-state';
import { selectFullDisplayRecordId, selectRecordById } from '../libis-permalink/permalink_utils.selector';
import { CommonModule } from '@angular/common';
import { NDEComponent } from 'src/app/decorators/nde-component.decorator';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { String } from 'lodash';

export interface credentialResponse {
  credentials: string;
}

@NDEComponent({selector:'nde-view-it-card', position:'bottom', viewPattern: /32KUL.*/})
@Component({
  selector: 'custom-libis-password-note',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './libis-password-note.component.html',
  styleUrl: './libis-password-note.component.scss'
})
export class LibisPasswordNoteComponent {
  @Input() private hostComponent!: any;
  private store = inject(Store);
  private electronicService!: ElectronicService;
  private recID: Signal<string|undefined> = this.store.selectSignal(selectFullDisplayRecordId);
  credentials: string = '';
  isLoading: boolean = false;
  private loggedIn = this.userState.isLoggedInSignal();
  private userJWT = this.userState.jwtSignal();
  private inst = this.viewConfigState.institutionCodeSignal();
  hasCredentials: Signal<boolean> = computed(() => {
    console.log('Verifying if credentials are needed');
    if(this.loggedIn() && /login required/i.test(this.electronicService.authNote)){
      console.log('Triggering credentials check');
    return true;
    }
    return false;
} );


  //accessInfo: string|undefined = undefined;

  constructor(
    private searchState: SearchStateService,
    private viewConfigState: ViewConfigStateService,
    private userState: UserStateService,
  private http: HttpClient) {}

  ngOnInit() {
    console.log('Starting LIBIS Password Note component');
    this.electronicService = this.hostComponent.electronicService;
    console.log('Electronic Service:', this.electronicService);
    console.log('Record ID from store:', this.recID());
  }

  // Extract MMS ID from authNote using regex pattern
  private getMmsID(): string | undefined {
    return this.electronicService.authNote.match(/(9\d+)/)?.[1] ?? undefined;
  }

  // Collect credentials - triggered by explicit button click to maximally protect credentials
  public collectCredentials(): void {
    this.isLoading = true;
    console.log('Collecting credentials for view it card:', this.hostComponent);
      const portfolioId = this.electronicService.ilsApiId;
      console.log('Portfolio ID:', portfolioId);
      const MmsID = this.getMmsID();
      console.log('Extracted MMS ID:', MmsID);
      const inst = this.inst() !== undefined ? this.inst() as string: '';
      console.log('Institution code:', inst);
      const userJWT: string = this.userJWT() !== undefined ? JSON.parse(this.userJWT() as string) : '';
      //const userJWT = sessionStorage.getItem('primoExploreJwt') || '';
      console.log('User JWT:', userJWT);

      if (MmsID){      
      const params = new HttpParams()
        .set('mmsID', MmsID)
        .set('institution', inst)
        .set('portfolioID', this.electronicService.ilsApiId);

        console.log('Constructed HTTP params:', params.toString());

      const headers = new HttpHeaders({
      Authorization: `Bearer ${userJWT}`
    });
    console.log('Constructed HTTP headers:', headers.toString());

      this.http.get(
        //LibOW Password Note link
        'https://eu-workflows.hosted.exlibrisgroup.com/PSB-19868343-9f49-454d-b9b5-84e5dba9923f/webhook/e8df7a08-a017-4ecb-84b3-0c94e4dc2767',
        //'https://eu-workflows.hosted.exlibrisgroup.com/19868343-9f49-454d-b9b5-84e5dba9923f/webhook/e8df7a08-a017-4ecb-84b3-0c94e4dc2767',
        {
          params: params,
          headers: headers
        }
      ).subscribe({
        next: (response: any) => {
          console.log('Credentials response:', response.credentials);
          console.log('Response type:', typeof response);
          this.credentials = response['credentials'];
          this.isLoading = false;
        },
        error: err => {
          console.error('Error fetching credentials:', err);
          this.isLoading = false;},
        complete: () => {
          console.log('Credential request completed')
          this.isLoading = false;
                }
  });
      } else {
        console.error('MMS ID not found in authNote:', this.electronicService.authNote);
      }
}

  // private calculateViewItInfo(primoRec:Doc){
  //   let lds45 = primoRec.pnx.display['lds45'] && primoRec.pnx.display['lds45'].length > 0 ? primoRec.pnx.display['lds45'][0] : undefined;
  //   console.log('LDS45 field value: ', lds45);
  //   if(lds45){
  //     let viewItInfo = Object.fromEntries(lds45.split('$$').filter(f => f !== '').map(f => [f[0], f.slice(1)]));
  //     console.log('View It info: ', viewItInfo);
  //   }
  //   }

  //   private translateViewItInfo(viewItInfo: { [key: string]: string }) {
  //       let translatedInfo = '';
  //       if (viewItInfo['H']) {
  //         switch (viewItInfo['H']) {
  //           case 'free_for_read':
  //             break;
  //         }
  //       }

  //       return translatedInfo;
  // }
}

