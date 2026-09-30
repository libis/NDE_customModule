import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomLandingBackgroundImageComponent } from './custom-landing-background-image.component';

describe('CustomLandingBackgroundImageComponent', () => {
  let component: CustomLandingBackgroundImageComponent;
  let fixture: ComponentFixture<CustomLandingBackgroundImageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomLandingBackgroundImageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomLandingBackgroundImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
