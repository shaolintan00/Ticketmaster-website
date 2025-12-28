import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Eventdetail } from './eventdetail';

describe('Eventdetail', () => {
  let component: Eventdetail;
  let fixture: ComponentFixture<Eventdetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Eventdetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Eventdetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
