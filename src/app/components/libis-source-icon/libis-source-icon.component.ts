import { Component, Input } from '@angular/core';
import { NDEComponent } from 'src/app/decorators/nde-component.decorator';
import { MatIconModule } from '@angular/material/icon';
import {MatDividerModule} from '@angular/material/divider';
import { Doc } from '@libis/primo-shared-state';

@NDEComponent({selector: 'nde-record-indications', position: 'bottom', viewPattern: /^(?!32KUL_KUL:Lirias)/})
@Component({
  selector: 'custom-libis-source-icon',
  imports: [MatIconModule, MatDividerModule],
  templateUrl: './libis-source-icon.component.html',
  styleUrl: './libis-source-icon.component.scss'
})
export class LibisSourceIconComponent {
@Input() private hostComponent!: any;

ngOnInit() {
  console.log('Initializing source icon component with host component: ', this.hostComponent);
}

get liriasRec(): boolean {
  if (this.hostComponent.display.source){
      return (this.hostComponent.display?.source ?? []).filter((id: string) => new RegExp('^lirias', 'i').test(id) === true).length > 0;
}
return false;
}
}
