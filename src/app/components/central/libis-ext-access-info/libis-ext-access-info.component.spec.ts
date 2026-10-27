import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibisExtAccessInfoComponent } from './libis-ext-access-info.component';

describe('LibisExtAccessInfoComponent', () => {
  let component: LibisExtAccessInfoComponent;
  let fixture: ComponentFixture<LibisExtAccessInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibisExtAccessInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LibisExtAccessInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
