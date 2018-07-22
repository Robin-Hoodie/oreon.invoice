import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

@Component({
  selector: 'oreon-invoice-upload',
  templateUrl: './invoice-upload.component.html',
  styleUrls: ['./invoice-upload.component.scss']
})
export class InvoiceUploadComponent implements OnInit {

  invoiceForm: FormGroup;

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit() {
    this.invoiceForm = this.formBuilder.group({
      invoice: this.formBuilder.control(null, Validators.required),
      date: this.formBuilder.control(null, Validators.required),
      price: this.formBuilder.control(null, [Validators.required, Validators.min(0)]),
      description: this.formBuilder.control('', Validators.required)
    });
  }

  onSubmitForm() {
    console.log(this.invoiceForm);
  }

  // TODO: Type event
  onInvoiceUpload(event: any) {
    const reader = new FileReader();

    if (event.target.files && event.target.files.length) {
    }
  }

}
