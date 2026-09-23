import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NDEComponent } from 'src/app/decorators/nde-component.decorator';

@NDEComponent({
  selector: 'nde-requests-page',
  position: 'before',
  viewPattern: /32KUL.*/,
})
@Component({
  selector: 'custom-ill-link',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #ill class="ill-link">
      <a (click)="goToIll()"> Blanco ILL formulier</a>
    </div>
  `,
})
export class IllLinkComponent implements AfterViewInit {
  @ViewChild('ill') ill?: ElementRef;

  constructor() {
    console.log('IllLinkComponent CONSTRUCTED');
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
    // console.log(' ILL CLICKED');

    const vid = new URLSearchParams(window.location.search).get('vid');
    console.log(' VID:', vid);

    window.location.href = `/discovery/blankIll?vid=${vid}`;
  }
}
