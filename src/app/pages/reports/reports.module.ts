import { ComponentsModule } from './../components/components.module';
// Angular
import { Injectable, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanDeactivate, RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AgmCoreModule, GoogleMapsAPIWrapper } from '@agm/core';

// Components

import { TranslateModule } from '@ngx-translate/core';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { NgbDatepickerModule, NgbDropdownModule, NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ReportsComponent } from './reports.component';
import { AnalyticsReportsListComponent } from './analytics/analytics-list.component';
import { FundingReportsListComponent } from './funding/funding-list.component';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { WalletDetailDialog } from './analytics/wallet-detail-dialog/wallet-detail-dialog';
import { ModuleGuard } from '../common/module.guard';
import { LpTableModule } from '../common/lp-table/lp-table.module';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { LocationComponent } from './location/location.component';
import { LocationMapComponent } from './location-map/location-map.component';

const routes: Routes = [
	{
		path: '',
		component: ReportsComponent,
		children: [
			{
				path: 'analytics/:type',
				component: AnalyticsReportsListComponent,
				canActivate: [ModuleGuard],
				data: {permission: ['analytics'], permissionOr: true}
			},
			{
				path: 'funding/:type',
				component: FundingReportsListComponent,
				canActivate: [ModuleGuard],
				data: {permission: ['funding'], permissionOr: true}
			},
			{
				path: 'funding/location/data',
				component: LocationComponent,
				canActivate: [ModuleGuard],
				data: {permission: ['funding'], permissionOr: true}
			},
			{
				path: '',
				redirectTo: 'funding',
				pathMatch: 'full'
			}
		]
	}
];

@NgModule({
	imports: [
		CommonModule,
		HttpClientModule,
		RouterModule.forChild(routes),
		FormsModule,
		ReactiveFormsModule,
		TranslateModule.forChild(),
		PerfectScrollbarModule,
		NgbModalModule,
		LpTableModule,
		NgMultiSelectDropDownModule,
		NgbDropdownModule,
		NgbDatepickerModule,
		BsDatepickerModule.forRoot(),
		ComponentsModule,
		AgmCoreModule.forRoot({apiKey: 'AIzaSyB1ybIZvTg12vt_dL7pjThLpI33MQIlOPc'}),
	],
	declarations: [
		ReportsComponent,
		FundingReportsListComponent,
		AnalyticsReportsListComponent,
		WalletDetailDialog,
  	LocationComponent,
   	LocationMapComponent
	],
	providers: [
    GoogleMapsAPIWrapper
  ],
	entryComponents: [
		WalletDetailDialog
	],
})
export class ReportsModule { }
