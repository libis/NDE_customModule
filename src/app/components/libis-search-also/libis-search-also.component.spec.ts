import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibisSearchAlsoComponent } from './libis-search-also.component';

describe('LibisSearchAlsoComponent', () => {
  let component: LibisSearchAlsoComponent;
  let fixture: ComponentFixture<LibisSearchAlsoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibisSearchAlsoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LibisSearchAlsoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
