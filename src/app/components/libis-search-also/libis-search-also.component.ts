import { Component, computed, inject, Renderer2, signal, Signal, ViewChild } from '@angular/core';
import { SearchStateService, ViewConfigStateService } from '@libis/primo-shared-state';
import { createFeatureSelector, createSelector, Store } from '@ngrx/store';
import { NDEComponent } from 'src/app/decorators/nde-component.decorator';
import { SearchParams } from '@libis/primo-shared-state'
import { LIBISSearchAlsoService, SearchAlsoLink } from './libis_searchAlso_service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

// Selectors that are not directly available from shared state
export const selectSearchState = createFeatureSelector<any>('Search');

export const selectSearchParams = createSelector(
  selectSearchState,
  (state) => state.searchParams
);

export const selectSearchMode = createSelector(
  selectSearchParams,
  searchParams => searchParams?.mode
)

@NDEComponent({selector: 'nde-search-bar-filters', position: 'top', viewPattern: /32KUL.*/})
@Component({
  selector: 'custom-libis-search-also',
  imports: [TranslateModule, MatMenuModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './libis-search-also.component.html',
  styleUrl: './libis-search-also.component.scss'
})
export class LibisSearchAlsoComponent {
private store = inject(Store);
private isLoading: boolean = true;
tooltipTest: string = "nde.permalink.copiedTooltip";

// Benodigde Primo NDE data voor search also:
// - viewCode om te checken een een link moet aangemaakt worden voor elke search also bron
// - activatie status simple versus advanced search
// - search params die nu actief zijn
private viewCode: Signal<string|undefined> = this.viewConfigState.vidSignal(); // de facto nooit undefined, want de view is ingeladen voordat je search kan uitvoeren
private searchParams: Signal<SearchParams|null> = this.searchState.searchParamsSignal();

// Calculated property to track active search mode
private advancedSearch: Signal<boolean> = computed(
  () => {
    const currentParams = this.searchParams()
    return currentParams?.mode === 'advanced'
  }
);

searchAlsoLinks: Signal<SearchAlsoLink[]> = computed(
  () => {
    console.log('Calculating search also links with view code: ', this.viewCode(), ' search params: ', this.searchParams(), ' advanced search: ', this.advancedSearch());
    return this.searchAlsoService.generateLinks(this.viewCode(), this.searchParams(), this.advancedSearch());
  }
)

constructor(private searchState: SearchStateService,
  private viewConfigState: ViewConfigStateService,
  private searchAlsoService: LIBISSearchAlsoService,
  private translate: TranslateService,
  private renderer: Renderer2) {
  console.log('Initializing Search also component');
  console.log('Current view code: ', this.viewCode());
  console.log('Current search params: ', this.searchParams());
  console.log('Current advanced search status: ', this.advancedSearch());
  console.log('Initial generated search also links: ', this.searchAlsoLinks());
}


syncMenuWidth(): void {
  console.log('Syncing search also menu width with button width');
    const source = document.querySelector('.search-also-button') as HTMLElement;
    const target = document.querySelector('.search-also-menu') as HTMLElement;

    if (source && target) {
      const width = source.offsetWidth;
      this.renderer.setStyle(target, 'width', `${width}px`);
    }
  }

}
