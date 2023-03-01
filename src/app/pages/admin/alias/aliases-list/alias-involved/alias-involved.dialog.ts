// Angular
import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef, Inject, ViewChild, ViewRef } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, BehaviorSubject, Subject } from 'rxjs';

import { cloneDeep, concat } from 'lodash';
import * as objectPath from 'object-path';
import { CompanyService } from 'src/app/pages/common/company.service';
import { LpTableComponent } from 'src/app/pages/common/lp-table/lp-table.component';
import { CampaignService } from 'src/app/pages/common/campaign.service';
import { QueryResultsModel } from 'src/app/pages/common/models/query-results.model';
import { MainModalComponent } from 'src/app/_metronic/partials/layout/modals/main-modal/main-modal.component';

@Component({
	selector: 'app-alias-involved-dialog',
	templateUrl: './alias-involved.dialog.html',
	styleUrls: ['./alias-involved.dialog.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AliasInvolvedDialog implements OnInit, OnDestroy {

	locale = 'it-IT';

	loadingSubject = new BehaviorSubject<boolean>(true);
	loading$: Observable<boolean>;

	columnDefs: any[] = [];
	isEmptyTable = false;
	keptPage = -1;

	alias;

	@ViewChild('tableCtrl', {static: true}) tableCtrl: LpTableComponent;

	private unsubscribe: Subscription[] = [];

	constructor(
		private cdr: ChangeDetectorRef,
		private translate: TranslateService,
		public modal: NgbActiveModal,
		private companyService: CompanyService,
		private modalT: NgbModal,
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
		this.tableCtrl.selectionPreviewColumns = [{field: 'name'}];
		let columnDefs;

		if (!this.alias) {
			columnDefs = [];
		} else if (this.alias.type == 'campaign.tag') {
			columnDefs = [
				{ headerName: this.translate.instant('Name') ,filter: 'agTextColumnFilter', field: 'name', editable: false, minWidth: 200 ,pinned: 'left'},
				{ headerName: this.translate.instant('Source') ,filter: 'agTextColumnFilter', field: 'source', editable: false, minWidth: 100,
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
				},{ headerName: this.translate.instant('Typology'), field: 'typology',editable: false, sortable: false,
					cellRenderer: (param) => {
						if (param.data && param.data.typology) {
							switch (param.data.typology) {
								case 'company equity':
									return `<span class="badge rounded-0 badge-success text-uppercase">Company equity</span>`;
								case 'company lending':
									return `<span class="badge rounded-0 badge-light-success text-uppercase">Company lending</span>`;
								case 'real estate equity':
									return `<span class="badge rounded-0 badge-primary text-uppercase">Real estate equity</span>`;
								case 'real estate lending':
									return `<span class="badge rounded-0 badge-light-primary text-uppercase">Real estate lending</span>`;
								case 'minibond':
									return `<span class="badge rounded-0 badge-warning text-uppercase">Minibond</span>`;
								default:
									break;
							}
						}
					},
					cellClass: 'last-column-cell custom-cell'
				},
				{
					action: 'ENTER_IN',	width: 42, fixed: true, pinned: 'right', editable: false, sortable: false,
					cellRenderer:  param => {
						if (param.data) {
							return `<a target="_blank" href="${window.location.origin + '/crowdfunding/' + param.data.systemTitle}"><i class="fa fa-link" style="color: blue"></i></a>`;
						}
					}
				},
				{
					action: 'ENTER',	width: 42, fixed: true, pinned: 'right', editable: false, sortable: false,
					cellRenderer:  param => {
						if (param.data) {
							return `<i class="fa fa-link" style="${param.data.link? '': 'opacity: 0.4; cursor: not-allowed'}"></i>`;
						}
					},
					tooltip: param => {
						if (param && param.data && param.data.link){
							return param.data.link;
						}
					}
				},
			];
		} else if (this.alias.type == 'company.type') {
			columnDefs = [
				{ headerName: this.translate.instant('Name') ,filter: 'agTextColumnFilter', field: 'name', editable: false,  minWidth: 200},
				{ headerName: this.translate.instant('Type'), field: 'type.names.value', editable: false,
					cellRenderer: param => {
						if (param.data && param.data.type){
							return param.data.type.names[0].value;
						}
					},
				},
				{ headerName: this.translate.instant('Involved Campaigns'), field: 'campaigns', editable: false,
					cellRenderer: param => {
						if (param.data && param.data.campaigns){
							setTimeout( () => {
								param.data.campaigns.forEach(c => {
									const campaignButton = param.eGridCell.querySelector('#theCampaign-'+ c._id);
									if (campaignButton) {
										campaignButton.addEventListener('click', () => {
											this.onClickViewCampaign(c._id);
										});
									}
								});
							}, 0);
							return param.data.campaigns.map( c => {
								if (c) {
									let statusClass;
									switch (c.status) {
										case '1_ongoing':
											statusClass = 'badge badge-success rounded-0 text-uppercase';
											break;
										case '2_comingsoon':
											statusClass = 'badge badge-warning rounded-0 text-uppercase';
											break;
										case '3_funded':
											statusClass = 'badge badge-light-primary rounded-0 text-uppercase';
											break;
										case '4_closed':
											statusClass = 'badge badge-secondary rounded-0 text-uppercase';
											break;
										case '5_extra':
											statusClass = 'badge badge-info rounded-0 text-uppercase';
											break;
										case '6_refunded':
											statusClass = 'badge badge-light-success rounded-0 text-uppercase';
											break;
										default:
											break;
									}
									if (statusClass)
									{
										return `<span id="theCampaign-${c.id}"
											class="${statusClass}">${c.name}</span>`;
									}
								}
								return ' ';
							}).join('');
						}
					},
					cellClass: 'last-column-cell custom-cell'
				},

			];
		}
		this.columnDefs = columnDefs;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
		this.tableCtrl.willRefreshTable.next('COLUMNS');
		this.tableCtrl.willRefreshTable.next('ROWS');
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
		if (param.type == 'ENTER') {
			const node = this.tableCtrl.gridApi.getRowNode(ids[0]);
			if (node && node.data && node.data.link) {
				window.open(node.data.link);
			}
		}
	}

	async onPaginationChanged(param) {
		this.loadingSubject.next(true);

		if (!this.alias) {
			param.cb([], 0);
			this.loadingSubject.next(false);
		}
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
		if (this.alias.type == 'campaign.tag') {
			payload.filterModel.tags = {
				or: true,
				filter: [[{ key: 'company.tags', filterType: 'set', values: [this.alias._id], isObject: true}], [{ key: 'tags', filterType: 'set', values: [this.alias._id],isObject: true}]]
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
		} else if (this.alias.type == 'company.type') {
			payload.filterModel.type = {
				filterType: 'set',
				values: [this.alias._id]
			};
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
			if (this.alias.type == 'campaign.tag') {
				res = await this.campaignService.get(payload, {
					source: 'name'
				});
			} else if (this.alias.type == 'company.type') {
				res = await this.companyService.get(payload, {
					source: 'name'
				});
			}

			if (!res) {throw {};}
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
	async onClickViewCampaign(campaignId){
		if (campaignId) {

			try {
				const campaign = await this.campaignService.getById(campaignId);
				if (!campaign) {throw {};}


				campaign.tags = campaign.tags.map( el => el.names[0].value);

				const modalRef = this.modalT.open(MainModalComponent, { animation: false});

				modalRef.componentInstance.modalData = {
					key_values: ['name','source.name', 'status', 'tags', 'typology', 'link'].map( key => ({
							key,
							value: objectPath.get(campaign, key)
						}))
				};
			} catch (error) {

			}
		}
	}
}
