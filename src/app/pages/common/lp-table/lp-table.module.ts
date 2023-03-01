import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AgGridModule } from 'ag-grid-angular';
import { ClickOutsideModule } from 'ng-click-outside';

import { LpTableComponent, LpTblPinnedRowRenderer, LpTblSelectAllHeader, LpTblDateComponent, LpTblDropdownFloatingFilterComponent } from './lp-table.component';
import { TranslateModule } from '@ngx-translate/core';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ComponentsModule } from '../../components/components.module';
@NgModule({
  declarations: [LpTableComponent, LpTblDateComponent, LpTblPinnedRowRenderer, LpTblSelectAllHeader, LpTblDropdownFloatingFilterComponent],
  imports: [
    CommonModule,
		FormsModule,
		HttpClientModule,
    ClickOutsideModule,
    // MatDatepickerModule,
    // MatNativeDatetimeModule,
    // MatMomentDatetimeModule,
    // MatDatetimepickerModule,
    BsDatepickerModule.forRoot(),
    BsDropdownModule.forRoot(),
    PerfectScrollbarModule,
    NgbModule,
    TranslateModule.forChild(),
		AgGridModule.withComponents([LpTblDateComponent,LpTblPinnedRowRenderer,LpTblSelectAllHeader, LpTblDropdownFloatingFilterComponent]),
    ComponentsModule
  ],
  providers: [
    // MatDatetimepickerModule,
    // MatNativeDatetimeModule
  ],
  exports: [
    LpTableComponent,
    // MatDatepickerModule,
    // MatNativeDatetimeModule,
    // MatMomentDatetimeModule,
    // MatDatetimepickerModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LpTableModule { }
