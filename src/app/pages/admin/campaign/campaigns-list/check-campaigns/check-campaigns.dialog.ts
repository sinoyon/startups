// Angular
import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef, Inject, ViewChild, ViewRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, BehaviorSubject, Subject } from 'rxjs';

import { cloneDeep, concat, intersection } from 'lodash';
import { LpTableComponent } from 'src/app/pages/common/lp-table/lp-table.component';
import { CampaignService } from 'src/app/pages/common/campaign.service';
import { QueryResultsModel } from 'src/app/pages/common/models/query-results.model';

import { KTUtil } from 'src/app/_metronic/kt';


@Component({
	selector: 'app-check-campaigns-dialog',
	templateUrl: './check-campaigns.dialog.html',
	styleUrls: ['./check-campaigns.dialog.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckCampaignsDialog implements OnInit, OnDestroy {

	locale = 'it-IT';

	loadingSubject = new BehaviorSubject<boolean>(false);
	loading$: Observable<boolean>;

	columnDefs: any[] = [];
	isEmptyTable = false;
	keptPage = -1;

	items = [];

	@ViewChild('tableCtrl', {static: true}) tableCtrl: LpTableComponent;

	private unsubscribe: Subscription[] = [];

	constructor(
		private cdr: ChangeDetectorRef,
		private translate: TranslateService,
		public modal: NgbActiveModal,
		private campaignService: CampaignService) { }

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
		let columnDefs = [];

		columnDefs = [
			{ headerName: this.translate.instant('Name') ,filter: 'agTextColumnFilter', field: 'name', editable: false, minWidth: 200, sortable: false,
			},
			{ headerName: this.translate.instant('Source') ,filter: 'agTextColumnFilter', field: 'sourceName', editable: false, minWidth: 100, sortable: false,
			},
			{ headerName: this.translate.instant('Company') ,filter: 'agTextColumnFilter', field: 'company', editable: false,  minWidth: 150, sortable: false,
				cellRenderer: (param) => {
					if (param.data) {
						let result = '';
						const companyNameHtml = `<span id="theName" class="show-action">
						${param.data.company? (param.data.company.name.substr(0,20) + (param.data.company.name.length > 20 ? '...': '')): ''}</span>`;
						if (param.data.company) {
							result = companyNameHtml;
						}
						const confirmButtonHtml = `<span id="theConfirmButton" class="action" ><i class='la la-check'></i></span>`;
						if (!param.data.companyConfirmed) {
							result += confirmButtonHtml;
						}
						return result;
					}
				}
			},
			{ headerName: this.translate.instant('Link') ,filter: 'agTextColumnFilter', field: 'link', editable: false, minWidth: 200 ,sortable: false,
			cellRenderer: (param) => {
				if (param.data && param.data.link) {
					return `<a href="${param.data.link}" target="_blank">${param.data.link}</a>`;
				}
			}
			},
			{ headerName: this.translate.instant('Status'), filter: 'agTextColumnFilter',field: 'status',editable: false,
			 minWidth: 100, sortable: false,
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
						if (statusClass && statusText) {
							return `<span
								class="${statusClass}">${statusText}</span>`;
						}
					}
				},
			},
			{ headerName: this.translate.instant('Created At') ,filter: 'agDateColumnFilter', field: 'createdAt', editable: false,sortable: false,
				cellRenderer: param => {
					if (param.data && param.data.createdAt) {
						return this.getDateTimeFromDate(param.data.createdAt);
					}
				},
			},
			{ headerName: this.translate.instant('Updated At') ,filter: 'agDateColumnFilter', field: 'updatedAt', editable: false,sortable: false,
				cellRenderer: param => {
					if (param.data && param.data.updatedAt) {
						return this.getDateTimeFromDate(param.data.updatedAt);
					}
				},
				cellClass: isMobile? 'custom-cell': 'last-column-cell custom-cell'
			},
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

		let result: QueryResultsModel;
		try {
			result = new QueryResultsModel(this.items, this.items.length);
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
		this.tableCtrl.gridApi.forEachNode( (node, index) => {
			if (node.data && node.data && !node.data.main) {
				node.setSelected(true);
			}
		});
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
		this.modal.close({ids: this.tableCtrl.originSelectedRowIds});
	}
}
