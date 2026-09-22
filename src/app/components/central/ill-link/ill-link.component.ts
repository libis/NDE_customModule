import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NDEComponent } from 'src/app/decorators/nde-component.decorator';

@NDEComponent({
  selector: 'nde-user-area',
  position: 'before',
  viewPattern: /32KUL.*/,
})
@Component({
  selector: 'custom-ill-link',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #ill class="ill-link" style="display:none;">
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
    console.log(' ngAfterViewInit triggered');
    console.log(' Current URL:', window.location.href);

    setTimeout(() => this.moveToAccountArea(), 500);
  }

  private moveToAccountArea() {
    console.log(' Trying to move ILL component...');

    const container = document.querySelector(
      'nde-account-overview .overview-cards',
    );
    console.log(' Target container:', container);

    if (!container) {
      console.warn(' Container NOT found');
      return;
    }

    if (!this.ill) {
      console.warn(' ViewChild ill NOT available');
      return;
    }

    const el = this.ill.nativeElement;
    console.log(' Element to move:', el);

    if (!el._moved) {
      container.prepend(el);
      el.style.display = 'block';
      el._moved = true;

      console.log(' ILL successfully moved!');
    } else {
      console.log(' Already moved before');
    }
  }

  goToIll() {
    console.log(' ILL CLICKED');

    const vid = new URLSearchParams(window.location.search).get('vid');
    console.log(' VID:', vid);

    window.location.href = `/discovery/blankIll?vid=${vid}`;
  }
}
