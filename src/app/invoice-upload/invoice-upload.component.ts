import {Component, OnInit} from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';
import { Quarter } from '../models/quarter';
import { datePatternValidator } from '../validators/date-pattern.validator';

@Component({
  selector: 'oreon-invoice-upload',
  templateUrl: './invoice-upload.component.html',
  styleUrls: ['./invoice-upload.component.scss']
})
export class InvoiceUploadComponent implements OnInit {

  invoiceForm: FormGroup;
  today: moment.Moment;

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit() {
    this.today = moment();
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

  onInvoiceUpload(event: any) {
    const reader = new FileReader();

    if (event.target.files && event.target.files.length) {
    }
  }

  get date(): AbstractControl {
    return this.invoiceForm.get('date');
  }

  get price(): AbstractControl {
    return this.invoiceForm.get('price');
  }

  get description(): AbstractControl {
    return this.invoiceForm.get('description');
  }
}
