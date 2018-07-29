/// <reference path="../../../node_modules/@types/gapi.auth2/index.d.ts" />
/// <reference path="../../../node_modules/@types/gapi/index.d.ts" />
import { Injectable, NgZone } from '@angular/core';
import { GoogleDriveConfig } from './google-drive.config';
import * as moment from 'moment';

declare var gapi: any;

interface GoogleDriveFolder {
  kind: string;
  id: string;
  name: string;
  mimeType: string;
};

@Injectable({
  providedIn: 'root'
})
export class GapiService {

  readonly BOUNDARY = '-------314159265358979323846';
  readonly invoiceNumberRegex = /\d+-/;

  constructor(private zone: NgZone, private googleDriveConstants: GoogleDriveConfig) {}

  loadClient(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.zone.run(() => gapi.load('client:auth2', {
        callback: resolve, onerror: reject, timeout: 1000, ontimeout: reject
      }));
    });
  }

  init() {
    gapi.client.init({
      apiKey: this.googleDriveConstants.API_KEY,
      clientId: this.googleDriveConstants.CLIENT_ID,
      scope: this.googleDriveConstants.SCOPES
    })
        .then(this.signIn);
  }

  signIn(): Promise<gapi.auth2.GoogleUser> {
    const googleAuth: gapi.auth2.GoogleAuth = gapi.auth2.getAuthInstance();
    if (!googleAuth.isSignedIn.get()) {
      return googleAuth.signIn();
    }
    return new Promise(resolve => resolve(googleAuth.currentUser.get()));
  }

  async uploadToDrive(file: File, fileName: string, date: moment.Moment) {
    const invoicesFolderId: string = await this.getReceivingInvoicesFolderIdForYearAndQuarter(date);
    const base64Data = await this.encodeInBase64(file);
    const response = await gapi.client.request({
      path: 'upload/drive/v3/files', method: 'POST', params: {
        uploadType: 'multipart',
      }, headers: {
        'Content-type': `multipart/related; boundary="${this.BOUNDARY}"`, 'Content-length': file.size
      }, body: this.formatMultipartBody(file, fileName, base64Data, invoicesFolderId)
    });
  }

  private encodeInBase64(file: File): Promise<string> {
    const fileReader: FileReader = new FileReader();
    fileReader.readAsBinaryString(file);
    return new Promise(resolve => fileReader.onloadend = (event: any) => resolve(btoa(fileReader.result)));
  }

  private formatMultipartBody(file: File, fileName: string, base64Data: string, invoicesFolderId: string): string {
    const delimiter = `--${this.BOUNDARY}`;
    const closeDelimiter = `--${this.BOUNDARY}--`;
    const metadata = {
      name: fileName, mimeType: file.type || 'application/octet-stream', parents: [invoicesFolderId]
    };
    const body = `
    \n${delimiter}\
    \nContent-Type: application/json; charset=UTF-8\
    \n\n${JSON.stringify(metadata)}\
    \n${delimiter}\
    \nContent-Type: ${file.type || 'application/octet-stream'}\
    \nContent-Transfer-Encoding: base64\`
    \n\n${base64Data}\
    \n${closeDelimiter}`;
    return body;
  }

  async getReceivingInvoicesFolderIdForYearAndQuarter(date: moment.Moment): Promise<string> {
    const folderName = `Q${date.quarter()} ${date.year()}`;
    const parentFolderId = await this.getReceivingInvoicesFolderId();
    const response = await gapi.client.request({
      path: 'drive/v3/files', method: 'GET', params: {
        q: `name = '${folderName}' and '${parentFolderId}' in parents`
      }
    });
    if (response.result.files.length > 1) {
      // TODO: Popup
      throw new Error('There are multiple folders called "Inkomend"');
    }
    return response.result.files[ 0 ].id;
  }

  async getReceivingInvoicesFolderId(): Promise<string> {
    const response = await gapi.client.request({
      path: 'drive/v3/files', method: 'GET', params: {
        q: 'name = \'Inkomend\''
      }
    });
    if (response.result.files.length > 1) {
      // TODO: Popup
      throw new Error('There are multiple folders called "Inkomend"');
    }
    return response.result.files[ 0 ].id;
  }

  async getNextInvoiceNumber(date: moment.Moment): Promise<number> {
    const invoicesFolderId = await this.getReceivingInvoicesFolderIdForYearAndQuarter(date);
    const response = await gapi.client.request({
      path: 'drive/v3/files', method: 'GET', params: {
        q: `'${invoicesFolderId}' in parents`
      }
    });
    const invoices: GoogleDriveFolder[] = response.result.files;
    const invoiceNumbers: number[] = invoices.map(
      invoice => {
        const invoiceNumber = this.invoiceNumberRegex.exec(invoice.name);
        if (!invoiceNumber || !invoiceNumber.length) {
          console.error(`Found an invoice without an invoice number! ${invoice.name}`);
          return -1;
        } else {
          return parseFloat(invoiceNumber[0].replace('-', ''));
        }
      });
    const lastInvoiceNumber = Math.max(...invoiceNumbers);
    return lastInvoiceNumber + 1;
  }
}
