import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibisProgressSpinnerComponent } from './libis-progress-spinner.component';

describe('LibisProgressSpinnerComponent', () => {
  let component: LibisProgressSpinnerComponent;
  let fixture: ComponentFixture<LibisProgressSpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibisProgressSpinnerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LibisProgressSpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
