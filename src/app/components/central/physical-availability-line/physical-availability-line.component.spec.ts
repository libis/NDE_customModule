import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhysicalAvailabilityLineComponent } from './physical-availability-line.component';

describe('PhysicalAvailabilityLineComponent', () => {
  let component: PhysicalAvailabilityLineComponent;
  let fixture: ComponentFixture<PhysicalAvailabilityLineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhysicalAvailabilityLineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PhysicalAvailabilityLineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
