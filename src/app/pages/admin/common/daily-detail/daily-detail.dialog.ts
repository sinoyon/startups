import { KTUtil } from 'src/app/_metronic/kt';
// Angular
import { Component, OnInit, ViewChild, ChangeDetectionStrategy, OnDestroy, ViewRef, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
// Material
import { Observable, Subscription, BehaviorSubject } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';
import { cloneDeep, union, each, concat, find, findLast } from 'lodash';

import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import * as moment from 'moment';
import { LpTableComponent } from 'src/app/pages/common/lp-table/lp-table.component';
import { QueryResultsModel } from 'src/app/pages/common/models/query-results.model';
import { baseFilter } from 'src/app/pages/common/common';

@Component({
	selector: 'app-daily-detail-dialog',
	templateUrl: './daily-detail.dialog.html',
	styleUrls: ['./daily-detail.dialog.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class DailyDetailDialog implements OnInit, OnDestroy {

	locale = 'it-IT';

	loadingSubject = new BehaviorSubject<boolean>(true);
	loading$: Observable<boolean>;

	columnDefs: any[] = [];
	isEmptyTable = false;
	keptPage = -1;

	periodType = 'year';
	periodStart: Date = new Date(2021,0,1);
	periodEnd: Date = new Date(2022,0,0);
  periodRange: Date[] = [new Date((new Date()).getFullYear(),(new Date()).getMonth(),1),
		new Date((new Date()).getFullYear() + 1 ,(new Date()).getMonth() + 1,0)];
	items: any[] = [];
	
	forIncrease = true;

	@ViewChild('tableCtrl', {static: true}) tableCtrl: LpTableComponent;
	@ViewChild('datetimePicker1', {static: false}) datetimePicker;


	private unsubscribe: Subscription[] = [];

	constructor(
		private cdr: ChangeDetectorRef,
		private translate: TranslateService,
		public modal: NgbActiveModal) { }

	ngOnInit() {
		this.loading$ = this.loadingSubject.asObservable();

		this.unsubscribe.push(this.translate.onLangChange.subscribe( lang => {
			this.updateByTranslate(lang.lang);
		}));
		this.updateByTranslate(this.translate.currentLang);

	}

	ngOnDestroy() {
		this.unsubscribe.forEach(el => el.unsubscribe());
		if (this.datetimePicker) {
			this.datetimePicker.close();
		}
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
		var columnDefs;
		if (this.forIncrease) {
			columnDefs = [
				{ headerName: this.translate.instant('Date') ,filter: 'agTextColumnFilter', field: 'date', editable: false, minWidth: 200, sortable: false,
					cellRenderer: param => {
						if (param.data && param.data.date) {
							return this.getDateStringFromDate(param.data.date);
						}
					}
				},
				{ headerName: this.translate.instant('Money raised') ,filter: 'agTextColumnFilter', field: 'raised', editable: false, minWidth: 100, sortable: false,
				},
				{ headerName: this.translate.instant('Number of investors') ,filter: 'agTextColumnFilter', field: 'investorCount', editable: false, minWidth: 100, sortable: false,
					cellClass: 'last-column-cell custom-cell'
				},
			];
		} else {
			columnDefs = [
				{ headerName: this.translate.instant('Campaign Name'), filter: 'agTextColumnFilter', field: 'name', editable: false, minWidth: 100, sortable: false,
					cellRenderer: param => {
						if (param.data && param.data.name) {
							return param.data.name;
						}
					}
				},
				{ headerName: this.translate.instant('Link'), filter: 'agTextColumnFilter', field: 'link', editable: false, minWidth: 200, sortable: false,
					cellRenderer: param => {
						if (param.data && param.data.link) {
							return param.data.link;
						}
					}
				},
				{ headerName: this.translate.instant('Address'), filter: 'agTextColumnFilter', field: 'address', editable: false, minWidth: 200, sortable: false,
					cellRenderer: param => {
						if (param.data && param.data.address) {
							return param.data.address;
						}
					}
				},
				{ headerName: this.translate.instant('Source'), filter: 'agTextColumnFilter', field: 'sourceName', editable: false, minWidth: 100, sortable: false, cellClass: 'last-column-cell custom-cell',
					cellRenderer: param => {
						if (param.data && param.data.sourceName) {
							return param.data.sourceName;
						}
					}
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
		this.loadingSubject.next(true);
		var result;
		if (this.forIncrease) {
			let start; let end;
			start = moment(this.periodStart).startOf('day');
			if (this.periodType == 'day') {
				end = moment(this.periodStart).endOf('day');
			} else if (this.periodType == 'none') {
				start = moment(new Date(1970, 0, 0));
				end = moment(new Date(2200, 0, 0));
			} else {
				end = moment(this.periodEnd).endOf('day');
			}

			result = baseFilter(this.items.filter(el => {
				const date = moment(el.date);

				if (end && !end.isAfter(start)) {return false;}

				return date.isAfter(start) && end.isAfter(date);

			}, ).map( (el, index) => ({...el, id: el._id || index})).sort( (a,b) => {
				if (a.date > b.date) {
					return -1;
				} else if (a.date == b.date) {
					return 0;
				} else
					{return 1;}
			}), {
				page: param.payload.pageSize == 0 ? 0 : Math.trunc(param.payload.startRow / param.payload.pageSize),
				pageSize: param.payload.pageSize
			});
		} else {
			result = baseFilter(this.items, {
				page: param.payload.pageSize == 0 ? 0 : Math.trunc(param.payload.startRow / param.payload.pageSize),
				pageSize: param.payload.pageSize
			});
		}

		console.info('result == ', result, ', playload = ', param.payload);

		if (result) {
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
		if (param.type == 'ENTER') {
			const node = this.tableCtrl.gridApi.getRowNode(ids[0]);
			if (node && node.data && node.data.link) {
				window.open(node.data.link);
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
	getDateStringFromDate(param): string {
		const date = new Date(param);
		return date.toLocaleString(this.locale, {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
		}).replace(', ', ', h:');
	}
	getDateTimeFromDate(param, format = 'datetime'): string {
		const date = new Date(param);
		if (format == 'datetime') {
			return date.toLocaleString(this.locale, {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit'
			}).replace(', ', ', h:');
		} else if (format == 'day') {
			return date.toLocaleString(this.locale, {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
			});
		} else if (format == 'year') {
			return date.toLocaleString(this.locale, {
				year: 'numeric',
			});
		} else if (format == 'month') {
			return date.toLocaleString(this.locale, {
				year: 'numeric',
				month: '2-digit'
			});
		}
	}
	onDateChanged(event) {
		this.periodStart = new Date(event);
		if (this.periodType == 'year') {
			this.periodEnd = new Date(this.periodStart.getFullYear() + 1, 0, 0);
		} else if (this.periodType == 'month') {
			const dt = new Date(this.periodStart);
			this.periodEnd = new Date(dt.setMonth(dt.getMonth() + 1));
		}
		this.tableCtrl.willRefreshTable.next('DATA');
	}
	onChangePeriodType(event) {
		if (this.periodType == 'year') {
			this.periodStart.setMonth(0);
			this.periodEnd = new Date(this.periodStart.getFullYear() + 1, 0, 0);
		} else if (this.periodType == 'month') {
			const dt = new Date(this.periodStart);
			this.periodEnd = new Date(dt.setMonth(dt.getMonth() + 1));
		}
		this.tableCtrl.willRefreshTable.next('DATA');
	}
  onDateRangeChanged(event) {
		this.periodStart = new Date(event[0]);
		this.periodEnd = moment(event[1]).endOf('day').toDate();
		this.tableCtrl.willRefreshTable.next('DATA');
	}
}
