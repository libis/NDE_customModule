import { Component, inject, Input, Signal, ViewEncapsulation } from '@angular/core';
import { Store } from '@ngrx/store';
import { Doc, SearchStateService, ViewConfigStateService } from '@libis/primo-shared-state';
import {selectSearchScope } from '../libis-permalink/permalink_utils.selector';
import { LIBISPermalinkService } from './libis_permalinks_service.service';
import { NDEComponent } from 'src/app/decorators/nde-component.decorator';
import { CommonModule } from '@angular/common';
import { LibisCopytoclipboardComponent } from '../../shared/components/libis-copytoclipboard/libis-copytoclipboard.component';
//import { HostStylesService } from 'src/app/services/libis-host-styles.service';

@NDEComponent({selector:'nde-permalink-dialog', position:'replace', viewPattern: /32KUL.*/})
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
  //private hostStyles: HostStylesService
){
}

// An instance of this component is initialized each time you click on the permalink button
ngOnInit() {
  this.record = this.hostComponent.searchResults[0];
  
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
