import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Heart } from './heart';

describe('Heart', () => {
  let component: Heart;
  let fixture: ComponentFixture<Heart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Heart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Heart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
