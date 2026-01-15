import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import {map, Observable, of} from "rxjs";

@Component({
  selector: 'custom-dot',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dot.component.html',
  styleUrl: './dot.component.scss'
})

export class DotComponent {
  public store = inject(Store);

  availableStates$: Observable<any> | undefined;
  availableKeys$: Observable<any> | undefined;

  ngOnInit(): void {
    const inputProperties = Object.getOwnPropertyNames(DotComponent.prototype);
    console.log('Component properties:', inputProperties);

    this.store.select(state => state).subscribe(fullState => {
      this.availableStates$ = of(fullState);
      this.availableKeys$ = of(Object.keys(fullState));
      console.log('All available states:', fullState);
      console.log('Available keys:', Object.keys(fullState));
    });
  }
 
}