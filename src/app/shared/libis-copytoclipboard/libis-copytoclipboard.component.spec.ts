import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibisCopytoclipboardComponent } from './libis-copytoclipboard.component';

describe('LibisCopytoclipboardComponent', () => {
  let component: LibisCopytoclipboardComponent;
  let fixture: ComponentFixture<LibisCopytoclipboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibisCopytoclipboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LibisCopytoclipboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
