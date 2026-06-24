import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomViewLogoComponent } from './custom-view-logo.component';

describe('CustomViewLogoComponent', () => {
  let component: CustomViewLogoComponent;
  let fixture: ComponentFixture<CustomViewLogoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomViewLogoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomViewLogoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
