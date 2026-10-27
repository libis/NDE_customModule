import { NDEComponent } from 'src/app/decorators/nde-component.decorator';
import { Component, Input } from '@angular/core';
import {LibisExtAccessInfoComponent} from '../libis-ext-access-info/libis-ext-access-info.component';
import {LibisPasswordNoteComponent} from '../libis-password-note/libis-password-note.component';

@NDEComponent({ selector: 'nde-view-it-card', position: 'bottom', viewPattern: /32KUL.*/ })
@Component({
  selector: 'custom-libis-view-it-extra',
  imports: [
    LibisExtAccessInfoComponent,
    LibisPasswordNoteComponent
  ],
  templateUrl: './libis-view-it-extra.component.html',
  styleUrl: './libis-view-it-extra.component.scss'
})
export class LibisViewItExtraComponent {
  @Input() protected readonly hostComponent!: any;

}
