import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';
import { GapiService } from '../common/gapi.service';
import { GoogleDriveConfig } from '../common/google-drive.config';

@Component({
  selector: 'oreon-invoice-upload', templateUrl: './invoice-upload.component.html', styleUrls: [ './invoice-upload.component.scss' ]
})
export class InvoiceUploadComponent implements OnInit {

  invoiceForm: FormGroup;
  today: moment.Moment;
  file: File;

  constructor(private formBuilder: FormBuilder, private googleDriveConfig: GoogleDriveConfig, private gapiService: GapiService) {}

  ngOnInit() {
    this.today = moment();
    this.invoiceForm = this.formBuilder.group({
      invoice: this.formBuilder.control(null, Validators.required),
      date: this.formBuilder.control(new Date(), Validators.required),
      price: this.formBuilder.control(0.00, [ Validators.required, Validators.min(0) ]),
      description: this.formBuilder.control('Garage', Validators.required)
    });

    this.gapiService.loadClient()
        .then(result => this.gapiService.init(), error => console.error('Gapi failed to load ', error));
  }

  async onSubmitForm() {
//    if (this.invoiceForm.valid) {
      const nextInvoiceNumber = await this.gapiService.getNextInvoiceNumber(moment(this.date.value));
      const fileName = `${nextInvoiceNumber}-${this.description.value}-${moment(this.date.value)
        .format('DD/MM/YYYY')}`;
      this.gapiService.uploadToDrive(this.file, fileName, moment(this.date.value));
//    }
  }

  onInvoiceUpload(file: File) {
    this.file = file;
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
