import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Searchform } from './serachform';

describe('Searchform', () => {
  let component: Searchform;
  let fixture: ComponentFixture<Searchform>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Searchform]
    })
      .compileComponents();

    fixture = TestBed.createComponent(Searchform);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
