import { NDEComponent } from 'src/app/decorators/nde-component.decorator';
import { Component, computed, inject, Input, Signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { Doc, ElectronicService, Info } from '@libis/primo-shared-state/dist/models/search.model';
import { selectFullDisplayRecordId, selectRecordById } from '../libis-permalink/permalink_utils.selector';
import { HttpClient } from '@angular/common/http';
import { PrimoStateService } from '@libis/primo-shared-state/dist/state/primo-state.service';

export interface AccessInfo {
  [key: string]: Infoset;
}

export interface Infoset {
  U:string,
  D?:string,
  H?:string
}

export interface AccessDisplay {
  source_name: string;
  source_icon?: string;
  display_label: string;
}

export const EXTERNAL_RECORDS = [
  'Lirias_basic',
  'Lirias_NDE'
]

@Component({
  selector: 'custom-libis-ext-access-info',
  imports: [],
  templateUrl: './libis-ext-access-info.component.html',
  styleUrl: './libis-ext-access-info.component.scss'
})
export class LibisExtAccessInfoComponent {
 @Input() hostComponent!: any;
  private store = inject(Store);
  private electronicService!: ElectronicService;
  private recID: Signal<string|undefined> = this.store.selectSignal(selectFullDisplayRecordId);
  private bibRec: Signal<Doc|undefined> = computed(() => {
    const currId = this.recID();
    if(currId){
      return this.store.selectSignal(selectRecordById(currId))();
    }
    return undefined;
  })
  private extRec: Signal<Boolean> = computed(() => {
    const currRec = this.bibRec();
    if(currRec){
      for(const source of EXTERNAL_RECORDS){
        if(currRec.pnx.display['source'].includes(source)){
          return true
        }
      }
    }
    return false
  })
  private rec_access_info: Signal<AccessInfo> = computed(() => {
    const currRec = this.bibRec();
    const currExt = this.extRec();
    if(currRec && currExt){
      return this.parse_access_info(currRec);
    }
    return {};
  })
  curr_access_info: Signal<AccessDisplay|undefined> = computed(() => {
    const all_access_info = this.rec_access_info();
    const currExt = this.extRec();
    const currRec = this.bibRec();
    //console.log('Calculating current access info based on infoset: ', all_access_info);
    //console.log('Current serviceURL: ', this.electronicService.serviceUrl);
    if((currExt) && (this.electronicService.serviceUrl.trim() in all_access_info)){
      console.log('Matching access info found');
      return this.calc_curr_access_info(all_access_info[this.electronicService.serviceUrl], currRec);
    }  
  return undefined;
})

constructor() {}

  ngOnInit() {
    console.log('Starting LIBIS External access info component');
    console.log('Ext info host component: ', this.hostComponent);
    this.electronicService = this.hostComponent.electronicService;
    console.log('Electronic Service:', this.electronicService);
    console.log('Record ID from store:', this.recID());
    console.log('Bib Record from store:', this.bibRec());
    console.log('Record info set: ', this.rec_access_info());
    console.log('Current access info: ', this.curr_access_info());
  }

  parse_access_info(bibRec: Doc): AccessInfo {
    const pnx = bibRec.pnx.display;
    // Parse extra info from lds45 (links hack)
    if(pnx['lds45'] && pnx['lds45'].length > 0){
      const access_list: AccessInfo = {};

      pnx['lds45'].forEach((access_entry: string) => {
        const field_set = Object.fromEntries(access_entry.split('$$')
        .filter(elem => elem !== '')
        .map(elem => [elem[0], elem.slice(1).trim()])
      ) as unknown as Infoset;
      
      access_list[field_set['U']] = field_set;
        })

      return access_list;
    }
    return {}
  }

  calc_curr_access_info(info:Infoset, currRec:Doc|undefined): AccessDisplay {
    let currAcces: AccessDisplay = {
      source_name: 'External site',
      display_label: ''
    }

    // Check info source
    switch(true){
    // Lirias records in general catalogue
      case info.U.startsWith('https://lirias.kuleuven.be'):
        currAcces.source_name = 'Lirias';
        currAcces.source_icon = 'https://assets.libis.be/lirias.png'
    }

    // Add display_label
    if(info['D']){
      currAcces['display_label'] = info['D'];
    }

    return currAcces;
  }
  
}
