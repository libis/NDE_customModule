import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibisOpeningHoursComponent } from './libis-opening-hours.component';

describe('LibisOpeningHoursComponent', () => {
  let component: LibisOpeningHoursComponent;
  let fixture: ComponentFixture<LibisOpeningHoursComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibisOpeningHoursComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LibisOpeningHoursComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
