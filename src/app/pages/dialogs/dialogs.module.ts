import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { LpTableModule } from '../common/lp-table/lp-table.module';
import { CampaignSelectDialog } from './campaign-select/campaign-select.dialog';
import { InvestAmountDialog } from './invest-amount/invest-amount.dialog';
import { InputNumberDirective } from '../common/input-number.directive';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InlineSVGModule } from 'ng-inline-svg';
import { DatePickerDialog } from './date-picker/date-picker.dialog';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';

@NgModule({
  declarations: [
    InputNumberDirective,
    CampaignSelectDialog,
    InvestAmountDialog,
    DatePickerDialog
  ],
  providers: [
  ],
  imports: [
    CommonModule,
    FormsModule,
		ReactiveFormsModule,
    TranslateModule.forChild(),
    LpTableModule,
    InlineSVGModule,
    BsDatepickerModule.forRoot(),
  ],
  exports: [CampaignSelectDialog, InvestAmountDialog],
  entryComponents: [CampaignSelectDialog, InvestAmountDialog]
})
export class DialogsModule {}
