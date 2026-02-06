import { Component } from '@angular/core';
import { NDE_SLOTS, NDE_POSITION, NDEComponent } from 'src/app/decorators/nde-component.decorator';


@NDEComponent({ selector: NDE_SLOTS.TOP_BAR, position: NDE_POSITION.AFTER })
@Component({
  selector: 'custom-search-stats',
  standalone: true,
  imports: [],
  templateUrl: './search-stats.component.html',
  styleUrls: ['./search-stats.component.scss']
})
export class SearchStatsComponent {

}
