import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomLandingQuickLinksComponent } from './custom-landing-quick-links.component';

describe('CustomLandingQuickLinksComponent', () => {
  let component: CustomLandingQuickLinksComponent;
  let fixture: ComponentFixture<CustomLandingQuickLinksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomLandingQuickLinksComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomLandingQuickLinksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
