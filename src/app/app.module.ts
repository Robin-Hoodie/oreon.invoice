import { HttpClientModule } from '@angular/common/http';
import { LOCALE_ID, NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule } from '@angular/material';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { InvoiceUploadComponent } from './invoice-upload/invoice-upload.component';

@NgModule({
  declarations: [
    AppComponent,
    InvoiceUploadComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatMomentDateModule,
    HttpClientModule,
  ],
  providers: [
    {
      provide: LOCALE_ID, useValue: 'nl-BE'
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
