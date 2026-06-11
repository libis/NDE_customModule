import { NDEComponent } from '../../decorators/nde-component.decorator';
import { Component, inject, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest, EMPTY, Observable } from "rxjs";
import { createFeatureSelector, createSelector} from "@ngrx/store";
import { filter, map } from "rxjs/operators";
import { HostBindings } from 'src/app/services/host-bindings.service'
import { Store } from "@ngrx/store";
import { TranslateService, TranslateModule} from "@ngx-translate/core";

import { IconDirective } from 'src/app/shared/directives.registry';
import { MATERIAL_IMPORTS } from 'src/app/shared/material.imports';

import { ViewConfigStateService } from '@libis/primo-shared-state';

export enum AvailabilityStatus {
  Available, Unavailable, Maybe
}


/*
 * ADDED To "View Labels" Code Table nde.separator.and with value and
 * ADDED To "View Labels" Code Table nde.consortium.institution with value and 32KUL_KUL,32KUL_LUCAWENK,32KUL_KHK,32KUL_KHL,32KUL_KATHO,32KUL_KHM 
*/

interface AlmaInstitution {
  instName: string;
  instCode: string,
  availabilityStatus: string;
}


@NDEComponent({ 
  selector: 'nde-physical-availability-line', 
  position: 'replace', 
  viewPattern: /32KUL.*/ 
})
@Component({
  selector: 'custom-physical-availability-line',
  imports: [
    CommonModule,
    TranslateModule,
    IconDirective,

    ...MATERIAL_IMPORTS

  ],
  templateUrl: './physical-availability-line.component.html',
  styleUrl: './physical-availability-line.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class PhysicalAvailabilityLineComponent {
  @Input({ required: true }) hostComponent!: any;

  // Host bindings (copied from host as passthroughs if you need them in template)
  searchResult!: any
  physicalAvailability!: string
  docDelivery!: any | undefined | null;
  availabilityPlaceholder!: Record<string, string>;
  public store = inject(Store);
  private isNgrs = false;


  public AvailabilityStatusType = AvailabilityStatus;

  getAvailabilityStatus!: (availabilityCode: string) => string;
  getAvailabilityAriaLabel!: () => Observable<string>;
  onPhysicalAvailabilityClicked!: () => any;
  physicalAvailability$!: () => Observable<any>;
  availabilityCode$!: () => Observable<any>;
  getTitle!: () => string;
  isAvailableAtOtherLocations!: (availability: string) =>  boolean
  isGlobalRapidoRecord!: () => boolean 
  isUnavailableRapidoRecord!: (availability: string) => boolean


  cfg?: any;
  prefix?: string;

  almaInstitutionsList: AlmaInstitution[] = []
  institutionsText: string = ""
  hasAvailableInInstitution = false;
  almaInstitutionsCodeFilterList = this.translate.instant("nde.consortium.institution").split(",").map( (v: string )=> v.trim()).filter(Boolean);
  positiveAvailabilityStatus = ['available_in_library', 'available_in_institution'];

  constructor(
    private translate: TranslateService,
    private HostBindings: HostBindings,
    private viewConfigState: ViewConfigStateService,
  ) {
    
    // this.isNgrs = ngrsUtil.isNgrs(); // ngrsUtil ??? ../../../../../../full-display/full-display-container/full-display-service-container/requests/get-it-other-locations/ngrs-util"
  }


  async ngOnInit() {
    console.log ("[PhysicalAvailabilityLineComponent] ngOnInit")

    const host = this.hostComponent;
    if (!host) {
      console.warn('[remote] hostComponent not provided.');
      return;
    }
    this.HostBindings.applyBindings(this, this.hostComponent);

    console.log ("[PhysicalAvailabilityLineComponent] this.viewConfigState: ", this.viewConfigState  )
    console.log ("[PhysicalAvailabilityLineComponent] this.hostComponent: ", this.hostComponent  )

    const institutions: any[] = [];
    const institutionName = await this.viewConfigState.getInstitutionName();
    const institutionCode = await this.viewConfigState.getInstitutionCode();

    
    // Add Institution of the view when available in library
    // if (this.hostComponent.physicalAvailability === 'available_in_library' && institutionName !== undefined) {
    if (this.hostComponent.physicalAvailability !== 'no_inventory' && institutionName !== undefined) {
      institutions.push( { "instName": institutionName, "availabilityStatus": this.hostComponent.physicalAvailability, "instCode": institutionCode  } );
    }
    
    // Add institution names from docDelivery

    institutions.push(
      ...this.hostComponent.docDelivery.almaInstitutionsList.map(
        (item: { instName: string; availabilityStatus: string; instCode: string }) => ({
          instName: item.instName,
          instCode: item.instCode,
          availabilityStatus: item.availabilityStatus,
          
        })
      )
    );

    // Remove duplicates and filter by almaInstitutionsCodeFilterList
    this.almaInstitutionsList = Array.from(
      new Map(
        institutions
          .filter(item =>
            this.almaInstitutionsCodeFilterList.includes(item.instCode)
          )
          .map(item => [item.instName, item])
      ).values()
    );


    this.hasAvailableInInstitution =
      this.almaInstitutionsList.some(item =>
      (
        this.positiveAvailabilityStatus.includes(item.availabilityStatus)
      )
      );


    if (this.hasAvailableInInstitution){ 
      this.hostComponent.physicalAvailability = 'available_in_institution'
    }

    // this.institutionsText = this.formatInstitutionsListToHtml(this.almaInstitutionsList);
    // this.availabilityPlaceholder['idx_1'] = this.institutionsText
  }


  /* COPY FROM host:///src/app/components/search/search-results-container/search-results/search-result-item-container/record-availability/physical-availability-line/physical-availability-line.component.ts */
  get viewModel$(): Observable<{physicalAvailability: string, availabilityCode: string}> {
    // console.log ("[PhysicalAvailabilityLineComponent] get viewModel", this);
    return combineLatest([this.physicalAvailability$(), this.availabilityCode$(), ]).pipe(
      map(([physicalAvailability, availabilityCode]) => ({
        physicalAvailability, availabilityCode
      }))
    );
  }
}
