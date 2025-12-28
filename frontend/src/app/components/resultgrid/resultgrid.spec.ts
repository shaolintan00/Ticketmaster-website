import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Resultgrid } from './resultgrid';

describe('Resultgrid', () => {
  let component: Resultgrid;
  let fixture: ComponentFixture<Resultgrid>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Resultgrid]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Resultgrid);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
