// Angular
import { Injectable, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanDeactivate, RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// Components

import { TranslateModule } from '@ngx-translate/core';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { NgbDropdownModule, NgbModal, NgbModalModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { AdminComponent } from './admin.component';
import { CampaignsListComponent } from './campaign/campaigns-list/campaigns-list.component';
import { CompanySearchDialog } from './company/company-search-dialog/company-search-dialog';
import { ScrapingLogComponent } from './scraping/scraping-log/scraping-log.component';
import { ScrapingDetailDialog } from './scraping/scraping-detail-dialog/scraping-detail-dialog';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { ModuleGuard } from '../common/module.guard';
import { LpTableModule } from '../common/lp-table/lp-table.module';
import { ComponentsModule } from '../components/components.module';
import { DailyDetailDialog } from './common/daily-detail/daily-detail.dialog';
import { AdvertisementComponent } from './advertisement/advertisement.component';
import { AdvertisementCreateDialog } from './advertisement/advertisement-create-dialog/advertisement-create.dialog';
import { AliasesListComponent } from './alias/aliases-list/aliases-list.component';
import { AliasEditComponent } from './alias/alias-edit/alias-edit.component';
import { AliasMergeDialog } from './alias/alias-merge-dialog/alias-merge-dialog';
import { AliasInvolvedDialog } from './alias/aliases-list/alias-involved/alias-involved.dialog';
import { AliasMoveDialog } from './alias/alias-move-dialog/alias-move-dialog';
import { CompaniesListComponent } from './company/companies-list/companies-list.component';
import { CompanyEditComponent } from './company/company-edit/company-edit.component';
import { EditorModule } from '@tinymce/tinymce-angular';
import { SourceRootEditDialog } from './source/source-root-edit-dialog/source-root-edit.dialog';
import { PreSelectComponent } from './source/source-edit/pre-select/pre-select.component';
import { CompanyFieldExtractComponent } from './source/source-edit/company-field-extract/company-field-extract.component';
import { FieldExtractComponent } from './source/source-edit/field-extract/field-extract.component';
import { PatternExtractComponent } from './source/source-edit/pattern-extract/pattern-extract.component';
import { SourceEditComponent } from './source/source-edit/source-edit.component';
import { SourcesListComponent } from './source/sources-list/sources-list.component';
import { HtmlViewerDialog } from './source/source-edit/html-viewer/html-viewer.dialog';
import { MainModalComponent } from 'src/app/_metronic/partials/layout/modals/main-modal/main-modal.component';
import { Observable, of } from 'rxjs';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { PermissionsDetailDialog } from './user/user-list/permissions-detail/permissions-detail.dialog';
import { RoleAddDialog } from './user/user-list/role-add-dialog/role-add.dialog';
import { UserEditComponent } from './user/user-list/user-edit/user-edit.component';
import { UsersComponent } from './user/user-list/users.component';
import { RolesComponent } from './user/role-list/roles.component';
import { RoleEditComponent } from './user/role-list/role-edit/role-edit.component';
import { AddCommentDialog } from './user/user-list/add-comment-dialog/add-comment.dialog';
import { InlineSVGModule } from 'ng-inline-svg';
import { ConfigComponent } from './source/source-edit/config/config.component';
import { CheckCampaignsDialog } from './campaign/campaigns-list/check-campaigns/check-campaigns.dialog';
import { NgLetModule } from 'ng-let';
import { AliasTransformDialog } from './alias/alias-transform-dialog/alias-transform-dialog';
import { BackupScrapingLogComponent } from './scraping/backup-scraping-log/backup-scraping-log.component';


@Injectable()
export class EditSourceDeactivateGuard implements CanDeactivate<SourceEditComponent> {

	constructor(private modal: NgbModal){
	}

	canDeactivate(component: SourceEditComponent): Observable<boolean>{

		if (!component.compareWithOldSource()){
			return this.confirm(component);
		} else {
			return of(true);
		}

	}
	confirm(component: SourceEditComponent): Observable<boolean> {
   		 return new Observable(observer => {
			const _description = 'Are you sure to exit with saving?';

			const modalRef = this.modal.open(MainModalComponent, { animation: false});
			modalRef.componentInstance.modalData = {
				text: _description,
				yes: 'Save',
				cancel: 'Not save'
			};
			const subscr1 = modalRef.dismissed.subscribe( res => {
				observer.next(true);
				observer.complete();
				setTimeout(() => subscr1.unsubscribe(), 100);
			});
			const subscr2 = modalRef.closed.subscribe( res => {
				try {
					if (res) {
						component.save(false);
					}
				} catch (error) {

				}
				observer.next(true);
				observer.complete();
				setTimeout(() => subscr2.unsubscribe(), 100);
			});
    	});
	};
}

const routes: Routes = [
	{
		path: '',
		component: AdminComponent,
		children: [
			{
				path: 'campaigns',
				component: CampaignsListComponent,
				canActivate: [ModuleGuard],
				data: {permission: ['source']}
			},
			{
				path: 'companies',
				component: CompaniesListComponent,
				canActivate: [ModuleGuard],
				data: {permission: ['company']}
			},
			{
				path: 'companies/edit/:id',
				component: CompanyEditComponent,
				canActivate: [ModuleGuard],
				data: {permission: ['campaign', 'campaign_writable']}
			},
			{
				path: 'companies/add',
				component: CompanyEditComponent,
				canActivate: [ModuleGuard],
				data: {permission: ['campaign', 'campaign_writable']}
			},
			{
				path: 'aliases',
				component: AliasesListComponent,
				canActivate: [ModuleGuard],
				data: {permission: ['alias']}
			},
			{
				path: 'aliases/add',
				component: AliasEditComponent,
				canActivate: [ModuleGuard],
				data: {permission: ['alias', 'alias_writable']}
			},
			{
				path: 'aliases/edit/:id',
				component: AliasEditComponent,
				canActivate: [ModuleGuard],
				data: {permission: ['alias', 'alias_writable']}
			},
			{
				path: 'scraping',
				component: ScrapingLogComponent,
				canActivate: [ModuleGuard],
				data: {permission: ['scraping']}
			},
      {
				path: 'backup-scraping',
				component: BackupScrapingLogComponent,
				canActivate: [ModuleGuard],
				data: {permission: ['scraping']}
			},
			{
				path: 'sources',
				component: SourcesListComponent,
				canActivate: [ModuleGuard],
				data: {permission: ['source']}
			},
			{
				path: 'sources/add',
				component: SourceEditComponent,
				canActivate: [ModuleGuard],
				data: {permission: ['source', 'source_writable']}
			},
			{
				path: 'sources/edit/:id',
				component: SourceEditComponent,
				canActivate: [ModuleGuard],
				data: {permission: ['source', 'source_writable']},
				canDeactivate: [EditSourceDeactivateGuard]
			},
			{
				path: 'user-management/users',
				component: UsersComponent,
				canActivate: [ModuleGuard],
				data: {permission: ['user']}
			},
			{
				path: 'user-management/users/add',
				component: UserEditComponent,
				canActivate: [ModuleGuard],
				data: {permission: ['user', 'user_writable']}
			},
			{
				path: 'user-management/users/edit/:id',
				component: UserEditComponent,
				canActivate: [ModuleGuard],
				data: {permission: ['user', 'user_writable']}
			},
			{
				path: 'advertisement',
				component: AdvertisementComponent,
				canActivate: [ModuleGuard],
				data: {permission: ['advertisement']}
			},
			{
				path: 'user-management/roles',
				component: RolesComponent,
				canActivate: [ModuleGuard],
				data: {permission: ['user']}
			},
			{
				path: 'user-management/roles/add',
				component: RoleEditComponent,
				canActivate: [ModuleGuard],
				data: {permission: ['user', 'user_writable']}
			},
			{
				path: 'user-management/roles/edit/:id',
				component: RoleEditComponent,
				canActivate: [ModuleGuard],
				data: {permission: ['user', 'user_writable']}
			},
			{
				path: '',
				redirectTo: 'campaigns',
				pathMatch: 'full'
			},
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
		ComponentsModule,
		PerfectScrollbarModule,
		NgbModalModule,
		LpTableModule,
		EditorModule,
		NgMultiSelectDropDownModule,
		NgbDropdownModule,
		NgbTooltipModule,
		BsDatepickerModule.forRoot(),
		InlineSVGModule,
    NgLetModule
	],
	declarations: [
		AdminComponent,
		CampaignsListComponent,
		CompaniesListComponent,
		AliasesListComponent,
		CompanySearchDialog,
		CompanyEditComponent,
		AliasEditComponent,
		ScrapingLogComponent,
		ScrapingDetailDialog,
		SourcesListComponent,
		SourceEditComponent,
		ConfigComponent,
		PatternExtractComponent,
		FieldExtractComponent,
		CompanyFieldExtractComponent,
		PreSelectComponent,
		SourceRootEditDialog,
		AliasMergeDialog,
		// CampaignSelectDialog,
		AdvertisementComponent,
		AdvertisementCreateDialog,
		DailyDetailDialog,
		AliasInvolvedDialog,
		AliasMoveDialog,
		HtmlViewerDialog,
		UsersComponent,
		UserEditComponent,
		RoleAddDialog,
		PermissionsDetailDialog,
		RolesComponent,
    	RoleEditComponent,
		AddCommentDialog,
		CheckCampaignsDialog,
    AliasTransformDialog,
    BackupScrapingLogComponent
	],
	providers: [EditSourceDeactivateGuard]
})
export class AdminModule { }
