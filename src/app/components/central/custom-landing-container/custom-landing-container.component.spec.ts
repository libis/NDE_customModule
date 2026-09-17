import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomLandingContainerComponent } from './custom-landing-container.component';

describe('CustomLandingContainerComponent', () => {
  let component: CustomLandingContainerComponent;
  let fixture: ComponentFixture<CustomLandingContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomLandingContainerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomLandingContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
