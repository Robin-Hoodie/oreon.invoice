import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceUploadComponent } from './invoice-upload.component';

describe('InvoiceUploadComponent', () => {
  let component: InvoiceUploadComponent;
  let fixture: ComponentFixture<InvoiceUploadComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InvoiceUploadComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InvoiceUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
