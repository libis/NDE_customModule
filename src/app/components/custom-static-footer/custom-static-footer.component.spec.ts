import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomStaticFooterComponent } from './custom-static-footer.component';

describe('CustomStaticFooterComponent', () => {
  let component: CustomStaticFooterComponent;
  let fixture: ComponentFixture<CustomStaticFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomStaticFooterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomStaticFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
