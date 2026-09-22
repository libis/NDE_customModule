import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomAlertMessageComponent } from './custom-alert-message.component';

describe('CustomAlertMessageComponent', () => {
  let component: CustomAlertMessageComponent;
  let fixture: ComponentFixture<CustomAlertMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomAlertMessageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomAlertMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
