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

  readonly BOUNDARY = '--4561564891651634213217';
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
      discoveryDocs: this.googleDriveConstants.DISCOVERY_DOCS,
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
    console.log(`Filename is ${fileName}`);
    file = new File(['hello, world'], 'myfile.txt');
    const currentInvoicesFolderId: string = await this.getReceivingInvoicesFolderIdForYearAndQuarter(date);
        this.readFile(file)
            .then(base64Data => {
              gapi.client.request({
                path: 'upload/drive/v3/files', method: 'POST', params: {
                  uploadType: 'multipart', parents: [ currentInvoicesFolderId ]
                }, headers: {
                  'Content-type': `multipart/related; boundary=${this.BOUNDARY}`, 'Content-length': file.size
                }, body: this.formatMultipartBody(file, fileName, base64Data)
              })
                  .then(response => console.log('Upload success! ', response), error => console.error('Upload error! ', error));
            });
  }

  private readFile(file: File): Promise<string> {
    const fileReader: FileReader = new FileReader();
    return new Promise(resolve => {
      fileReader.readAsBinaryString(file);
      fileReader.onload = (event: any) => resolve(btoa(fileReader.result));
    });
  }

  private formatMultipartBody(file: File, fileName: string, base64Data: string): string {
    const delimiter = `\r\n--${this.BOUNDARY}\r\n`;
    const closeDelimiter = `\r\n--${this.BOUNDARY}--`;
    const metadata = {
      name: fileName, mimeType: file.type || 'application/octet-stream'
    };
    const body = `
    ${delimiter}
    Content-Type: application/json; charset=UTF-8\r\n\r\n
    ${JSON.stringify(metadata)}
    ${delimiter}
    Content-Type: ${file.type || 'application/octet-stream'}\r\n
    Content-Transfer-Encoding: base64\r\n
    ${base64Data}
    ${closeDelimiter}
    `;
    console.log(body);
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
    const currentFolderId = await this.getReceivingInvoicesFolderIdForYearAndQuarter(date);
    const response = await gapi.client.request({
      path: 'drive/v3/files', method: 'GET', params: {
        q: `'${currentFolderId}' in parents`
      }
    });
    const invoices: GoogleDriveFolder[] = response.result.files;
    const invoiceNumbers: number[] = invoices.map(
      googleDriveFolder => parseFloat(this.invoiceNumberRegex.exec(googleDriveFolder.name)[ 0 ].replace('-', '')));
    const lastInvoiceNumber = Math.max(...invoiceNumbers);
    return lastInvoiceNumber + 1;
  }
}
