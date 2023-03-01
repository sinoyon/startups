// Angular
import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef, Inject, ViewChild, ViewRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, BehaviorSubject, Subject } from 'rxjs';

import { cloneDeep } from 'lodash';
import { LpTableComponent } from 'src/app/pages/common/lp-table/lp-table.component';
import { SourceService } from 'src/app/pages/common/source.service';
import { KTUtil } from 'src/app/_metronic/kt';
import { QueryResultsModel } from 'src/app/pages/common/models/query-results.model';
import { ToastService } from 'src/app/pages/common/toast.service';

@Component({
	selector: 'app-source-select-dialog',
	templateUrl: './source-select.dialog.html',
	styleUrls: ['./source-select.dialog.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SourceSelectDialog implements OnInit, OnDestroy {

	locale = 'it-IT';

	loadingSubject = new BehaviorSubject<boolean>(true);
	loading$: Observable<boolean>;

	columnDefs: any[] = [];
	isEmptyTable = false;
	keptPage = -1;

	min = 1;
	max = 100;
	exceptedIds = [];

	@ViewChild('tableCtrl', {static: true}) tableCtrl: LpTableComponent;

	private unsubscribe: Subscription[] = [];

	constructor(
		private cdr: ChangeDetectorRef,
		private translate: TranslateService,
		private toastService: ToastService,
		public modal: NgbActiveModal,
		private sourceService: SourceService) { }

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
		this.tableCtrl.selectionPreviewColumns = [{field: 'name'}];
		const columnDefs: any[] = [
			{ headerName: this.translate.instant('Name') ,filter: 'agTextColumnFilter', field: 'name', editable: false, pinned: isMobile? null: 'left', minWidth: 200,
			},
			{ headerName: this.translate.instant('Source') ,filter: 'agTextColumnFilter', field: 'source', editable: false, pinned: isMobile? null: 'left', minWidth: 100,
				cellRenderer: param => {
					if (param.data && param.data.source) {
						return param.data.source.name;
					}
				}
			},
			{ headerName: this.translate.instant('Status'), filter: 'agTextColumnFilter',field: 'status',editable: false, sortable: true, minWidth: 100,
				cellRenderer: (param) => {
					if (param.data) {
						let statusClass; let statusText;
						switch (param.data.status) {
							case '1_ongoing':
								statusClass = 'badge rounded-0 badge-success text-uppercase';
								statusText = 'ongoing';
								break;
							case '2_comingsoon':
								statusClass = 'badge rounded-0 badge-warning text-uppercase';
								statusText = 'coming soon';
								break;
							case '3_funded':
								statusClass = 'badge rounded-0 badge-light-primary text-uppercase';
								statusText = 'closed funded';
								break;
							case '4_closed':
								statusClass = 'badge rounded-0 badge-secondary text-uppercase';
								statusText = 'closed not funded';
								break;
							case '5_extra':
								statusClass = 'badge rounded-0 badge-info text-uppercase';
								statusText = 'closing';
								break;
							case '6_refunded':
								statusClass = 'badge rounded-0 badge-light-success text-uppercase';
								statusText = 'refunded';
								break;
							default:
								break;
						}
						if (statusClass && statusText)
						{
							return `<span
								class="${statusClass}">${statusText}</span>`;
						}

					}
				},
				cellClass: isMobile? 'custom-cell' :'last-column-cell custom-cell'
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
		this.loadingSubject.next(true);``;
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
		if (!Object.keys(payload.filterModel).find( key => key == 'status')) {
			payload.filterModel.status = {
				filterType: 'ne',
				value: null
			};
		}
		payload.filterModel._id = {
			filterType: 'set_r',
			values: this.exceptedIds
		};
		if (Object.keys(payload.filterModel).find( key => key == 'source')) {
			payload.filterModel['source.name'] = payload.filterModel.source;
			delete payload.filterModel.source;
		}
		if (payload.sortModel && !payload.sortModel.find( e => e.colId && e.colId.indexOf('status') >= 0)) {
			payload.sortModel.push({ colId: 'status', sort: 'asc'});
		}
		if (payload.sortModel && !payload.sortModel.find( e => e.colId && e.colId.indexOf('name') >= 0)) {
			payload.sortModel.push({ colId: 'name', sort: 'asc'});
		}
		let result: QueryResultsModel;
		try {
			const res = await this.sourceService.getWithPagination(payload, {
				source: 'name'
			});
			result = new QueryResultsModel(res.items, res.totalCount);
		} catch (error) {

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

	onAction(param) {

		const ids = param.payload;
		let selectedIds = ids;
		if (ids.length > 1) {
			selectedIds = this.tableCtrl.originSelectedRowIds;
		}
		if (ids.length == 1) {
			const node = this.tableCtrl.gridApi.getRowNode(ids[0]);
			if (node) {
				node.setSelected(this.tableCtrl.originSelectedRowIds.includes(ids[0]));
			}
		}
	}
	addCommas(nStr) {
		if (nStr == null) {
			return '';
		}
		nStr += '';
		const comma = /,/g;
		nStr = nStr.replace(comma,'');
		const x = nStr.split('.');
		let x1 = x[0];
		const x2 = x.length > 1 ? '.' + x[1] : '';
		const rgx = /(\d+)(\d{3})/;
		while (rgx.test(x1)) {
		  x1 = x1.replace(rgx, '$1' + ',' + '$2');
		}
		return (x1 + x2).replace(/,/g, ';').replace(/\./g, ',').replace(/;/g, '.');
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
	onYesClick() {
		if (this.tableCtrl.originSelectedRowIds.length > this.max) {
			this.toastService.show(this.translate.instant('Exceeded maximum selectable count: ' + this.max ));
			return;
		}

		const result = [...this.tableCtrl.originSelectedRowIds];
		this.modal.close(result);
	}
}
