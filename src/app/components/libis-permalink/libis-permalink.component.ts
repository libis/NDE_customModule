import { Component, inject, Input, Signal, ViewEncapsulation } from '@angular/core';
import { Store } from '@ngrx/store';
import { Doc } from '@libis/primo-shared-state';
import {selectSearchScope } from '../libis-permalink/permalink_utils.selector';
import { LIBISPermalinkService } from './libis_permalinks_service.service';
import { NDEComponent } from 'src/app/decorators/nde-component.decorator';
import { SearchStateService, ViewConfigStateService } from '@libis/primo-shared-state';
import { CommonModule } from '@angular/common';
import { LibisCopytoclipboardComponent } from '../../shared/libis-copytoclipboard/libis-copytoclipboard.component';
import { HostStylesService } from 'src/app/services/libis-host-styles.service';



@NDEComponent({selector:'nde-permalink-dialog', position:'after', viewPattern: /32KUL.*/})
@Component({
  selector: 'libis-permalink',
  standalone: true,
  imports: [CommonModule, LibisCopytoclipboardComponent],
  templateUrl: './libis-permalink.component.html',
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: './libis-permalink.component.scss'
})
export class LibisPermalinkComponent {
@Input() private hostComponent!: any;
private store = inject(Store);
private permalinkService = inject(LIBISPermalinkService);
public permalink!: string;
public isLoading: boolean = true;

private record!: Doc;

private viewCode: Signal<string|undefined> = this.viewConfigState.vidSignal();
private searchScope = this.store.selectSignal(selectSearchScope);

constructor(
  private viewConfigState: ViewConfigStateService,
  private searchState: SearchStateService,
  private hostStyles: HostStylesService
){
  //console.log('Initialized permalink component with view code: ', this.viewCode());
  //console.log('Initialized permalink component with search scope: ', this.searchScope());
}

// An instance of this component is initialized each time you click on the permalink button
ngOnInit() {
  //console.log('LIBIS permalink component - initial tryouts');

  // console.log('Applying host styles to permalink component');
  // this.hostStyles.initializeHostStyles();
  // console.log('Finished applying host styles to permalink component');


  // Collect record from the host component
  // The permalink component becomes available fairly late in the search load process and requires only data from the initial pnx-load,
  // Therefore, it is safe to assume the record will be available when this component is called. Nevertheless, a safeguard is used to ensure the method is triggered only when the record is no longer 'undefined'
  this.record = this.hostComponent.searchResults[0];
  //console.log('Loaded record: ', this.record);

  //console.log('Selected view code: ', this.viewCode());
  //console.log('Current search scope: ', this.searchScope());
  //console.log('Limo defaults: ', this.permalinkService.getViewParams(undefined as unknown as ViewConfigData));

  if (this.record){
    try{
    // Get permalink record ID
    this.permalink = this.permalinkService.calculateLIBISPermalink(this.record, this.viewCode(), this.searchScope());
  this.isLoading = false;}
    catch(err){ {
      console.error('Error calculating permalink:', err);
        this.permalink= this.hostComponent.permalink;
    }
  }
} else {
        this.permalink= this.hostComponent.permalink;
    }
}

public sendAnalytics() {
  console.log('Sending analytics event for permalink copy');
  this.hostComponent.sendAnalytics();
}

}
