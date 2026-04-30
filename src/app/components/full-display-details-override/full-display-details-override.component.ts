import { NDEComponent } from '../../decorators/nde-component.decorator';
import { Component, OnInit, Input, CUSTOM_ELEMENTS_SCHEMA, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HostBindings } from 'src/app/services/host-bindings.service'
import { Observable } from 'rxjs';
import { AsyncPipe, NgIf, NgFor } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { HttpParams } from '@angular/common/http';
import { ConfigService } from 'src/app/services/config.service'

// import { createCustomElement } from '@angular/elements';
// import {HighlightComponent} from "../shared/highlight/highlight.component";
// const highlightElement = createCustomElement(HighlightComponent, { injector });
// customElements.define('nde-highlight-remote', highlightElement);

@NDEComponent({
  selector: 'nde-full-display-details',
  position: 'before',
  viewPattern: /Disable_32KUL.*/
})


@Component({
  selector: 'custom-full-display-details-override',
  standalone: true,
  imports: [RouterLink, TranslateModule, AsyncPipe, NgIf, NgFor],
  templateUrl: './full-display-details-override.component.html',
  styleUrl: './full-display-details-override.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  encapsulation: ViewEncapsulation.None  
})
export class FullDisplayDetailsOverrideComponent implements OnInit {

  // Host bindings (copied from host as passthroughs if you need them in template)
  
  getDetailLabel$!: (label: string) => Observable<string>;
  displayHypertextLinkingInJournalAndDB!: () => boolean;
  onHyperTextLinking!: (value: any) => void;
  shouldShowDetailValue!: (detail: any, index: number) => boolean;
  almaStarterPolicy!: any;
  toggleShowMoreLess!: (detail: any) => void;
  NUMBER_OF_DETAILS_TO_DISPLAY!: number;
  searchResult!: any;
  shouldShowCollectionsPath!: () => any;

  details$!: Observable<any>;

  cfg?: any;
  prefix?: string;

  @Input({ required: true }) hostComponent!: any;

  constructor(
    private HostBindings: HostBindings,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {

    const host = this.hostComponent;
   
    this.cfg = this.configService.getConfig();
    this.prefix = this.configService.getValue<string>('prefix');

    if (!host) {
      console.warn('[remote] hostComponent not provided.');
      return;
    }
    this.HostBindings.applyBindings(this, this.hostComponent);
  }

  buildLink(linkValues: any){
    // console.log ("buildLink linkValues.params ")
    // console.log (linkValues)
    
    let subFields: string[] = linkValues.params["query"].split('$$U');

    // 1. Identify U-fields and Q-field
    let uFields = subFields.slice(1)
    linkValues.params["query"] = subFields[0];

    // console.log ( "subFields", subFields )
    // console.log ( "uFields", uFields)

    const params = new HttpParams({ fromObject: linkValues.params });

    const queryString = params.toString(); 
    return this.prefix + linkValues.context +"?"+ queryString;
  }

/*
const el = this.elementRef.nativeElement.querySelector('nde-highlight') as any;
el.text = this.value.text;
el.field = this.detail.label;
*/

}
