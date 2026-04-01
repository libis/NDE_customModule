import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FullDisplayDetailsOverrideComponent } from './full-display-details-override.component';

describe('FullDisplayDetailsOverrideComponent', () => {
  let component: FullDisplayDetailsOverrideComponent;
  let fixture: ComponentFixture<FullDisplayDetailsOverrideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FullDisplayDetailsOverrideComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FullDisplayDetailsOverrideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
