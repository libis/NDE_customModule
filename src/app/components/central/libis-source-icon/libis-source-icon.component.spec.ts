import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibisSourceIconComponent } from './libis-source-icon.component';

describe('LibisSourceIconComponent', () => {
  let component: LibisSourceIconComponent;
  let fixture: ComponentFixture<LibisSourceIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibisSourceIconComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LibisSourceIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
