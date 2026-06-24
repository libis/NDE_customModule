import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchStatsComponent } from './search-stats.component';

describe('SearchStatsComponent', () => {
  let component: SearchStatsComponent;
  let fixture: ComponentFixture<SearchStatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchStatsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
