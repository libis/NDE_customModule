// import {BaseCustomDirective} from '../../base-custom/base-custom.directive'; // Not in Remote
import {Component, Input, OnInit} from "@angular/core";
import {HighlightService} from "./highlight.service";
import {Observable} from "rxjs";
import {Store} from "@ngrx/store";
import {NgIf, AsyncPipe} from '@angular/common'; // added 
// import {selectHighlightListFromSearch} from "../../../state/search/search.selector";

import { SearchStateService } from '@libis/primo-shared-state';

@Component({
  selector: 'nde-highlight',
  templateUrl: './highlight.component.html',
//    hostDirectives: [BaseCustomDirective], // Not in Remote
  standalone: true,
  imports: [NgIf, AsyncPipe]
})

export class HighlightComponent implements OnInit  {
  @Input() text!: string;
  @Input() field!: string;
  public highlightedText!: string;
  private highlightRegexp = new RegExp('', 'gi');
  private existingHighlightRegexp = new RegExp('<mark>', 'gi');
  // public termsList$!: Observable<string[]>
  public termsList$: string[] = []

  // selectHighlightListFromSearch$ = this.searchState.selectHighlightListFromSearch$(this.field);

  constructor(
    private searchState: SearchStateService,
    private highlightService: HighlightService
  ){}

  ngOnInit() {
    // console.log (  this.selectHighlightListFromSearch$ )
    // this.termsList$ = this.selectHighlightListFromSearch$;
    this.termsList$ = []
  }


  public generateHighlightedText(listOfTerms: string[]){
    if (this.existingHighlightRegexp.test(this.text)) {
      return this.text.replace(this.existingHighlightRegexp, '<mark class="text-bold-heavy ctm-highlight">');
    }
    if (listOfTerms.length === 0 || listOfTerms.every(str => str.trim().length === 0)){
      return this.text;
    }

    this.highlightRegexp = this.highlightService.getTermRegexp(listOfTerms);
    const res = this.highlightService.bidirectionalText(this.text);
    this.highlightedText = this.highlightService.getHighlightedText(res.fixedStr, this.highlightRegexp);

    return this.highlightedText;
  }

}
