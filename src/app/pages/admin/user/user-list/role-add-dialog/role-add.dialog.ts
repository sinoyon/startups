// Angular
import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef, Inject, ViewChild, ViewRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, BehaviorSubject, Subject } from 'rxjs';

import { cloneDeep, concat } from 'lodash';
import { LpTableComponent } from 'src/app/pages/common/lp-table/lp-table.component';
import { UserService } from 'src/app/pages/common/user.service';
import { KTUtil } from 'src/app/_metronic/kt';
import { QueryResultsModel } from 'src/app/pages/common/models/query-results.model';

@Component({
	selector: 'app-role-add-dialog',
	templateUrl: './role-add.dialog.html',
	styleUrls: ['./role-add.dialog.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoleAddDialog implements OnInit, OnDestroy {

	locale = 'it-IT';

	loadingSubject = new BehaviorSubject<boolean>(true);
	loading$: Observable<boolean>;

	columnDefs: any[] = [];
	isEmptyTable = false;
	keptPage = -1;

	excepted = [];

	@ViewChild('tableCtrl', {static: true}) tableCtrl: LpTableComponent;

	private unsubscribe: Subscription[] = [];

	constructor(
		private cdr: ChangeDetectorRef,
		private translate: TranslateService,
		public modal: NgbActiveModal,
		private userService: UserService) { }

	ngOnInit() {
		this.loading$ = this.loadingSubject.asObservable();
		this.unsubscribe.push(this.translate.onLangChange.subscribe( lang => {
			this.updateByTranslate(lang.lang);
		}));
		this.updateByTranslate(this.translate.currentLang);
	}

	ngOnDestroy() {
		this.unsubscribe.forEach(el => el.unsubscribe());
	}
	updateByTranslate(lang){
		if (lang == 'en') {
			this.locale = 'en-US';
		} else if (lang == 'it') {
			this.locale = 'it-IT';
		}
		this.defineColumns();
	}

	defineColumns() {
		const isMobile = KTUtil.isMobileDevice();
		this.tableCtrl.selectionPreviewColumns = [{field: 'description'}];
		const columnDefs = [
			{ headerName: this.translate.instant('Description') , filter: 'agTextColumnFilter', field: 'description',  minWidth: 200, editable: false},
      		{ headerName: this.translate.instant('Permissions') , filter: false, field: 'permission', editable: false,
				cellRenderer: param => {
					if (param.data && param.data.permissions) {
						const contentHtml = `<span>${param.data.permissions.length + ' permissions assigned'}</span>`;
						const actionBtnHtml =  param.data.permissions && param.data.permissions.length ? `<span id="theAction" class="action ml-2"><i class='la la-eye'></i></span>` : null;
						setTimeout( () => {
							const actionButton = param.eGridCell.querySelector('#theAction');
							if (actionButton) {
								actionButton.addEventListener('click', () => {
									// this.onShowPermissions(param.data);
								});
							}
						}, 0);

						return contentHtml + (actionBtnHtml || '');
					}
				},
        		cellClass:isMobile? 'custom-cell': 'last-column-cell custom-cell'
			}
		];

		this.columnDefs = columnDefs;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
		this.tableCtrl.willRefreshTable.next('COLUMNS');
		this.tableCtrl.willRefreshTable.next('ROWS');
	}

	async onPaginationChanged(param) {
		this.loadingSubject.next(true);
		const payload = cloneDeep(param.payload);
		const isFiltered = Object.keys(payload.filterModel).length > 0;
		Object.keys(payload.filterModel).forEach( el => {
			const field = el.replace(/_\d/, '');
			if (field != el){
				payload.filterModel[field] = { ...payload.filterModel[el]};
				delete payload.filterModel[el];
			}
		});
    Object.keys(payload.filterModel).forEach( el => {
			if (payload.filterModel[el].filterType == 'text' && payload.filterModel[el].type == 'equals') {
        payload.filterModel[el].filterType = 'set';
        payload.filterModel[el].values = payload.filterModel[el].filter.split(',').map( el => el.trim()).filter( el => el != '');
      }
		});
		payload.filterModel._id = {
			filterType: 'set_r',
			values: this.excepted
		};
		let result: QueryResultsModel;
		try {
			const res = await this.userService.getRoles(payload);
      		if (!res) {throw {};}
			result = new QueryResultsModel(res.items, res.totalCount);
		} catch (error) {
			console.log(error);
		}
		if (result) {
			this.isEmptyTable = !isFiltered && result.totalCount == 0;
			param.cb(result.items, result.totalCount);
		} else {
			param.cb([], 0);
		}
		this.loadingSubject.next(false);
		if (this.keptPage > 0 ){
			setTimeout(() => {
				this.tableCtrl.gridApi.paginationGoToPage(this.keptPage);
				this.keptPage = -1;
			}, 0);
		}
	}

	async onAction(param) {
		const ids = param.payload;
		let selectedIds = ids;
		if (ids.length > 1) {
			selectedIds = this.tableCtrl.originSelectedRowIds;
		}
		if(!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
	getDateTimeFromDate(param): string {
		const date = new Date(param);
		return date.toLocaleString(this.locale, {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		}).replace(', ', ', h:');
	}
	async onYesClick() {
		try {
			this.modal.close(this.tableCtrl.originSelectedRows);
		} catch (error) {

		}
	}
}
