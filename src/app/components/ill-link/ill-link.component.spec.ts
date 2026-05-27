import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IllLinkComponent } from './ill-link.component';

describe('IllLinkComponent', () => {
  let component: IllLinkComponent;
  let fixture: ComponentFixture<IllLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IllLinkComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IllLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
