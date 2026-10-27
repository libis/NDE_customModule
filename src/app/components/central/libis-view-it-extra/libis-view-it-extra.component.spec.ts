import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibisViewItExtraComponent } from './libis-view-it-extra.component';

describe('LibisViewItExtraComponent', () => {
  let component: LibisViewItExtraComponent;
  let fixture: ComponentFixture<LibisViewItExtraComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibisViewItExtraComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LibisViewItExtraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
