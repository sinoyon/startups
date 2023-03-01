// Angular
import { Component, OnInit, ViewChild, ChangeDetectionStrategy, OnDestroy, ViewRef, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
// Material
import { Observable, Subscription, BehaviorSubject } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';
import { cloneDeep, intersectionWith, union } from 'lodash';
import { Meta } from '@angular/platform-browser';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LpTableComponent } from 'src/app/pages/common/lp-table/lp-table.component';
import { ToastService } from 'src/app/pages/common/toast.service';
import { MessageService } from 'src/app/pages/common/message.service';
import { ScrapingService } from 'src/app/pages/common/scraping.service';
import { KTUtil } from 'src/app/_metronic/kt';
import { QueryResultsModel } from 'src/app/pages/common/models/query-results.model';
import { MainModalComponent } from 'src/app/_metronic/partials/layout/modals/main-modal/main-modal.component';
import { ScrapingDetailDialog } from '../scraping-detail-dialog/scraping-detail-dialog';
import { CountryService } from 'src/app/pages/common/country.service';
import { AuthService } from 'src/app/modules/auth';
import { emitKeypressEvents } from 'readline';


@Component({
	selector: 'app-backup-scraping-log',
	templateUrl: './backup-scraping-log.component.html',
	styleUrls: ['./backup-scraping-log.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class BackupScrapingLogComponent implements OnInit, OnDestroy {

	locale = 'it-IT';

	loadingSubject = new BehaviorSubject<boolean>(true);
	loading$: Observable<boolean>;

	columnDefs: any[] = [];
	isEmptyTable = false;
	keptPage = -1;
	startedAt: Date;

	progress;
	_countries = [];
	countries = [];
	writable = {
		typologies: [],
		countries: [],
		allowed: false,
    admin: false
	};

	multiSelectSettings = {
		singleSelection: false,
		idField: 'key',
		textField: 'title',
		selectAllText: 'Select All',
		enableCheckAll: true,
		unSelectAllText: 'UnSelect All',
		itemsShowLimit: 3,
		allowSearchFilter: false
	};

	selectedCountries = [];

	@ViewChild('tableCtrl', {static: true}) tableCtrl: LpTableComponent;

	private unsubscribe: Subscription[] = [];

	constructor(
		private cdr: ChangeDetectorRef,
		private router: Router,
		private translate: TranslateService,
		private meta: Meta,
		private toastService: ToastService,
		private modal: NgbModal,
		private messageService: MessageService,
		private scrapingService: ScrapingService,
		private auth: AuthService
	) {

	}

	ngOnInit() {

		const user = this.auth.currentUserValue;
    this._countries = user.countries.filter( el => ['italy','spain', 'france'].includes(el)).map( el => ({
				key: el,
				title: el.charAt(0).toUpperCase() + el.slice(1)
			}));

		this.writable = this.auth.hasPermission('scraping', 'writable');

		this.loading$ = this.loadingSubject.asObservable();

		this.selectedCountries = sessionStorage.getItem('selectedCountries') ? JSON.parse(sessionStorage.getItem('selectedCountries')) : [];

		this.unsubscribe.push(this.translate.onLangChange.subscribe( lang => {
			this.updateByTranslate(lang.lang);
		}));
		this.updateByTranslate(this.translate.currentLang);

		this.init();
	}

	async init() {
		try {
			const pr = this.auth.hasPermission('scraping', 'readable');
			if (!pr.allowed) {
				this.toastService.show('You dont have permision for this page');
				this.router.navigateByUrl('/');
				return;
			}
			this.countries = this._countries.filter(el => pr.countries.includes(el.key));
			if (this.selectedCountries.length) {
				this.selectedCountries = intersectionWith(this.selectedCountries, this.countries, (a, b) => a.key == b.key);
			} else if (this.countries.length) {
				this.selectedCountries = [this.countries.find(el => el.key == 'italy') || this.countries[0]];
			} else {
				this.selectedCountries = [];
			}
			this.defineColumns();
			this.tableCtrl.willRefreshTable.next('DATA');
		} catch (error) {

		}
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

	selectCountries(e) {
		sessionStorage.setItem('selectedCountries', JSON.stringify(this.selectedCountries));
		this.tableCtrl.willRefreshTable.next('DATA');
	}

	defineColumns() {
		const isMobile = KTUtil.isMobileDevice();
		this.tableCtrl.selectionPreviewColumns = [{field: 'name'}];
		const columnDefs: any[] = [
			{ headerName: this.translate.instant('Started At') ,
				cellRenderer: (param) => {
					if (param.data && param.data.createdAt) {
						return this.getDateTimeFromDate(param.data.createdAt);
					}
				},filter: 'agDateColumnFilter', field: 'startedAt', editable: false,  minWidth: 200
			},
			{ headerName: this.translate.instant('Ended At') ,
				cellRenderer: (param) => {
					if (param.data && param.data.finishedAt) {
						return this.getDateTimeFromDate(param.data.finishedAt);
					}
				},filter: 'agDateColumnFilter', field: 'finishedAt', editable: false,  minWidth: 200
			},
			{ headerName: this.translate.instant('Created Campaigns'),
				cellRenderer: (param) => {
					if (param.data && param.data.daemons) {
						const count = param.data.daemons.reduce(( prev, cur) => {
							if (cur && cur.created && cur.created.length) {
								prev += cur.created.length;
							}
							return prev;
						}, 0);
						const actionButtonHtml = `<span id="theAction" class="action"><i class='la la-eye'></i></span>`;
						const countHtml = `<span>
							${count}</span>`;

						setTimeout( () => {
							const actionButton = param.eGridCell.querySelector('#theAction');
							if (actionButton) {
								actionButton.addEventListener('click', () => {
									this.onShowLog(param.data._id, 'created');
								});
							}
						}, 0);

						return countHtml + (count > 0 ? actionButtonHtml: '');

					}

				},editable: false,  sortable: false
			},
      { headerName: this.translate.instant('Countries') ,
				cellRenderer: (param) => {
					if (param.data && param.data.involvedCountries) {
						return param.data.involvedCountries.map ( el =>
                `<span class="badge badge-secondary">${el}</span>`
              ).join(' ');
					}
				},field: 'involvedCountries', editable: false,  minWidth: 200
			},
      { headerName: this.translate.instant('Scraped sources') ,
				cellRenderer: (param) => {
					if (param.data) {
						return `${param.data.daemons.length || 0}/${param.data.countOfSource || param.data.daemons.length}`;
					}
				},field: 'countOfSource', editable: false,  minWidth: 200
			},
			{ headerName: this.translate.instant('Updated Campaigns'),
				cellRenderer: (param) => {
					if (param.data && param.data.daemons) {
						const count = param.data.daemons.reduce(( prev, cur) => {
							if (cur && cur.updated && cur.updated.length) {
								prev += cur.updated.filter( el => el && el.updatedFields && el.updatedFields.length).length;
							}
							return prev;
						}, 0);
						const actionButtonHtml = `<span id="theAction" class="action"><i class='la la-eye'></i></span>`;
						const countHtml = `<span>
							${count}</span>`;

						setTimeout( () => {
							const actionButton = param.eGridCell.querySelector('#theAction');
							if (actionButton) {
								actionButton.addEventListener('click', () => {
									this.onShowLog(param.data._id, 'updated');
								});
							}
						}, 0);

						return countHtml + (count > 0 ? actionButtonHtml: '');

					}
				}, editable: false,  sortable: false,
			},
			{ headerName: this.translate.instant('Error'),
				cellRenderer: (param) => {
					if (param.data && param.data.daemons) {
						const count = param.data.daemons.reduce(( prev, cur) => {
							if (cur && cur.error && cur.error.length) {
								prev += cur.error.length;
							}
							return prev;
						}, 0);
						const actionButtonHtml = `<span id="theAction" class="action"><i class='la la-eye'></i></span>`;
						const countHtml = `<span>
							${count}</span>`;

						setTimeout( () => {
							const actionButton = param.eGridCell.querySelector('#theAction');
							if (actionButton) {
								actionButton.addEventListener('click', () => {
									this.onShowLog(param.data._id, 'error');
								});
							}
						}, 0);

						return countHtml + (count > 0 ? actionButtonHtml: '');

					}
				},editable: false,  sortable: false
			},
			{ headerName: this.translate.instant('Warning'),
				cellRenderer: (param) => {
					if (param.data && param.data.daemons) {
						const count = param.data.daemons.reduce(( prev, cur) => {
							if (cur && cur.warning && cur.warning.length) {
								prev += 1;
							}
							return prev;
						}, 0);
						const actionButtonHtml = `<span id="theAction" class="action"><i class='la la-eye'></i></span>`;
						const countHtml = `<span>
							${count}</span>`;

						setTimeout( () => {
							const actionButton = param.eGridCell.querySelector('#theAction');
							if (actionButton) {
								actionButton.addEventListener('click', () => {
									this.onShowLog(param.data._id, 'warning');
								});
							}
						}, 0);

						return countHtml + (count > 0 ? actionButtonHtml: '');

					}
				},editable: false,  sortable: false,
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

		payload.filterModel.source = { filterType: 'eq', value: null};
    payload.filterModel.involvedCountries = {
      filterType: 'set',
      values: this.selectedCountries.map(el => el.key)
    };

		if (payload.sortModel && !payload.sortModel.find( e => e.colId && e.colId.indexOf('createdAt') >= 0)) {
			payload.sortModel.push({ colId: 'createdAt', sort: 'desc'});
		}
		let result: QueryResultsModel;
		try {
			const res = await this.scrapingService.getBackupWithPagination(payload);
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

	onAction(param) {

		const ids = param.payload;

		if (!this.checkPermission(ids)) {return;}

		let selectedIds = ids;
		if (ids.length > 1) {
			selectedIds = this.tableCtrl.originSelectedRowIds;
		}
		const node = this.tableCtrl.gridApi.getRowNode(ids[0]);
		if (ids.length == 1) {
			if (node) {
				node.setSelected(this.tableCtrl.originSelectedRowIds.includes(ids[0]));
			}
		}

	}

	async onShowLog(id, type) {

		this.loadingSubject.next(true);

		try {

			const daemon = await this.scrapingService.getBackupById(id);

			if (!daemon) {throw {};}

			if (type == 'updated') {
				const items = daemon.daemons.reduce(( prev, cur) => {
					if (cur.updated && cur.updated.length) {
						prev = prev.concat(
							cur.updated.filter(el => el.campaign)
							.map( el => ({...el, state: 'updated',
								involvedCampaignCountries: cur.source ? cur.source.configs
									.reduce( ( carry, item) => union(carry, item.involvedCampaignCountries), []) : [],
								sourceName: (cur.source || {}).name})));
					}
					if (cur.created && cur.created.length) {
						prev = prev.concat(cur.created.filter(el => el.campaign).map( el => ({...el, state: 'created',
						involvedCampaignCountries: cur.source ? cur.source.configs
							.reduce( ( carry, item) => union(carry, item.involvedCampaignCountries), []): []
						, sourceName: (cur.source || {}).name})));
					}
					return prev;
				}, []);

				const modalRef = this.modal.open(ScrapingDetailDialog, { animation: false, size: 'xl', windowClass: 'xl-dlg'});
				modalRef.componentInstance.items = items.map((item, index) => {
					item.id = index;
					return item;
				});
				modalRef.componentInstance.countries = this.countries;

				modalRef.componentInstance.onClickTab(modalRef.componentInstance.tabs.find( el => el.state == 'updated'));
				modalRef.componentInstance.tabs.forEach(el => {
					if (el.state == 'updated' || el.state == 'created'){
						el.hidden = false;
					} else {
						el.hidden = true;
					}
				});
			} else if (type == 'created') {
				const items = daemon.daemons.reduce(( prev, cur) => {
					if (cur.updated && cur.updated.length) {
						prev = prev.concat(cur.updated.filter(el => el.campaign).map( el => ({...el, state: 'updated',
						involvedCampaignCountries: cur.source ? cur.source.configs
							.reduce( ( carry, item) => union(carry, item.involvedCampaignCountries), []) : [],
						sourceName: (cur.source || {}).name})));
					}
					if (cur.created && cur.created.length) {
						prev = prev.concat(cur.created.filter(el => el.campaign).map( el => ({...el, state: 'created',
						involvedCampaignCountries: cur.source ? cur.source.configs
							.reduce( ( carry, item) => union(carry, item.involvedCampaignCountries), []) : [],
						sourceName: (cur.source || {}).name})));
					}
					return prev;
				}, []);
				const modalRef = this.modal.open(ScrapingDetailDialog, { animation: false, size: 'xl'});
				modalRef.componentInstance.items = items.map((item, index) => {
					item.id = index;
					return item;
				});
				modalRef.componentInstance.countries = this.countries;

				modalRef.componentInstance.onClickTab(modalRef.componentInstance.tabs.find( el => el.state == 'created'));
				modalRef.componentInstance.tabs.forEach(el => {
					if (el.state == 'updated' || el.state == 'created'){
						el.hidden = false;
					} else {
						el.hidden = true;
					}
				});

			} else if (type == 'warning') {
				const items = daemon.daemons.reduce(( prev, cur) => {
					try {
						if (!cur.source) {throw '';}
						if (cur.warning && cur.warning.length) {
							if (cur.warning.filter( el => el.type == 'MISSING_FIELD').length){
								prev.push({
									state: 'warning',
									sourceName: cur.source.name,
									sourceId: cur.source._id,
									involvedCampaignStatusesOfSource: cur.source.configs
									.reduce( ( carry, item) => union(carry, item.involvedCampaignStatuses), []),
									involvedCampaignTypologiesOfSource: cur.source.configs
									.reduce( ( carry, item) => union(carry, item.involvedCampaignTypologies), []),
									involvedCampaignCountriesOfSource: cur.source.configs
									.reduce( ( carry, item) => union(carry, item.involvedCampaignCountries), []),
									type: 'MISSING_FILED',
									value: cur.warning.filter( el => el.type == 'MISSING_FIELD').map( el => `${el.value}(${el.detail.length})(${el.index} config)`).join(','),
									content: cur.warning.filter( el => el.type == 'MISSING_FIELD')
								});
							}
						}
						if (cur.error && cur.error.length) {
							if (cur.error.filter( el => el.type == 'NOT_SET_FIELD').length) {
								prev.push({
									state: 'error',
									sourceName: cur.source.name,
                  sourceId: cur.source._id,
									involvedCampaignStatusesOfSource: cur.source.configs
									.reduce( ( carry, item) => union(carry, item.involvedCampaignStatuses), []),
									involvedCampaignTypologiesOfSource: cur.source.configs
									.reduce( ( carry, item) => union(carry, item.involvedCampaignTypologies), []),
									involvedCampaignCountriesOfSource: cur.source.configs
									.reduce( ( carry, item) => union(carry, item.involvedCampaignCountries), []),
									type: 'NOT_SET_FIELD',
									value: cur.error.filter( el => el.type == 'NOT_SET_FIELD').map( el => `${el.value}(${el.detail})(${el.index} config)`).join(','),
								});
							}
							if (cur.error.filter( el => el.type == 'NOT_MATCH_STATUS').length) {
								prev.push({
									state: 'error',
									sourceName: cur.source.name,
                  sourceId: cur.source._id,
									involvedCampaignStatusesOfSource: cur.source.configs
									.reduce( ( carry, item) => union(carry, item.involvedCampaignStatuses), []),
									involvedCampaignTypologiesOfSource: cur.source.configs
									.reduce( ( carry, item) => union(carry, item.involvedCampaignTypologies), []),
									involvedCampaignCountriesOfSource: cur.source.configs
									.reduce( ( carry, item) => union(carry, item.involvedCampaignCountries), []),
									type: 'NOT_MATCH_STATUS',
									value: cur.error.filter( el => el.type == 'NOT_MATCH_STATUS').map( el => `${el.value}(${el.index} config)`).join(','),
								});
							}
							if (cur.error.filter( el => el.type == 'NOT_MATCH_TYPOLOGY').length) {
								prev.push({
									state: 'error',
									sourceName: cur.source.name,
                  sourceId: cur.source._id,
									involvedCampaignStatusesOfSource: cur.source.configs
									.reduce( ( carry, item) => union(carry, item.involvedCampaignStatuses), []),
									involvedCampaignTypologiesOfSource: cur.source.configs
									.reduce( ( carry, item) => union(carry, item.involvedCampaignTypologies), []),
									involvedCampaignCountriesOfSource: cur.source.configs
									.reduce( ( carry, item) => union(carry, item.involvedCampaignCountries), []),
									type: 'NOT_MATCH_TYPOLOGY',
									value: cur.error.filter( el => el.type == 'NOT_MATCH_TYPOLOGY').map( el => `${el.value}(${el.index} config)`).join(','),
								});
							}
							if (cur.error.filter( el => el.type == 'MISSING_ROOT').length) {
								prev.push({
									state: 'error',
                  sourceId: cur.source._id,
									sourceName: cur.source.name,
									involvedCampaignStatusesOfSource: cur.source.configs
									.reduce( ( carry, item) => union(carry, item.involvedCampaignStatuses), []),
									involvedCampaignTypologiesOfSource: cur.source.configs
									.reduce( ( carry, item) => union(carry, item.involvedCampaignTypologies), []),
									involvedCampaignCountriesOfSource: cur.source.configs
									.reduce( ( carry, item) => union(carry, item.involvedCampaignCountries), []),
									type: 'MISSING_ROOT',
									value: cur.error.filter( el => el.type == 'MISSING_ROOT').map( el => `(${el.value} config)`).join(','),
								});
							}
						}
					} catch (error) {

					}
					return prev;
				}, []);
				const modalRef = this.modal.open(ScrapingDetailDialog, { animation: false, size: 'xl'});
				modalRef.componentInstance.items = items.map((item, index) => {
					item.id = index;
					return item;
				});

				modalRef.componentInstance.onClickTab(modalRef.componentInstance.tabs.find( el => el.state == 'warning'));
				modalRef.componentInstance.tabs.forEach(el => {
					if (el.state == 'warning' || el.state == 'error'){
						el.hidden = false;
					} else {
						el.hidden = true;
					}
				});
			} else if (type == 'error') {
				const items = daemon.daemons.reduce(( prev, cur) => {
					try {
						if (!cur.source) {throw '';}
						if (cur.warning && cur.warning.length) {
							if (cur.warning.filter( el => el.type == 'MISSING_FIELD').length){
								prev.push({
									state: 'warning',
									sourceName: cur.source.name,
									sourceId: cur.source._id,
									involvedCampaignStatusesOfSource: cur.source.configs
									.reduce( ( carry, item) => union(carry, item.involvedCampaignStatuses), []),
									involvedCampaignTypologiesOfSource: cur.source.configs
									.reduce( ( carry, item) => union(carry, item.involvedCampaignTypologies), []),
									involvedCampaignCountriesOfSource: cur.source.configs
									.reduce( ( carry, item) => union(carry, item.involvedCampaignCountries), []),
									type: 'MISSING_FILED',
									value: cur.warning.filter( el => el.type == 'MISSING_FIELD').map( el => `${el.value}(${el.detail.length})(${el.index} config)`).join(','),
									content: cur.warning.filter( el => el.type == 'MISSING_FIELD')
								});
							}
						}
						if (cur.error && cur.error.length) {
							if (cur.error.filter( el => el.type == 'NOT_SET_FIELD').length) {
								prev.push({
									state: 'error',
									sourceName: cur.source.name,
                  sourceId: cur.source._id,
									involvedCampaignStatusesOfSource: cur.source.configs
									.reduce( ( carry, item) => union(carry, item.involvedCampaignStatuses), []),
									involvedCampaignTypologiesOfSource: cur.source.configs
									.reduce( ( carry, item) => union(carry, item.involvedCampaignTypologies), []),
									involvedCampaignCountriesOfSource: cur.source.configs
									.reduce( ( carry, item) => union(carry, item.involvedCampaignCountries), []),
									type: 'NOT_SET_FIELD',
									value: cur.error.filter( el => el.type == 'NOT_SET_FIELD').map( el => `${el.value}(${el.detail})(${el.index} config)`).join(','),
								});
							}
							if (cur.error.filter( el => el.type == 'NOT_MATCH_STATUS').length) {
								prev.push({
									state: 'error',
									sourceName: cur.source.name,
                  sourceId: cur.source._id,
									involvedCampaignStatusesOfSource: cur.source.configs
									.reduce( ( carry, item) => union(carry, item.involvedCampaignStatuses), []),
									involvedCampaignTypologiesOfSource: cur.source.configs
									.reduce( ( carry, item) => union(carry, item.involvedCampaignTypologies), []),
									involvedCampaignCountriesOfSource: cur.source.configs
									.reduce( ( carry, item) => union(carry, item.involvedCampaignCountries), []),
									type: 'NOT_MATCH_STATUS',
									value: cur.error.filter( el => el.type == 'NOT_MATCH_STATUS').map( el => `${el.value}(${el.index} config)`).join(','),
								});
							}
							if (cur.error.filter( el => el.type == 'NOT_MATCH_TYPOLOGY').length) {
								prev.push({
									state: 'error',
									sourceName: cur.source.name,
                  sourceId: cur.source._id,
									involvedCampaignStatusesOfSource: cur.source.configs
									.reduce( ( carry, item) => union(carry, item.involvedCampaignStatuses), []),
									involvedCampaignTypologiesOfSource: cur.source.configs
									.reduce( ( carry, item) => union(carry, item.involvedCampaignTypologies), []),
									involvedCampaignCountriesOfSource: cur.source.configs
									.reduce( ( carry, item) => union(carry, item.involvedCampaignCountries), []),
									type: 'NOT_MATCH_TYPOLOGY',
									value: cur.error.filter( el => el.type == 'NOT_MATCH_TYPOLOGY').map( el => `${el.value}(${el.index} config)`).join(','),
								});
							}
							if (cur.error.filter( el => el.type == 'MISSING_ROOT').length) {
								prev.push({
									state: 'error',
									sourceName: cur.source.name,
                  sourceId: cur.source._id,
									involvedCampaignStatusesOfSource: cur.source.configs
									.reduce( ( carry, item) => union(carry, item.involvedCampaignStatuses), []),
									involvedCampaignTypologiesOfSource: cur.source.configs
									.reduce( ( carry, item) => union(carry, item.involvedCampaignTypologies), []),
									involvedCampaignCountriesOfSource: cur.source.configs
									.reduce( ( carry, item) => union(carry, item.involvedCampaignCountries), []),
									type: 'MISSING_ROOT',
									value: cur.error.filter( el => el.type == 'MISSING_ROOT').map( el => `(${el.value} config)`).join(','),
								});
							}
						}
					} catch (error) {

					}
					return prev;
				}, []);
				const modalRef = this.modal.open(ScrapingDetailDialog, { animation: false, size: 'xl'});
				modalRef.componentInstance.items = items.map((item, index) => {
					item.id = index;
					return item;
				});

				modalRef.componentInstance.onClickTab(modalRef.componentInstance.tabs.find( el => el.state == 'error'));
				modalRef.componentInstance.tabs.forEach(el => {
					if (el.state == 'warning' || el.state == 'error'){
						el.hidden = false;
					} else {
						el.hidden = true;
					}
				});
			}
		} catch (error) {
			console.log(error);
		}

		this.loadingSubject.next(false);
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
	checkPermission(ids) {
		const selected = ids.map( id => {
			const node = this.tableCtrl.gridApi.getRowNode(id);
			if (node) {return node.data;}
			return this.tableCtrl.originSelectedRows.find(el => el._id == id);
		}).filter( el => el);
		try {
			if (selected.length == 0) {throw {};}
      if (this.writable.admin) {return true;}
			if (!this.writable.allowed) {throw {};}

			return true;
		} catch (error) {

		}
		this.toastService.show('You dont have permission for this action!');
		return false;
	}
}
