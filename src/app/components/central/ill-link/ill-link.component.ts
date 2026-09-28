import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { NDEComponent } from 'src/app/decorators/nde-component.decorator';

@NDEComponent({
  selector: 'nde-requests-page',
  position: 'before',
  viewPattern: /32KUL_KUL:KULeuven.*/,
})
@Component({
  selector: 'custom-ill-link',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #ill class="ill-link" *ngIf="showIllLink">
      <a (click)="goToIll()">{{ illLinkLabel }}</a>
    </div>
  `,
})
export class IllLinkComponent implements AfterViewInit {
  @ViewChild('ill') ill?: ElementRef;

  constructor(private translate: TranslateService) {
    console.log('IllLinkComponent CONSTRUCTED');
  }

  get illLinkLabel(): string {
    return this.translate.instant('nde.custom.blank-ill-request');
  }

  get showIllLink(): boolean {
    return this.isValidValue(this.illLinkLabel, 'nde.custom.blank-ill-request');
  }

  private isValidValue(value: string, key: string): boolean {
    return !!value && value !== 'NOT_DEFINED' && value !== key;
  }

  ngAfterViewInit() {
    const link = document.querySelector(
      'nde-requests-page-before-from-remote-0 .ill-link',
    );

    const title = document.querySelector('.requests-section-title');

    if (link && title) {
      title.insertAdjacentElement('afterend', link as HTMLElement);
    }
  }

  goToIll() {
    const vid = new URLSearchParams(window.location.search).get('vid');

    window.location.href = `/discovery/blankIll?vid=${vid}`;
  }
}
