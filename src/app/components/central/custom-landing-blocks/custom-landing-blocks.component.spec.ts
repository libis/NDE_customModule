import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomLandingBlocksComponent } from './custom-landing-blocks.component';

describe('CustomLandingBlocksComponent', () => {
  let component: CustomLandingBlocksComponent;
  let fixture: ComponentFixture<CustomLandingBlocksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomLandingBlocksComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomLandingBlocksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
