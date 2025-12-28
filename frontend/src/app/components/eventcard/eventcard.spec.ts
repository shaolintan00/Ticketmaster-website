import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Eventcard } from './eventcard';

describe('Eventcard', () => {
  let component: Eventcard;
  let fixture: ComponentFixture<Eventcard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Eventcard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Eventcard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
