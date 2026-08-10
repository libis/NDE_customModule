import { NDEComponent } from 'src/app/decorators/nde-component.decorator';
import {
  Component,
  computed,
  inject,
  Input,
  signal,
  Signal,
  effect
} from '@angular/core';
import { createFeatureSelector, createSelector, Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LIBISOpeningHoursService } from './libis-opening-hours.service';
import { Location, ViewConfigState } from '@libis/primo-shared-state';
import { MatIconModule } from '@angular/material/icon';
import { selectCurrentLanguage } from '../libis-permalink/permalink_utils.selector';
import { AssetsPublicPathDirective } from 'src/app/services/assets-public-path.directive';
import {
  ContactDetails,
  OpeningHoursOverview,
  WEEKDAYS,
} from './libis-opening-hours-models.model';

export const selectViewConfig =
  createFeatureSelector<ViewConfigState>('viewConfig');

export const selectViewDefaultLang = createSelector(
  selectViewConfig,
  (state: ViewConfigState) =>
    state.config?.['primo-view']['attributes-map'].interfaceLanguage,
);

@NDEComponent({
  selector: 'nde-location',
  position: 'bottom',
  viewPattern: /332KUL_KUL.*/,
})
@Component({
  selector: 'custom-libis-opening-hours',
  imports: [
    CommonModule,
    TranslateModule,
    MatIconModule/*,
    AssetsPublicPathDirective*/,
  ],
  templateUrl: './libis-opening-hours.component.html',
  styleUrl: './libis-opening-hours.component.scss',
})
export class LibisOpeningHoursComponent {
  @Input() private hostComponent!: any;
  private store = inject(Store);
  private location!: Location;

  test = computed(() => {
console.log('test computed', this.lang_code());
return this.lang_code();
});

  weekdays: Signal<string[]> = computed(() => {
    const curr_lang = this.lang_code();
    const def_lang = this.default_lang();

    if (curr_lang in WEEKDAYS) {
      return [...WEEKDAYS[curr_lang as keyof typeof WEEKDAYS]];
    } else if (def_lang in WEEKDAYS) {
      return [...WEEKDAYS[def_lang as keyof typeof WEEKDAYS]];
    } else {
      return [
        'sun',
        'mon',
        'tue',
        'wed',
        'thu',
        'fri',
        'sat',
      ];
    }
  });

  show_info_card: boolean = false;
  opening_hours = signal<OpeningHoursOverview | undefined>(undefined);
  lang_code: Signal<string> = this.store.selectSignal(selectCurrentLanguage);
  view_default_lang: Signal<string | undefined> = this.store.selectSignal(
    selectViewDefaultLang,
  );
  default_lang: Signal<string> = computed(
    () =>
      this.view_default_lang() ??
      this.openingHoursService.getOpeningHoursDefaultLang(),
  );
  contact_details: Signal<ContactDetails | undefined> = computed(() => {
    console.log('Change detection on Opening Hours data or language. Recalculating contactdetails');
    const OH_data = this.opening_hours();
    const curr_lang = this.lang_code();
    const def_lang = this.default_lang();
    if (OH_data === undefined) {
      return undefined;
    } else {
      return this.openingHoursService.translateContactDetails(
        OH_data,
        curr_lang,
        def_lang,
      );
    }
  });

  toNum(weekday: string){
    return Number(weekday);
  }

  toggle_info_card(){
    console.log('Toggling info card parameter');
    this.show_info_card = !this.show_info_card;
    console.log('New value for show_info_card:  ', this.show_info_card);
  }

  parse_status_change(timing: Date){
    return `${timing.getHours().toString().padStart(2,'0')}:${timing.getMinutes().toString().padStart(2,'0')}`;
  }

  constructor(private openingHoursService: LIBISOpeningHoursService) {}

  ngOnInit() {
    this.location = this.hostComponent.location;
    console.log('Starting LIBIS Opening Hours component');
    console.log('Host data:', this.hostComponent);
    console.log('Library codes from host component:', this.location);

    this.openingHoursService
      .getOpeningHours(this.location.organization, this.location.libraryCode)
      .subscribe({
        next: (response) => {
          console.log('Opening hours response:', response);
          this.opening_hours.set(response);
        },
        error: (error) => {
          console.error('Error fetching opening hours:', error);
        },
      });
  }



}
