import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InjectorTestComponent } from './injector-test.component';

describe('InjectorTestComponent', () => {
  let component: InjectorTestComponent;
  let fixture: ComponentFixture<InjectorTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InjectorTestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InjectorTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
