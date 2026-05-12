import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NDE_SLOTS, NDE_POSITION, NDEComponent } from 'src/app/decorators/nde-component.decorator';
import { SearchStateService } from '@libis/primo-shared-state';
import { AnalyticsService } from '../../services/analytics.service';

@NDEComponent(
  { 
    selector: NDE_SLOTS.HEADER, 
    position: NDE_POSITION.BEFORE,
    viewPattern: /DISABLED_32KUL.*/
})
@Component({
    selector: 'custom-search-stats',
    imports: [CommonModule],
    templateUrl: './search-stats.component.html',
    styleUrls: ['./search-stats.component.scss'],
    standalone: true
})
export class SearchStatsComponent {
  docs$ = this.searchState.selectAllDocs$();
  totalResults$ = this.searchState.selectTotalResults$();
  isLoading$ = this.searchState.selectIsLoading$();
  status$ = this.searchState.selectSearchStatus$();
  searchParams$ = this.searchState.selectSearchParams$();
  metaData$ = this.searchState.selectSearchMetaData$();

  constructor(
    private searchState: SearchStateService,
    private analyticsService: AnalyticsService,
    private http: HttpClient
  ) {}

  get eventCount(): number {
    return this.analyticsService.getEvents().length;
  }

  printEvents(): void {
    console.log('[AnalyticsEvents]', this.analyticsService.getEvents());
  }

  testPing(): void {
    this.http.get('https://jsonplaceholder.typicode.com/posts/1').subscribe({
      next: (res) => console.log('[TestPing] Response:', res),
      error: (err) => console.error('[TestPing] Error:', err)
    });
  }
}
