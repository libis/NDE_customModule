import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibisPasswordNoteComponent } from './libis-password-note.component';

describe('LibisPasswordNoteComponent', () => {
  let component: LibisPasswordNoteComponent;
  let fixture: ComponentFixture<LibisPasswordNoteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibisPasswordNoteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LibisPasswordNoteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
