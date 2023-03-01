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
	selector: 'app-scraping-log',
	templateUrl: './scraping-log.component.html',
	styleUrls: ['./scraping-log.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScrapingLogComponent implements OnInit, OnDestroy {

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
		private countryService: CountryService,
		private auth: AuthService
	) {

	}

	ngOnInit() {

		const user = this.auth.currentUserValue;
		// this._countries = user.countries.map( el => {
		// 	return {
		// 		key: el,
		// 		title: el.charAt(0).toUpperCase() + el.slice(1)
		// 	}
		// });
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

		this.unsubscribe.push(this.messageService.scrapingProgress$.subscribe( param => {
			this.progress = param;
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		}));
		this.scrapingService.getProgress().then( res => {
			this.progress = res;
		});
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

	selectCountries(e) {
		sessionStorage.setItem('selectedCountries', JSON.stringify(this.selectedCountries));
		this.tableCtrl.willRefreshTable.next('DATA');
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
						var val = `${param.data.daemons.length || 0}/${param.data.countOfSource || param.data.daemons.length}`;
						const actionButtonHtml = `<span id="theAction" class="action"><i class='la la-eye'></i></span>`;
						const countHtml = `<span>
							${val}</span>`;

						setTimeout( () => {
							const actionButton = param.eGridCell.querySelector('#theAction');
							if (actionButton) {
								actionButton.addEventListener('click', () => {
									this.onShowLog(param.data._id, 'scraped');
								});
							}
						}, 0);

						return countHtml + (val != '' ? actionButtonHtml: '');

						// return `${param.data.daemons.length || 0}/${param.data.countOfSource || param.data.daemons.length}`;
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
			const res = await this.scrapingService.getWithPagination(payload);
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
		if (param.type == 'DELETE') {
			this.onDeleteByIds(selectedIds);
		}
	}
	onDeleteByIds(ids) {
		const _description = 'Are you sure to permanently delete these logs?';
		const _waitDescription = 'Logs are deleting...';
		const _success = `Logs have been deleted`;

		const modalRef = this.modal.open(MainModalComponent, { animation: false});
		modalRef.componentInstance.modalData = {
			text: _description,
			yes: 'GENERAL.YES',
		};

		const subscr = modalRef.closed.subscribe ( async e => {
			if (!e) {return;}
			const res  = await this.scrapingService.deleteByIds(ids);
			if (res) {
				this.toastService.show (this.translate.instant(_success));
				this.keptPage = Math.max (0, this.tableCtrl.gridApi.paginationGetCurrentPage() - Math.floor(ids.length / this.tableCtrl.gridApi.paginationGetPageSize()));
				this.tableCtrl.onDeSelectAllButton();
				this.tableCtrl.willRefreshTable.next('DATA');
			}
			modalRef.close();
			setTimeout(() => subscr.unsubscribe(), 100);
		});

	}
	async onShowLog(id, type) {

		this.loadingSubject.next(true);

		try {

			const daemon = await this.scrapingService.getById(id);
			
			if (!daemon) {throw {};}

			if (type == 'updated') {
				const items = daemon.daemons.reduce(( prev, cur) => {
					if (cur.updated && cur.updated.length) {
						prev = prev.concat(
							cur.updated.filter(el => el.campaign)
							.map( el => ({...el, state: 'updated',
								involvedCampaignCountries: cur.source ? cur.source.configs
									.reduce( ( carry, item) => union(carry, item.involvedCampaignCountries), []) : [],
								sourceName: (cur.source || {}).name, sourceLink: (cur.source || {}).link})));
					}
					if (cur.created && cur.created.length) {
						prev = prev.concat(cur.created.filter(el => el.campaign).map( el => ({...el, state: 'created',
						involvedCampaignCountries: cur.source ? cur.source.configs
							.reduce( ( carry, item) => union(carry, item.involvedCampaignCountries), []): []
						, sourceName: (cur.source || {}).name, sourceLink: (cur.source || {}).link})));
					}
					return prev;
				}, []);

				const modalRef = this.modal.open(ScrapingDetailDialog, { animation: false, size: 'xl', windowClass: 'xl-dlg'});
				modalRef.componentInstance.items = items.map((item, index) => {
					item.id = index;
					return item;
				});
				modalRef.componentInstance.countries = this.countries;
				modalRef.componentInstance.selectedCampaignCountries = this.selectedCountries;

				modalRef.componentInstance.onClickTab(modalRef.componentInstance.tabs.find( el => el.state == 'updated'));
				modalRef.componentInstance.tabs.forEach(el => {
					if (el.state == 'updated' || el.state == 'created'){
						el.hidden = false;
					} else {
						el.hidden = true;
					}
				});
			} else if (type == 'scraped') {
				const items = daemon.daemons.reduce(( prev, cur) => {
					prev = prev.concat(
						{...cur, state: 'scraped',
							involvedCampaignCountries: cur.source ? cur.source.configs
								.reduce( ( carry, item) => union(carry, item.involvedCampaignCountries), []) : [],
							sourceName: (cur.source || {}).name, sourceLink: (cur.source || {}).link}
					);
					return prev;
				}, []);

				var ind = 0;
				items.forEach(element => {
					if (ind > 0) {
						element.startedAt = items[ind - 1].finishedAt;
					}
					if (element.finishedAt) {
						var duration = new Date(element.finishedAt).getTime() - new Date(element.startedAt).getTime();
						var mins = Math.floor(duration / (1000 * 60));
						var secs = Math.round((duration - (mins * 60 * 1000)) / 1000);
						element['duration'] = mins + 'm ' + secs + 's';
					}

					if (element.warning && element.warning.length) {
						if (element.warning.filter( el => el.type == 'MISSING_FIELD').length){
							element.warning = `MISSING_FIELD (${element.warning.filter( el => el.type == 'MISSING_FIELD').length})`;
						} else {
							element.warning = '';
						}
					} else {
						element.warning = '';
					}

					if (element.error && element.error.length) {
						if (element.error.filter( el => el.type == 'NOT_SET_FIELD').length) {
							element.errors = element.errors ? ', ' + `NOT_SET_FIELD (${element.error.filter( el => el.type == 'NOT_SET_FIELD').length})` : `NOT_SET_FIELD (${element.error.filter( el => el.type == 'NOT_SET_FIELD').length})`;
						}
						if (element.error.filter( el => el.type == 'NOT_MATCH_STATUS').length) {
							element.errors = element.errors ? ', ' + `NOT_MATCH_STATUS (${element.error.filter( el => el.type == 'NOT_MATCH_STATUS').length})` : `NOT_MATCH_STATUS (${element.error.filter( el => el.type == 'NOT_MATCH_STATUS').length})`;
						}
						if (element.error.filter( el => el.type == 'NOT_MATCH_TYPOLOGY').length) {
							element.errors = element.errors ? ', ' + `NOT_MATCH_TYPOLOGY (${element.error.filter( el => el.type == 'NOT_MATCH_TYPOLOGY').length})` : `NOT_MATCH_TYPOLOGY (${element.error.filter( el => el.type == 'NOT_MATCH_TYPOLOGY').length})`;
						}
						if (element.error.filter( el => el.type == 'MISSING_ROOT').length) {
							element.errors = element.errors ? ', ' + `MISSING_ROOT (${element.error.filter( el => el.type == 'MISSING_ROOT').length})` : `MISSING_ROOT (${element.error.filter( el => el.type == 'MISSING_ROOT').length})`;
						}
					} else {
						element.errors = '';
					}

					ind++;
				});

				const modalRef = this.modal.open(ScrapingDetailDialog, { animation: false, size: 'xl', windowClass: 'xl-dlg'});
				modalRef.componentInstance.items = items.map((item, index) => {
					item.id = index;
					return item;
				});
				modalRef.componentInstance.countries = this.countries;
				modalRef.componentInstance.selectedCampaignCountries = this.selectedCountries;

				modalRef.componentInstance.onClickTab(modalRef.componentInstance.tabs.find( el => el.state == 'scraped'));
				modalRef.componentInstance.tabs.forEach(el => {
					if (el.state == 'scraped'){
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
						sourceName: (cur.source || {}).name, sourceLink: (cur.source || {}).link})));
					}
					if (cur.created && cur.created.length) {
						prev = prev.concat(cur.created.filter(el => el.campaign).map( el => ({...el, state: 'created',
						involvedCampaignCountries: cur.source ? cur.source.configs
							.reduce( ( carry, item) => union(carry, item.involvedCampaignCountries), []) : [],
						sourceName: (cur.source || {}).name, sourceLink: (cur.source || {}).link})));
					}
					return prev;
				}, []);
				const modalRef = this.modal.open(ScrapingDetailDialog, { animation: false, size: 'xl'});
				modalRef.componentInstance.items = items.map((item, index) => {
					item.id = index;
					return item;
				});
				modalRef.componentInstance.countries = this.countries;
				modalRef.componentInstance.selectedCampaignCountries = this.selectedCountries;

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
									sourceLink: (cur.source || {}).link,
									sourceComment: (cur.source || {}).comment,
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
									sourceLink: (cur.source || {}).link,
									sourceComment: (cur.source || {}).comment,
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
									sourceLink: (cur.source || {}).link,
									sourceComment: (cur.source || {}).comment,
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
									sourceLink: (cur.source || {}).link,
									sourceComment: (cur.source || {}).comment,
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
									sourceLink: (cur.source || {}).link,
									sourceComment: (cur.source || {}).comment,
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

				modalRef.componentInstance.countries = this.countries;
				modalRef.componentInstance.selectedCampaignCountries = this.selectedCountries;
				
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
									sourceLink: (cur.source || {}).link,
									sourceComment: (cur.source || {}).comment,
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
									sourceLink: (cur.source || {}).link,
									sourceComment: (cur.source || {}).comment,
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
									sourceLink: (cur.source || {}).link,
									sourceComment: (cur.source || {}).comment,
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
									sourceLink: (cur.source || {}).link,
									sourceComment: (cur.source || {}).comment,
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
									sourceLink: (cur.source || {}).link,
									sourceComment: (cur.source || {}).comment,
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

				modalRef.componentInstance.countries = this.countries;
				modalRef.componentInstance.selectedCampaignCountries = this.selectedCountries;

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
	async onClickScraping(start) {

		if (!this.writable.allowed) {
			this.toastService.show('You dont have permission for this action!');
			return;
		}

		const _description = start? 'Are you sure to start scraping now?': 'Are you sure to stop scraping?';
		const _waitDescription = 'Waiting...';
		const _success = start? 'Scraping has been started': 'Scarping has been stopped';

		const modalRef = this.modal.open(MainModalComponent, { animation: false});
		modalRef.componentInstance.modalData = {
			text: _description,
			yes: 'GENERAL.YES',
		};

		const subscr = modalRef.closed.subscribe ( async e => {
			try {
				if (start) {
					const res = await this.scrapingService.start(this.selectedCountries.map(el => el.key));
					if (!res) {throw {};}
				} else {
					const res = await this.scrapingService.stop();
					if (!res) {throw {};}
				}
				this.progress = await this.scrapingService.getProgress();
			} catch (error) {
			}
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
			modalRef.close();
			setTimeout(() => subscr.unsubscribe(), 100);
		});

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
  onClickBackup() {
    if (!this.writable.allowed) {
			this.toastService.show('You dont have permission for this action!');
			return;
		}

		const _description = 'Are you sure to backup scraping logs?';
		const _success = 'Scraping logs have been backuped';

		const modalRef = this.modal.open(MainModalComponent, { animation: false});
		modalRef.componentInstance.modalData = {
			text: _description,
			yes: 'GENERAL.YES',
		};

		const subscr = modalRef.closed.subscribe ( async e => {
			try {
        const res = await this.scrapingService.backup();
        if (!res) {throw {};}
        this.toastService.show(_success);
			} catch (error) {
			}
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
			modalRef.close();
			setTimeout(() => subscr.unsubscribe(), 100);
		});

  }
}
