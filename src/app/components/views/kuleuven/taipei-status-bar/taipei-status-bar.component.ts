import { Component, computed, inject } from '@angular/core';
import { PrimoStateService } from '@libis/primo-shared-state';
import { NDEComponent, NDE_SLOTS, NDE_POSITION } from 'src/app/decorators/nde-component.decorator';
import { lastSearch } from 'src/app/events/search-timer.event';

/**
 * Taipei demo: a status bar under the Primo header.
 *  - step 2: host state read through primo-shared-state
 *  - step 3: how long the last search took, measured by SearchTimerEvent (@NDEEvent)
 *  - step 4: an Alpine island (primo-alpine) inside the bar
 */
@NDEComponent({
  selector: NDE_SLOTS.HEADER,
  position: NDE_POSITION.AFTER,
  description: 'IGeLU Taipei demo status bar',
})
@Component({
  selector: 'custom-taipei-status-bar',
  standalone: true,
  templateUrl: './taipei-status-bar.component.html',
  styleUrls: ['./taipei-status-bar.component.scss'],
})
export class TaipeiStatusBarComponent {
  private primo = inject(PrimoStateService);

  // Signals: no subscribe, no unsubscribe, no async pipe.
  readonly vid = this.primo.config.vidSignal();
  readonly isLoggedIn = this.primo.user.isLoggedInSignal();
  readonly total = this.primo.search.totalResultsSignal();
  readonly params = this.primo.search.searchParamsSignal();
  readonly query = computed(() => this.params()?.q ?? '');
  readonly lastSearch = lastSearch;
}
