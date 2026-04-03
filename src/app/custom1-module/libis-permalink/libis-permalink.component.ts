import { Component, inject, Input } from '@angular/core';
import { createFeatureSelector, createSelector, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { FullDisplayState } from 'src/app/LIBIS_models/display_states.model';
import {SearchState} from 'src/app/LIBIS_models/display_states.model';
import { Doc } from 'src/app/Models/search.model';
import { selectPrimoView, selectSearchParams, selectSearchScope, selectViewCode } from '../LIBIS_state/LIBIS_selectors.selectors';
import { PrimoView, ViewConfigData, ViewConfigState } from 'src/app/Models/view-config.model';
import { LIBISPermalinkService } from './libis_permalinks_service.service';

//import * as limo_mappings from './permalink_map.json';

const selectFullDisplay = createFeatureSelector<FullDisplayState>('full-display');
const selectSearchState = createFeatureSelector<SearchState>('Search');
const selectFullDisplayRecordId = createSelector(
  selectFullDisplay,
  (fullDisplay: FullDisplayState) => fullDisplay?.selectedRecordId ?? null
);

export const selectFullDisplayRecord = createSelector(
  selectFullDisplayRecordId,
  selectSearchState,
  (recordId: string | null, searchState: SearchState) => recordId ? searchState.entities[recordId] : null
);

export interface PermalinkData {
  sourceSystem: string;
  sourceID: string|string[];
  recordID: string;
  sourceRecordID: string;
  lds12?: string;
}

export interface ViewParams {
  inst_code: string|undefined;
  view_code: string|undefined;
  scope_code: string|undefined;
}

@Component({
  selector: 'custom-libis-permalink',
  standalone: false,
  //imports: [],
  templateUrl: './libis-permalink.component.html',
  styleUrl: './libis-permalink.component.scss'
})
export class LibisPermalinkComponent {
@Input() private hostComponent!: any;
private store = inject(Store);
private permalinkService = inject(LIBISPermalinkService);
public permalink!: string;
public isLoading: boolean = true;

private record!: Doc;

private viewCode = this.store.selectSignal(selectViewCode);
private searchScope = this.store.selectSignal(selectSearchScope);

// An instance of this component is initialized each time you click on the permalink button
ngOnInit() {
  console.log('LIBIS permalink component - initial tryouts');
  // Collect record from the host component
  // The permalink component becomes available fairly late in the search load process and requires only data from the initial pnx-load,
  // Therefore, it is safe to assume the record will be available when this component is called. Nevertheless, a safeguard is used to ensure the method is triggered only when the record is no longer 'undefined'
  this.record = this.hostComponent.searchResults[0];
  console.log('Loaded record: ', this.record);

  console.log('Selected view code: ', this.viewCode());
  console.log('Current search scope: ', this.searchScope());
  //console.log('Limo defaults: ', this.permalinkService.getViewParams(undefined as unknown as ViewConfigData));

  if (this.record){
    try{
    // Get permalink record ID
    this.permalink = this.permalinkService.calculateLIBISPermalink(this.record, this.viewCode(), this.searchScope());}
    catch(err){ {
      console.error('Error calculating permalink:', err);
        this.permalink= this.hostComponent.permalink;
    }
  }
} else {
        this.permalink= this.hostComponent.permalink;
    }
}
}
