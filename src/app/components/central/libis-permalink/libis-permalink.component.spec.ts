import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibisPermalinkComponent } from './libis-permalink.component';

describe('LibisPermalinkComponent', () => {
  let component: LibisPermalinkComponent;
  let fixture: ComponentFixture<LibisPermalinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibisPermalinkComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LibisPermalinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
