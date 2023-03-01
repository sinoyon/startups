// Angular
import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef, Inject, ViewChild, ViewRef } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, BehaviorSubject, Subject } from 'rxjs';

import { KTUtil } from '../../../_metronic/kt/index';
import { cloneDeep, unionBy } from 'lodash';
import { LpTableComponent } from '../../common/lp-table/lp-table.component';
import { AliasService } from '../../common/alias.service';
import { CampaignService } from '../../common/campaign.service';
import { QueryResultsModel } from '../../common/models/query-results.model';
import { date2string } from '../../common/common';

@Component({
	selector: 'app-campaign-select-dialog',
	templateUrl: './campaign-select.dialog.html',
	styleUrls: ['./campaign-select.dialog.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CampaignSelectDialog implements OnInit, OnDestroy {

	locale = 'it-IT';

	loadingSubject = new BehaviorSubject<boolean>(true);
	loading$: Observable<boolean>;

	columnDefs: any[] = [];
	isEmptyTable = false;
	keptPage = -1;

	min = 1;
	max = 100;
	filter = {};
	staging = true;
	typology = 'all';

	@ViewChild('tableCtrl', {static: true}) tableCtrl: LpTableComponent;

	private unsubscribe: Subscription[] = [];

	countries = {
		it: 'italy',
		es: 'spain',
		fr: 'france',
		de: 'german',
		en: 'england'
	}

	constructor(
		public modalActive: NgbActiveModal,
		private cdr: ChangeDetectorRef,
		private translate: TranslateService,
		private modal: NgbModal,
		private aliasService: AliasService,
		private campaignService: CampaignService) { }

	ngOnInit() {
		this.loading$ = this.loadingSubject.asObservable();

		this.unsubscribe.push(this.translate.onLangChange.subscribe( lang => {
			this.updateByTranslate(lang.lang);
		}));
		this.updateByTranslate(this.translate.currentLang);

		this.tableCtrl.rowSelection = 'single';
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
			{ headerName: this.translate.instant('CAMPAIGNS.LIST.NAME') ,filter: 'agTextColumnFilter', field: 'name', editable: false, pinned: isMobile? null: 'left', minWidth: 200,  sortable: false,
			},
			{ headerName: this.translate.instant('CAMPAIGNS.LIST.COMPANY_NAME') ,filter: 'agTextColumnFilter', field: 'company.name', editable: false,  minWidth: 150,  sortable: false,
				cellRenderer: (param) => {
					if (param.data) {
						let result = '';
						const companyNameHtml = `<span id="theName" class="show-action">
						${param.data.company? (param.data.company.name.substr(0,20) + (param.data.company.name.length > 20 ? '...': '')): ''}</span>`;
						if (param.data.company) {
							result = companyNameHtml;
						}
						return result;
					}
				}
			},
			{ headerName: this.translate.instant('CAMPAIGNS.LIST.PLATFORM_NAME') ,filter: 'agTextColumnFilter', field: 'source.name', editable: false, minWidth: 100,  sortable: false,
				cellRenderer: param => {
					if (param.data && param.data.source) {
						return param.data.source.name;
					}
				}
			},
			{ headerName: this.translate.instant('CAMPAIGNS.LIST.STATE'), filter: 'agTextColumnFilter',field: 'status',editable: false, sortable: false, minWidth: 100,
				cellRenderer: (param) => {
					if (param.data) {
						let statusClass; let statusText;
						switch (param.data.status) {
							case '1_ongoing':
								statusClass = 'badge badge-success rounded-0 text-uppercase';
								statusText = 'ongoing';
								break;
							case '2_comingsoon':
								statusClass = 'badge badge-warning rounded-0 text-uppercase';
								statusText = 'coming soon';
								break;
							case '3_funded':
								statusClass = 'badge badge-light-primary rounded-0 text-uppercase';
								statusText = 'closed funded';
								break;
							case '4_closed':
								statusClass = 'badge badge-secondary rounded-0 text-uppercase';
								statusText = 'closed not funded';
								break;
							case '5_extra':
								statusClass = 'badge badge-info rounded-0 text-uppercase';
								statusText = 'closing';
								break;
							case '6_refunded':
								statusClass = 'badge badge-light-success rounded-0 text-uppercase';
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
			},
			{ headerName: this.translate.instant('OTHERS.country') ,filter: 'agTextColumnFilter', field: 'country',  sortable: false, editable: false, minWidth: 100
			},
			{ headerName: this.translate.instant('CAMPAIGNS.LIST.TAGS') ,filter: 'agTextColumnFilter', field: 'tags', editable: false, minWidth: 200,  sortable: false,
				cellRenderer: param => {
					if (param.data) {
						const campaignTags = [];
						const companyTags = param.data.company ? param.data.company.tags.map( el => ({
								_id: el._id,
								name: el.names[0].value,
								company: true
							})): [];
						const tags = unionBy(companyTags, campaignTags, '_id');
						const tagsHtml = tags.filter( el => el.company).map( (el, index) =>
						`<span class="badge badge-light-primary">${el.name}</span>`).join(' ') + tags.filter( el => !el.company).map( (el, index) =>
						`<span class="badge badge-secondary">${el.name}
						</span>`).join(' ');
						return tagsHtml;
					}
				},
			},
			{ headerName: this.translate.instant('CAMPAIGNS.LIST.START_DATE') ,filter: 'agDateColumnFilter', field: 'startDate', editable: false,
				cellRenderer: param => {
					if (param.data && param.data.startDate) {
						return date2string(param.data.startDate, this.locale);
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

		payload.filterModel.country = {
			filterType: 'eq',
			value: this.countries[this.translate.currentLang]
		};

		payload.filterModel = {
			...payload.filterModel,
			...this.filter
		};

		if (this.typology != 'all') {
			payload.filterModel.typology = {
				filterType: 'text',
				filter: this.typology
			};
		} else if (!this.staging) {
			payload.filterModel.typology = {
				filterType: 'ne',
				value: 'minibond'
			};
		}

		if (payload.sortModel && !payload.sortModel.find( e => e.colId && e.colId.indexOf('status') >= 0)) {
			payload.sortModel.push({ colId: 'status', sort: 'asc'});
		}
		if (payload.sortModel && !payload.sortModel.find( e => e.colId && e.colId.indexOf('name') >= 0)) {
			payload.sortModel.push({ colId: 'name', sort: 'asc'});
		}
		if (Object.keys(payload.filterModel).find( key => key == 'tags')) {

			let tags = [];
			try {
				tags = await this.aliasService.getTagIdsByName(payload.filterModel.tags.filter);
			} catch (error) {

			}
			payload.filterModel.tags = {
				or: true,
				filter: [[{ key: 'company.tags', filterType: 'set', values: tags, isObject: true}], [{ key: 'tags.value', filterType: 'set', values: tags,isObject: true}]]
			};
		}
		let result: QueryResultsModel;
		try {
			const res = await this.campaignService.get(payload, {
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
		if (this.keptPage >= 0 ){
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

	onYesClick() {
		if (this.tableCtrl.originSelectedRowIds.length > this.max) {
			// this.snack.open(this.translate.instant('Exceeded maximum selectable count: ' + this.max ), null, {
			// 	duration: 4000,
			// 	horizontalPosition: 'end',
			// 	verticalPosition: 'bottom',
			// });
			return;
		}

		const result = [...this.tableCtrl.originSelectedRows];
		this.modalActive.close(result);
	}
	onClickTypology(param) {
		this.typology = param;
		this.keptPage = 0;
		this.tableCtrl.willRefreshTable.next('DATA');
	}
}
