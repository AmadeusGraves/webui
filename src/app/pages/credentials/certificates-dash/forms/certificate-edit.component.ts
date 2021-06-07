import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { helptext_system_certificates } from 'app/helptext/system/certificates';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { DialogService, WebSocketService, StorageService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-certificate-edit',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class CertificateEditComponent implements FormConfiguration {
  queryCall: 'certificate.query' = 'certificate.query';
  editCall: 'certificate.update' = 'certificate.update';
  isEntity = true;
  title = helptext_system_certificates.edit.title;
  private viewButtonText = helptext_system_certificates.viewButton.certificate;
  protected isCSR: boolean;
  queryCallOption: any[];

  fieldConfig: FieldConfig[];
  fieldSets: FieldSet[] = [
    {
      name: helptext_system_certificates.edit.fieldset_certificate,
      class: 'certificate',
      config: [
        {
          type: 'input',
          name: 'name',
          placeholder: helptext_system_certificates.edit.name.placeholder,
          tooltip: helptext_system_certificates.edit.name.tooltip,
          required: true,
          validation: helptext_system_certificates.edit.name.validation,
        },
      ],
    },
    {
      name: 'spacer',
      class: 'spacer',
      config: [],
    }, {
      name: helptext_system_certificates.edit.subject,
      label: true,
      class: 'subject',
      config: [
        {
          type: 'paragraph',
          name: 'country',
          paraText: helptext_system_certificates.edit_view.country,
        },
        {
          type: 'paragraph',
          name: 'state',
          paraText: helptext_system_certificates.edit_view.state,
        },
        {
          type: 'paragraph',
          name: 'city',
          paraText: helptext_system_certificates.edit_view.city,
        },
      ],
    }, {
      name: 'Subject-col-2',
      class: 'subject lowerme',
      config: [
        {
          type: 'paragraph',
          name: 'organization',
          paraText: helptext_system_certificates.edit_view.organization,
        },
        {
          type: 'paragraph',
          name: 'organizational_unit',
          paraText: helptext_system_certificates.edit_view.organizational_unit,
        },
        {
          type: 'paragraph',
          name: 'email',
          paraText: helptext_system_certificates.edit_view.email,
        },
      ],
    }, {
      name: 'subject-details',
      class: 'subject-details break-all',
      config: [
        {
          type: 'paragraph',
          name: 'common',
          paraText: helptext_system_certificates.edit_view.common,
        },
        {
          type: 'paragraph',
          name: 'san',
          paraText: helptext_system_certificates.edit_view.san,
        },
        {
          type: 'paragraph',
          name: 'DN',
          paraText: helptext_system_certificates.edit_view.DN,
        },
      ],
    }, {
      name: 'spacer',
      class: 'spacer',
      config: [],
    },
    {
      name: 'details',
      class: 'details',
      config: [
        {
          type: 'paragraph',
          name: 'cert_type',
          paraText: helptext_system_certificates.edit_view.type,
        },
        {
          type: 'paragraph',
          name: 'root_path',
          paraText: helptext_system_certificates.edit_view.path,
        },
        {
          type: 'paragraph',
          name: 'digest_algorithm',
          paraText: helptext_system_certificates.edit_view.digest_algorithm,
        },
        {
          type: 'paragraph',
          name: 'key_length',
          paraText: helptext_system_certificates.edit_view.key_length,
        },
        {
          type: 'paragraph',
          name: 'key_type',
          paraText: helptext_system_certificates.edit_view.key_type,
        },
        {
          type: 'button',
          name: 'certificate_view',
          customEventActionLabel: this.viewButtonText,
          customEventMethod: () => {
            this.viewCertificate();
          },
        },
      ],
    }, {
      name: 'Details-col2',
      class: 'details-col-2',
      config: [
        {
          type: 'paragraph',
          name: 'until',
          paraText: helptext_system_certificates.edit_view.unitl,
        },
        {
          type: 'paragraph',
          name: 'issuer',
          paraText: helptext_system_certificates.edit_view.issuer,
        },
        {
          type: 'paragraph',
          name: 'revoked',
          paraText: helptext_system_certificates.edit_view.revoked,
        },
        {
          type: 'paragraph',
          name: 'signed_by',
          paraText: helptext_system_certificates.edit_view.signed_by,
        },
        {
          type: 'paragraph',
          name: 'lifetime',
          paraText: helptext_system_certificates.edit_view.lifetime,
        },
        {
          type: 'button',
          name: 'private_key_view',
          customEventActionLabel: helptext_system_certificates.viewButton.key,
          customEventMethod: () => {
            this.viewKey();
          },
        },
      ],
    },
  ];

  private rowNum: any;
  protected entityForm: EntityFormComponent;
  protected dialogRef: any;
  private getRow = new Subscription();
  private incomingData: any;

  constructor(protected ws: WebSocketService, protected matDialog: MatDialog,
    protected loader: AppLoaderService, protected dialog: DialogService,
    private modalService: ModalService, private storage: StorageService, private http: HttpClient) {
    this.getRow = this.modalService.getRow$.pipe(untilDestroyed(this)).subscribe((rowId) => {
      this.rowNum = rowId;
      this.queryCallOption = [['id', '=', rowId]];
      this.getRow.unsubscribe();
    });
  }

  resourceTransformIncomingRestData(data: any): any {
    this.incomingData = data;
    if (data.cert_type_CSR) {
      this.isCSR = true;
      this.title = helptext_system_certificates.edit.titleCSR;
      this.viewButtonText = helptext_system_certificates.viewButton.csr;
    }
    this.setForm();
    return data;
  }

  custActions = [
    {
      id: 'create_ACME',
      name: helptext_system_certificates.list.action_create_acme_certificate,
      function: () => {
        this.modalService.close('slide-in-form');
        const message = { action: 'open', component: 'acmeComponent', row: this.rowNum };
        this.modalService.message(message);
      },
    },
  ];

  isCustActionVisible(actionname: string): boolean {
    if (actionname === 'create_ACME' && !this.isCSR) {
      return false;
    }
    return true;
  }

  afterInit(entityEdit: EntityFormComponent): void {
    this.entityForm = entityEdit;
  }

  setForm(): void {
    const fields = ['country', 'state', 'city', 'organization', 'organizational_unit', 'email', 'common', 'DN', 'cert_type',
      'root_path', 'digest_algorithm', 'key_length', 'key_type', 'until', 'revoked', 'signed_by', 'lifetime'];
    fields.forEach((field) => {
      const paragraph = _.find(this.fieldConfig, { name: field });
      this.incomingData[field] || this.incomingData[field] === false
        ? paragraph.paraText += this.incomingData[field] : paragraph.paraText += '---';
    });
    _.find(this.fieldConfig, { name: 'san' }).paraText += this.incomingData.san.join(',');
    const issuer = _.find(this.fieldConfig, { name: 'issuer' });
    if (_.isObject(this.incomingData.issuer)) {
      issuer.paraText += this.incomingData.issuer.name;
    } else {
      this.incomingData.issuer ? issuer.paraText += this.incomingData.issuer : issuer.paraText += '---';
    }
    _.find(this.fieldConfig, { name: 'certificate_view' }).customEventActionLabel = this.viewButtonText;
  }

  exportCertificate(): void {
    const path = this.incomingData.CSR ? this.incomingData.csr_path : this.incomingData.certificate_path;
    const fileName = this.incomingData.name + '.crt'; // is this right for a csr?
    this.ws.call('core.download', ['filesystem.get', [path], fileName]).pipe(untilDestroyed(this)).subscribe(
      (res) => {
        const url = res[1];
        const mimetype = 'application/x-x509-user-cert';
        this.storage.streamDownloadFile(this.http, url, fileName, mimetype).pipe(untilDestroyed(this)).subscribe((file) => {
          this.storage.downloadBlob(file, fileName);
        }, (err) => {
          this.dialog.errorReport(helptext_system_certificates.list.download_error_dialog.title,
            helptext_system_certificates.list.download_error_dialog.cert_message, `${err.status} - ${err.statusText}`);
        });
      },
      (err) => {
        new EntityUtils().handleWSError(this, err, this.dialog);
      },
    );
  }

  exportKey(): void {
    const fileName = this.incomingData.name + '.key';
    this.ws.call('core.download', ['filesystem.get', [this.incomingData.privatekey_path], fileName]).pipe(untilDestroyed(this)).subscribe(
      (res) => {
        const url = res[1];
        const mimetype = 'text/plain';
        this.storage.streamDownloadFile(this.http, url, fileName, mimetype).pipe(untilDestroyed(this)).subscribe((file) => {
          this.storage.downloadBlob(file, fileName);
        }, (err) => {
          this.dialog.errorReport(helptext_system_certificates.list.download_error_dialog.title,
            helptext_system_certificates.list.download_error_dialog.key_message, `${err.status} - ${err.statusText}`);
        });
      },
      (err) => {
        new EntityUtils().handleWSError(this, err, this.dialog);
      },
    );
  }

  viewCertificate(): void {
    if (this.incomingData.CSR) {
      this.dialog.confirm(this.incomingData.name, this.incomingData.CSR, true,
        helptext_system_certificates.viewDialog.download, false, '',
        '', '', '', false, helptext_system_certificates.viewDialog.close, false, this.incomingData.CSR, true).pipe(untilDestroyed(this)).subscribe((res: boolean) => {
        if (res) {
          this.exportCertificate();
        }
      });
    } else {
      this.dialog.confirm(this.incomingData.name, this.incomingData.certificate, true,
        helptext_system_certificates.viewDialog.download, false, '',
        '', '', '', false, helptext_system_certificates.viewDialog.close, false, this.incomingData.certificate, true).pipe(untilDestroyed(this)).subscribe((res: boolean) => {
        if (res) {
          this.exportCertificate();
        }
      });
    }
  }

  viewKey(): void {
    this.dialog.confirm(this.incomingData.name, this.incomingData.privatekey, true,
      helptext_system_certificates.viewDialog.download, false, '',
      '', '', '', false, helptext_system_certificates.viewDialog.close, false, this.incomingData.privatekey, true).pipe(untilDestroyed(this)).subscribe((res: boolean) => {
      if (res) {
        this.exportKey();
      }
    });
  }

  customSubmit(value: any): void {
    this.dialogRef = this.matDialog.open(EntityJobComponent, { data: { title: 'Updating Identifier' } });
    this.dialogRef.componentInstance.setCall(this.editCall, [this.rowNum, { name: value['name'] }]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.matDialog.closeAll();
      this.modalService.close('slide-in-form');
      this.modalService.refreshTable();
    });
    this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res: any) => {
      this.matDialog.closeAll();
      this.modalService.refreshTable();
      new EntityUtils().handleWSError(this.entityForm, res);
    });
  }
}
