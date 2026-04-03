import { HttpClient } from '@angular/common/http';
import {
  EnvironmentInjector,
  inject,
  Injectable,
  Injector,
} from '@angular/core';
import { PrimoView, ViewConfigState } from 'src/app/Models/view-config.model';
import limo_map from '../LIBIS_assets/permalink_map.json';
import { Doc, SearchState, Sourcesystem } from 'src/app/Models/search.model';
import { selectCurrentLanguage } from '../LIBIS_state/LIBIS_selectors.selectors';
import { Store } from '@ngrx/store';

export class ViewParams {
  constructor(
    public instCode: string,
    public viewCode: string,
    public scopeCode: string,
  ) {}
}

export interface libViewMap {
  inst: string;
  views: { [key: string]: libScopeMap };
}

export interface libScopeMap {
  code: string;
  scopes: { [key: string]: string };
}

@Injectable({
  providedIn: 'root',
})
export class LIBISPermalinkService {
  // Transform Limo-map to an object < standard json import loads it as a module
  private limo_map: { [key: string]: libViewMap } = limo_map.limo_map as {
    [key: string]: libViewMap;
  };
  private store = inject(Store);

  constructor(/*private http:HttpClient*/) {
    //console.log('HttpClient provider:', this.envInjector.get(HttpClient, null));
    console.log('Initializing LIBIS permalink service');
    console.log('Mapping for LIMO permalinks: ', this.limo_map);
    console.log('LIMO permalinks service ready for service');
  }

  public calculateLIBISPermalink(
    primoRecord: Doc,
    primoView: string|undefined,
    primoScope: string|undefined,
  ): string {
    let sourceSys: string[] = primoRecord.pnx.control.sourcesystem;
    let sourceID =
      typeof primoRecord.pnx.control.sourceid === 'string'
        ? [primoRecord.pnx.control.sourceid]
        : primoRecord.pnx.control.sourceid;
    let lang_code = this.store.selectSignal(selectCurrentLanguage);
    let permalinkID = this.getPermalinkID(primoRecord, sourceSys, sourceID);
    console.log('Calculated permalinkID: ', permalinkID)

    // Calculate permalink - method varies for Lirias and LIBIS permalinks
    if (sourceSys.includes('Webhook') && sourceID.includes('lirias')) {
      return `https://lirias.kuleuven.be/${permalinkID}?lang=${lang_code()}`;
    }
    else{
      return `https://lib.is/${permalinkID}/representation?libis=${this.getLibisViewParam(primoView, primoScope)}&lang=${lang_code()}`;
    }
  }

  public getPermalinkID(primoRecord: Doc, sourceSys: string[], sourceID: string[]): string {

    try {
      // Settings for webhook views - currently all are equipped with support for original ID in lds12
      if (sourceSys.includes('Webhook')) {
        return primoRecord.pnx.display['lds12'][0];
      }
      // All other source systems
      else {
        // All Alma records managed via LIBISnet Alma environments are equipped with lds12 via display normalization
        // This includes: LIBISnet NZ records, LIBISnet IZ records, and CZ records imported into LIBISnet IZ
        if (sourceID.includes('alma')) {
          return primoRecord.pnx.display['lds12'][0];
        }
        // Cdi record will have a different source ID
        else {
          return primoRecord.pnx.control.recordid[0];
        }
      }
    } catch {
      return primoRecord.pnx.control.recordid[0];
    }
  }

  public getLibisViewParam(primoView: string|undefined, primoScope: string|undefined): string {  
    // Initialize parameters to default
    let instCode = 'default';
    let viewCode = 'default';
    let scopeCode = 'default';

    // Recalculate instCode and viewCode
    if(primoView !== undefined){

      let splitCodes = primoView.split(':');

      if (splitCodes[0] in this.limo_map){
        instCode = splitCodes[0]

        if(splitCodes[1] && splitCodes[1] in this.limo_map[instCode]['views']){
          viewCode = splitCodes[1]
        }
      }

      if (scopeCode !== undefined && scopeCode in this.limo_map[instCode]['views'][viewCode]['scopes']){
        scopeCode = scopeCode;
      }
    }

    return `${this.limo_map[instCode]['inst']}:${this.limo_map[instCode]['views'][viewCode]['code']}:${this.limo_map[instCode]['views'][viewCode]['scopes'][scopeCode]}`;
  }
}
