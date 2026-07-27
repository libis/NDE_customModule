import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoLoginFirstOptionComponent } from './auto-login-first-option.component';

describe('AutoLoginFirstOptionComponent', () => {
  let component: AutoLoginFirstOptionComponent;
  let fixture: ComponentFixture<AutoLoginFirstOptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutoLoginFirstOptionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AutoLoginFirstOptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
