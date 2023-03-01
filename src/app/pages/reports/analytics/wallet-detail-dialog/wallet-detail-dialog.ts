// Angular
import { Component, OnInit, ViewChild, ChangeDetectionStrategy, OnDestroy, ViewRef, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription, BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { cloneDeep } from 'lodash';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { LpTableComponent } from 'src/app/pages/common/lp-table/lp-table.component';
import { AliasService } from 'src/app/pages/common/alias.service';
import { KTUtil } from 'src/app/_metronic/kt';
import { QueryResultsModel } from 'src/app/pages/common/models/query-results.model';

@Component({
	selector: 'app-wallet-detail-dialog',
	templateUrl: './wallet-detail-dialog.html',
	styleUrls: ['./wallet-detail-dialog.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class WalletDetailDialog implements OnInit, OnDestroy {

	locale = 'it-IT';
	loadingSubject = new BehaviorSubject<boolean>(true);
	loading$: Observable<boolean>;

	columnDefs: any[] = [];
	items: any[] = [];

	type = 'wallet';

	isEmptyTable = false;
	@ViewChild('tableCtrl', {static: true}) tableCtrl: LpTableComponent;

	private unsubscribe: Subscription[] = [];

	constructor(
			private activatedRoute: ActivatedRoute,
			private cdr: ChangeDetectorRef,
			private router: Router,
			private translate: TranslateService,
			public modal: NgbActiveModal,
			private aliasService: AliasService
			) {

		this.loading$ = this.loadingSubject.asObservable();
	}

	ngOnInit() {
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

		var columnDefs: any[] = [];

		if (this.type == 'wallet') {
			columnDefs = [
				{ headerName: this.translate.instant('Campaign Name') ,
					field: 'campaign.name',
					filter: 'agTextColumnFilter', editable: false, minWidth: 200
				},
				{ headerName: this.translate.instant('Source Name') ,
					field: 'campaign.source.name',
					filter: 'agTextColumnFilter', editable: false, minWidth: 200
				},
				{ headerName: this.translate.instant('Status'), filter: 'agTextColumnFilter', field: 'status', editable: false, sortable: true, minWidth: 100,
					cellRenderer: (param) => {
						if (param.data && param.data.campaign) {
							let statusClass; let statusText;
							switch (param.data.campaign.status) {
								case '1_ongoing':
									statusClass = 'label label-inline label-success label-square text-uppercase';
									statusText = 'ongoing';
									break;
								case '2_comingsoon':
									statusClass = 'label label-inline label-warning label-square text-uppercase';
									statusText = 'coming soon';
									break;
								case '3_funded':
									statusClass = 'label label-inline label-light-primary label-square text-uppercase';
									statusText = 'closed funded';
									break;
								case '4_closed':
									statusClass = 'label label-inline label-secondary label-square text-uppercase';
									statusText = 'closed not funded';
									break;
								case '5_extra':
									statusClass = 'label label-inline label-info label-square text-uppercase';
									statusText = 'closing';
									break;
								case '6_refunded':
									statusClass = 'label label-inline label-light-success label-square text-uppercase';
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
					}
				},
				{ headerName: this.translate.instant('Amount') ,
					action: 'VIEW',
					field: 'amountInvested',
					cellRenderer: (param) => {
						if (param.data && param.data.amountInvested) {
							return `<span
									class="label label-inline label-light-primary label-square text-uppercase">${this.addCommas(Math.round((param.data.amountInvested + Number.EPSILON) * 100) / 100) + ' €'}</span>`;
						}
					},
					cellClass: isMobile? 'custom-cell': 'last-column-cell custom-cell'
				}
			];
		} else if (this.type == 'campaign') {
			columnDefs = [
				{ headerName: this.translate.instant('Campaign Name') ,
					field: 'name',
					filter: 'agTextColumnFilter', editable: false, minWidth: 100
				},
				// { headerName: this.translate.instant('Description') ,
				// 	field: 'description',
				// 	filter: 'agTextColumnFilter', editable: false, minWidth: 200, maxWidth: 300
				// },
				{ headerName: this.translate.instant('Link') ,
					field: 'link',
					filter: 'agTextColumnFilter', editable: false, minWidth: 200
				},
				{ headerName: this.translate.instant('Source Name') ,
					field: 'source.name',
					filter: 'agTextColumnFilter', editable: false, minWidth: 200
				},
				{ headerName: this.translate.instant('Status'), filter: 'agTextColumnFilter', field: 'status', editable: false, sortable: true, minWidth: 100,
					cellRenderer: (param) => {
						if (param.data && param.data.status) {
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
					}
				},
				{ headerName: this.translate.instant('Typology') ,
					field: 'typology',
					filter: 'agTextColumnFilter', editable: false, minWidth: 100
				},
				{
					action: 'ENTER_IN', width: 42, fixed: true, pinned: isMobile ? null : 'right', editable: false, sortable: false,
					cellRenderer: param => {
						if (param.data) {
							return `<a target="_blank" href="${window.location.origin + '/crowdfunding/' + param.data.systemTitle}"><i class="fa fa-link" style="color: blue"></i></a>`;
						}
					}
				},
				{
					action: 'ENTER', width: 42, fixed: true, pinned: isMobile ? null : 'right', editable: false, sortable: false,
					cellRenderer: param => {
						if (param.data) {
							return `<i class="fa fa-link" style="${param.data.link ? '' : 'opacity: 0.4; cursor: not-allowed'}"></i>`;
						}
					},
					tooltip: param => {
						if (param && param.data && param.data.link) {
							return param.data.link;
						}
					}
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

	async onPaginationChanged(param) {
		this.tableCtrl.isLoading.next(true);
		try {
			const payload = cloneDeep(param.payload);
			const isFiltered = Object.keys(payload.filterModel).length > 0;
			const filter = {};
			Object.keys(payload.filterModel).forEach( key => {
				const field = key.replace(/_\d/, '');
				if (payload.filterModel[key].filterType == 'text'){
					filter[field] = payload.filterModel[key].filter;
				} else if ( payload.filterModel[key].filterType == 'date') {
					const m = moment(payload.filterModel[key].dateFrom);
					filter[field] = {
						gte: m.toDate().getTime(),
						lt: m.hour(23).minute(59).second(59).toDate().getTime()
					};
				}
			});

			const result = new QueryResultsModel(this.items);

			if (result) {
				this.isEmptyTable = !isFiltered && this.items.length == 0;
				param.cb(result.items, result.totalCount);
			} else {
				param.cb([], 0);
			}
		} catch (error) {
			console.log(error);
		}

		this.loadingSubject.next(false);
	}

	async onAction(param) {
		const ids = param.payload;
		const node = this.tableCtrl.gridApi.getRowNode(ids[0]);
		if (ids.length == 1) {
			if (node) {
				node.setSelected(this.tableCtrl.originSelectedRowIds.includes(ids[0]));
			}
		}

		if (param.type == 'ENTER') {
			if (this.type == 'campaign') {
				if (node && node.data && node.data.link) {
					window.open(node.data.link);
				}
			}
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

}
