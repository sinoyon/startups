// Angular
import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef, Inject, ViewChild, ViewRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, BehaviorSubject, Subject } from 'rxjs';

import { cloneDeep, concat, intersection } from 'lodash';
import { LpTableComponent } from 'src/app/pages/common/lp-table/lp-table.component';
import { AdvertisementService } from 'src/app/pages/common/advertisement.service';
import { SourceService } from 'src/app/pages/common/source.service';
import { CampaignService } from 'src/app/pages/common/campaign.service';
import { KTUtil } from '../../../../_metronic/kt';
import { QueryResultsModel } from 'src/app/pages/common/models/query-results.model';

@Component({
	selector: 'app-advertisement-create-dialog',
	templateUrl: './advertisement-create.dialog.html',
	styleUrls: ['./advertisement-create.dialog.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdvertisementCreateDialog implements OnInit, OnDestroy {

	locale = 'it-IT';

	loadingSubject = new BehaviorSubject<boolean>(false);
	loading$: Observable<boolean>;

	columnDefs: any[] = [];
	isEmptyTable = false;
	keptPage = -1;


	types: any[] = [
		{
			type: 'campaign',
			label: 'Campaign'
		},
		{
			type: 'campaign',
			adv: true,
			label: 'Campaign ADV'
		},
		{
			type: 'source',
			label: 'Source'
		},
		{
			type: 'source',
			adv: true,
			label: 'Source ADV'
		}
	];

	activeType;

	typologies = [];
	exceptedCampaigns = [];
	exceptedSources = [];
	countries = [];

	@ViewChild('tableCtrl', {static: true}) tableCtrl: LpTableComponent;

	private unsubscribe: Subscription[] = [];

	constructor(
		private cdr: ChangeDetectorRef,
		private translate: TranslateService,
		public modal: NgbActiveModal,
		private advertisementService: AdvertisementService,
		private sourceService: SourceService,
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
		let columnDefs = [];
		if (!this.activeType) {return;}

		if (this.activeType.type == 'campaign') {
			columnDefs = [
				{ headerName: this.translate.instant('Name') ,filter: 'agTextColumnFilter', field: 'name', editable: false, minWidth: 200 ,pinned: 'left'},
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
					cellClass: isMobile? 'custom-cell': 'last-column-cell custom-cell'
				},
			];
		} else if (this.activeType.type == 'source') {
			columnDefs = [
				{ headerName: this.translate.instant('Name') ,filter: 'agTextColumnFilter', field: 'name', editable: false, minWidth: 200 ,pinned: 'left',
				cellClass: isMobile ? 'custom-cell' :'last-column-cell custom-cell'},
			];
		}
		this.columnDefs = columnDefs;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}

		this.tableCtrl.willRefreshTable.next('COLUMNS');
		this.tableCtrl.willRefreshTable.next('ROWS');
	}

	async onPaginationChanged(param) {

		if (!this.activeType) {
			param.cb([], 0);
			this.isEmptyTable = true;
			return;
		}
		this.tableCtrl.disabledRowIds = [];
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

		if (this.activeType.type == 'campaign') {
			payload.filterModel._id = {
				filterType: 'set_r',
				values: this.exceptedCampaigns,
				isObject: true
			};
			if (Object.keys(payload.filterModel).find( key => key == 'source')) {
				payload.filterModel['source.name'] = payload.filterModel.source;
				delete payload.filterModel.source;
			}
			if (!Object.keys(payload.filterModel).find( key => key == 'status')) {
				payload.filterModel.status = {
					filterType: 'ne',
					value: null
				};
			}
			payload.filterModel.typology = {
				filterType: 'set',
				values: this.typologies
			};
			if (this.countries.length) {
				payload.filterModel.country = {
					filterType: 'set',
					values: this.countries
				};
			}
		} else if (this.activeType.type == 'source') {
			payload.filterModel._id = {
				filterType: 'set_r',
				values: this.exceptedSources,
				isObject: true
			};
			payload.filterModel.type = {
				filterType: 'eq',
				value: 'root'
			};
			payload.filterModel.involvedCampaignTypologies = {
				filterType: 'set',
				values: this.typologies
			};
			if (this.countries.length) {
				payload.filterModel.involvedCampaignCountries = {
					filterType: 'set',
					values: this.countries
				};
			}
		}

		if (payload.sortModel && !payload.sortModel.find( e => e.colId && e.colId.indexOf('status') >= 0)) {
			payload.sortModel.push({ colId: 'status', sort: 'asc'});
		}
		if (payload.sortModel && !payload.sortModel.find( e => e.colId && e.colId.indexOf('name') >= 0)) {
			payload.sortModel.push({ colId: 'name', sort: 'asc'});
		}

		let result: QueryResultsModel;
		try {
			let res;
			if (this.activeType.type == 'campaign') {
				res = await this.campaignService.get(payload, {
					source: 'name link logo description'
				});
				if (!res) {throw {};}

			} else if (this.activeType.type == 'source') {
				res = await this.sourceService.getRootWithPagination(payload);
				if (!res) {throw {};}
			}

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
	async onYesClick() {
		this.loadingSubject.next(true);

		try {
			const res = await this.advertisementService.create({
				type: this.activeType.type,
				typeId: this.tableCtrl.originSelectedRowIds[0],
				mini: this.activeType.mini,
			});

		} catch (error) {

		}
		this.loadingSubject.next(false);
		this.modal.close();
	}
	async onChangeType(){

		if (this.activeType.adv) {
			try {
				const res = await this.advertisementService.create({
					type: this.activeType.type,
					mini: this.activeType.mini
				});
			} catch (error) {
			}
			this.modal.close();
		} else {
			this.defineColumns();
			this.tableCtrl.willRefreshTable.next('DATA');
		}
	}
}
