import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NDE_SLOTS, NDE_POSITION, NDEComponent } from 'src/app/decorators/nde-component.decorator';
import { SearchStateService } from '@libis/primo-shared-state';

@NDEComponent({ selector: NDE_SLOTS.HEADER, position: NDE_POSITION.BEFORE })
@Component({
  selector: 'custom-search-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './search-stats.component.html',
  styleUrls: ['./search-stats.component.scss']
})
export class SearchStatsComponent {
  docs$ = this.searchState.selectAllDocs$();
  totalResults$ = this.searchState.selectTotalResults$();
  isLoading$ = this.searchState.selectIsLoading$();
  status$ = this.searchState.selectSearchStatus$();
  searchParams$ = this.searchState.selectSearchParams$();
  metaData$ = this.searchState.selectSearchMetaData$();

  constructor(private searchState: SearchStateService) {}
}
