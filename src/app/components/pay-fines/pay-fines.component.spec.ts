import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayFinesComponent } from './pay-fines.component';

describe('PayFinesComponent', () => {
  let component: PayFinesComponent;
  let fixture: ComponentFixture<PayFinesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PayFinesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayFinesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
