import { Component } from '@angular/core';
import { NDE_SLOTS, NDEComponent } from 'src/app/decorators/nde-component.decorator';


@NDEComponent({ selector: NDE_SLOTS.LOGO, position: 'after' })
@Component({
  selector: 'custom-search-stats',
  standalone: true,
  imports: [],
  templateUrl: './search-stats.component.html',
  styleUrls: ['./search-stats.component.scss']
})
export class SearchStatsComponent {

}
