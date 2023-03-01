// Angular
import { Component, OnInit, ViewChild, ChangeDetectionStrategy, OnDestroy, ViewRef, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
// Material
import { Observable, Subscription, BehaviorSubject } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';
import { cloneDeep, union, each, intersection, intersectionWith } from 'lodash';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { LpTableComponent } from 'src/app/pages/common/lp-table/lp-table.component';
import { ToastService } from 'src/app/pages/common/toast.service';
import { ScrapingService } from 'src/app/pages/common/scraping.service';
import { CampaignService } from 'src/app/pages/common/campaign.service';
import { SourceService } from 'src/app/pages/common/source.service';
import { KTUtil } from 'src/app/_metronic/kt';
import { QueryResultsModel } from 'src/app/pages/common/models/query-results.model';
import { SourceRootEditDialog } from '../source-root-edit-dialog/source-root-edit.dialog';
import { MainModalComponent } from 'src/app/_metronic/partials/layout/modals/main-modal/main-modal.component';
import { LayoutService } from 'src/app/_metronic/layout';
import { AuthService } from 'src/app/modules/auth';
import { AddCommentDialog } from '../../user/user-list/add-comment-dialog/add-comment.dialog';
@Component({
	selector: 'app-sources-list',
	templateUrl: './sources-list.component.html',
	styleUrls: ['./sources-list.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SourcesListComponent implements OnInit, OnDestroy {

	locale = 'it-IT';

	loadingSubject = new BehaviorSubject<boolean>(true);
	loading$: Observable<boolean>;

	columnDefs: any[] = [];
	isEmptyTable = false;
	keptPage = -1;

	tabs: any[] = [
		{
			title: 'Enabled',
			state: 'enabled',
			filter: {
				disabled: {
					filterType: 'ne',
					value: true
				},
				type: {
					filterType: 'eq',
					value: 'root'
				},
			}
		},
		{
			title: 'Disabled',
			state: 'disabled',
			filter: {
				disabled: {
					filterType: 'eq',
					value: true
				},
				type: {
					filterType: 'eq',
					value: 'root'
				},
			}
		},
		{
			title: 'No configs',
			state: 'no_configs',
			filter: {
				configs: {
					filterType: 'size',
					value: 0
				},
				type: {
					filterType: 'eq',
					value: 'root'
				},
			}
		},
		{
			title: 'Missing Data',
			state: 'missing_data',
			filter: {}
		}
	];

	activeTab;

	extraActions = [{
		type: 'START_SCRAP',
		icon: 'la la-redo-alt',
		text: 'Start scraping for this sources',
		onlyIcon: true
	}];

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

	latestDaemonResult;

	@ViewChild('tableCtrl', { static: true }) tableCtrl: LpTableComponent;

	private unsubscribe: Subscription[] = [];

	constructor(
		private activatedRoute: ActivatedRoute,
		private cdr: ChangeDetectorRef,
		private router: Router,
		private translate: TranslateService,
		private toastService: ToastService,
		private modal: NgbModal,
		private scrapingService: ScrapingService,
		private layoutService: LayoutService,
		private campaignService: CampaignService,
		private auth: AuthService,
		private sourceService: SourceService
	) { }

	ngOnInit() {

		const user = this.auth.currentUserValue;

		this.selectedCountries = sessionStorage.getItem('selectedCountries') ? JSON.parse(sessionStorage.getItem('selectedCountries')) : [];

		this._countries = user.countries.filter(el => ['italy', 'spain', 'france'].includes(el)).map(el => ({
			key: el,
			title: el.charAt(0).toUpperCase() + el.slice(1)
		}));

		this.writable = this.auth.hasPermission('source', 'writable');

		this.loading$ = this.loadingSubject.asObservable();

		this.unsubscribe.push(this.translate.onLangChange.subscribe(lang => {
			this.updateByTranslate(lang.lang);
		}));
		this.updateByTranslate(this.translate.currentLang);

		this.unsubscribe.push(this.layoutService.createOnToolbarSubject.subscribe(param => {
			this.router.navigate(['/admin/sources/add']);
		}));
		this.layoutService.createVisibleOnToolbar$.next(true);

		this.init();
	}

	async init() {
		try {
			const pr = this.auth.hasPermission('source', 'readable');
			if (!pr.allowed) {
				this.toastService.show('You dont have permision for this page');
				this.router.navigateByUrl('/');
				return;
			}
			this.countries = this._countries.filter(el => pr.countries.includes(el.key));

			await this.loadState();
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
		this.layoutService.createVisibleOnToolbar$.next(false);
	}
	updateByTranslate(lang) {
		if (lang == 'en') {
			this.locale = 'en-US';
		} else if (lang == 'it') {
			this.locale = 'it-IT';
		}
		this.defineColumns();
	}

	defineColumns() {
		const isMobile = KTUtil.isMobileDevice();
		this.tableCtrl.selectionPreviewColumns = [{ field: 'name' }];
		const columnDefs: any[] = [
			{
				headerName: this.translate.instant('Name'), filter: 'agTextColumnFilter', field: 'name', editable: false, minWidth: 200
			},
			{
				headerName: this.translate.instant('Involves Campaign status'), filter: 'agTextColumnFilter', field: 'configs.involvedCampaignStatuses', editable: false, sortable: false,
				cellRenderer: (param) => {
					if (param.data && param.data.configs) {
						return param.data.configs.reduce((carry, item) => union(carry, item.involvedCampaignStatuses || []), []).map(status => {
							switch (status) {
								case '1_ongoing':
									return `<span class="badge badge-success rounded-0 text-uppercase">ongoing</span>`;
								case '2_comingsoon':
									return `<span class="badge badge-warning rounded-0 text-uppercase">coming soon</span>`;
								case '3_funded':
									return `<span class="badge badge-light-primary rounded-0 text-uppercase">closed funded</span>`;
								case '4_closed':
									return `<span class="badge badge-secondary rounded-0 text-uppercase">closed not funded</span>`;
								case '6_refunded':
									return `<span class="badge badge-light-success rounded-0 text-uppercase">refunded</span>`;
								case '5_extra':
									return `<span class="badge badge-info rounded-0 text-uppercase">closing</span>`;
								default:
									break;
							}
						}).join(' ');
					}
				},
				floatingFilterComponent: 'dropdownFloatingFilter',
				suppressMenu: true,
				floatingFilterComponentParams: {
					suppressFilterButton: true,
					options: [{
						label: 'ongoing',
						value: '1_ongoing'
					},
					{
						label: 'comingsoon',
						value: '2_comingsoon'
					},
					{
						label: 'closed funded',
						value: '3_funded'
					},
					{
						label: 'closed not funded',
						value: '4_closed'
					},
					{
						label: 'closing',
						value: '5_extra'
					},
					{
						label: 'refunded',
						value: '6_refunded'
					}]
				},
			},
			{
				headerName: this.translate.instant('Involves Campaign Typologies'), filter: 'agTextColumnFilter', field: 'configs.involvedCampaignTypologies', editable: false, sortable: false,
				cellRenderer: (param) => {
					if (param.data && param.data.configs) {
						return param.data.configs.reduce((carry, item) => union(carry, item.involvedCampaignTypologies || []), []).map(typology => {
							switch (typology) {
								case 'company equity':
									return `<span class="badge badge-success rounded-0 text-uppercase">Company equity</span>`;
								case 'company lending':
									return `<span class="badge badge-light-success rounded-0 text-uppercase">Company lending</span>`;
								case 'real estate equity':
									return `<span class="badge badge-primary rounded-0 text-uppercase">Real estate equity</span>`;
								case 'real estate lending':
									return `<span class="badge badge-light-primary rounded-0 text-uppercase">Real estate lending</span>`;
								case 'minibond':
									return `<span class="badge badge-warning rounded-0 text-uppercase">Minibond</span>`;
								default:
									break;
							}
						}).join(' ');
					}
				},
				floatingFilterComponent: 'dropdownFloatingFilter',
				suppressMenu: true,
				floatingFilterComponentParams: {
					suppressFilterButton: true,
					options: [{
						label: 'company equity',
						value: 'company equity'
					},
					{
						label: 'company lending',
						value: 'company lending'
					},
					{
						label: 'real estate equity',
						value: 'real estate equity'
					},
					{
						label: 'real estate lending',
						value: 'real estate lending'
					},
					{
						label: 'minibond',
						value: 'minobond'
					},
					]
				}
			},
			{
				headerName: this.translate.instant('Type'), field: 'configs.type', editable: false,
				cellRenderer: (param) => {
					if (param.data) {
						return param.data.configs.reduce((carry, item) => union(carry, [item.type]), []).map(type => {
							switch (type) {
								case 'company':
									return `<span class="badge badge-warning rounded-0 text-uppercase">Company</span>`;
								case 'campaign':
									return `<span class="badge badge-primary rounded-0 text-uppercase">Campaign</span>`;
								default:
									break;
							}
						}).join(' ');

					}
				}
			},
			{
				headerName: this.translate.instant('Load Type'), field: 'configs.loadMainConfig.method', editable: false, filter: 'agTextColumnFilter',
				cellRenderer: (param) => {
					if (param.data) {
						return param.data.configs.reduce((carry, item) => union(carry, [(item.loadMainConfig || {}).method]), []).filter(el => el).map(type => {
							switch (type) {
								case 'get':
									return `<span class="badge badge-success rounded-0 text-uppercase">get</span>`;
								case 'post':
									return `<span class="badge badge-primary rounded-0 text-uppercase">post</span>`;
								case 'dynamic':
									return `<span class="badge badge-warning rounded-0 text-uppercase">dynamic</span>`;
								default:
									break;
							}
						}).join(' ');

					}
				}
			},
			{
				headerName: this.translate.instant('Status'), field: 'disabled', editable: false, action: 'ENABLE',
				cellRenderer: (param) => {
					if (param.data) {
						let statusClass; let statusText;
						if (!param.data.disabled) {
							statusClass = 'badge badge-light-primary';
							statusText = 'Enabled';
						} else {
							statusClass = 'badge badge-secondary';
							statusText = 'Disabled';
						}
						if (statusClass && statusText) {
							return `<span
								class="text-uppercase ${statusClass}">${statusText}</span>`;
						}
					}
				}
			},
			{
				headerName: this.translate.instant('Comments'), field: 'comment', editable: false, hide: this.activeTab?.state != 'disabled',
				cellRenderer: (param) => {
					if (param.data) {
						let result = '';

						const commentHtml = `<span>
            ${this.convertToPlain(param.data.comment || '')}</span>`;
						result = commentHtml;
						const commentButtonHtml = `<span id="theEditCommentButton" class="action" ><i class='la la-pen'></i></span>`;

						setTimeout(() => {
							const commentButton = param.eGridCell.querySelector('#theEditCommentButton');
							if (commentButton) {
								commentButton.addEventListener('click', () => {
									this.onClickEditComment(param.data);
								});
							}
						}, 0);
						if (param.data) {
							result += commentButtonHtml;
						}
						return result;
					}
				}

			},
			{
				headerName: this.translate.instant('Crowdfunding Site'), filter: 'agTextColumnFilter', field: 'link', editable: false, minWidth: 200,
				cellRenderer: (param) => {
					if (param.data && param.data.link) {
						setTimeout(() => {
							const copyButton = param.eGridCell.querySelector('#theCopyButton');
							copyButton.addEventListener('click', () => {
								const el = document.createElement('textarea');
								el.value = param.data.link;
								document.body.appendChild(el);
								const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
								if (iOS) {
									const range = document.createRange();
									range.selectNodeContents(el);
									const selection = window.getSelection();
									selection.removeAllRanges();
									selection.addRange(range);
									el.setSelectionRange(0, 999999);
								} else {
									el.select();
								}
								document.execCommand('copy');
								document.body.removeChild(el);
								this.toastService.show('URL copied to clipboard');
							});
						}, 0);
						return `<a>${param.data.link}</a>
							<span id="theCopyButton" class="action"><i class='la la-copy'></i></span>`;
					}
				},
			},
			{
				headerName: this.translate.instant('Created At'), filter: 'agDateColumnFilter', field: 'createdAt', editable: false,
				cellRenderer: param => {
					if (param.data && param.data.createdAt) {
						return this.getDateTimeFromDate(param.data.createdAt);
					}
				},
			},
			{
				headerName: this.translate.instant('Updated At'), filter: 'agDateColumnFilter', field: 'updatedAt', editable: false,
				cellRenderer: param => {
					if (param.data && param.data.updatedAt) {
						return this.getDateTimeFromDate(param.data.updatedAt);
					}
				},
				cellClass: isMobile ? 'custom-cell' : 'last-column-cell custom-cell'
			},
			{
				action: 'ENTER_IN',	width: 42, fixed: true, pinned: isMobile? null: 'right', editable: false, sortable: false,
				cellRenderer:  param => {
					if (param.data) {
						return `<a target="_blank" href="${window.location.origin + '/crowdfunding/source/' + param.data.name}"><i class="fa fa-link" style="color: blue"></i></a>`;
					}
				}
			},
			{
				action: 'ENTER', width: 42, fixed: true, pinned: isMobile ? null : 'right', editable: false, sortable: false,
				cellRenderer: param => {
					if (param.data) {
						return `<i class="fa fa-link" style="${param.data.link ? '' : 'opacity: 0.4; cursor: not-allowed'}"></i>`;
					}
				}
			},
			{
				action: 'EDIT', width: 42, fixed: true, pinned: isMobile ? null : 'right', editable: false, sortable: false,
				cellRenderer: param => '<i class="la la-pen"></i>'
			},
			{
				action: 'DUPLICATE', width: 42, fixed: true, pinned: isMobile ? null : 'right', editable: false, sortable: false,
				cellRenderer: param => '<i class="la la-copy"></i>'
			}
			// {
			// 	action: 'CSV',	width: 42, fixed: true, pinned: isMobile? null: 'right', editable: false, sortable: false,
			// 	cellRenderer:  param => {
			// 		return '<i class="la la-file-csv"></i>';
			// 	}
			// },
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

		if (!this.activeTab || this.activeTab.count == 0) {
			param.cb([], 0);
			this.isEmptyTable = true;
			this.loadingSubject.next(false);
			return;
		}

		const payload = cloneDeep(param.payload);
		const isFiltered = Object.keys(payload.filterModel).length > 0;
		Object.keys(payload.filterModel).forEach(el => {
			const field = el.replace(/_\d/, '');
			if (field != el) {
				payload.filterModel[field] = { ...payload.filterModel[el] };
				delete payload.filterModel[el];
			}
		});
		Object.keys(payload.filterModel).forEach(el => {
			if (payload.filterModel[el].filterType == 'text' && payload.filterModel[el].type == 'equals') {
				payload.filterModel[el].filterType = 'set';
				payload.filterModel[el].values = payload.filterModel[el].filter.split(',').map(el => el.trim()).filter(el => el != '');
			}
		});

		payload.filterModel = {
			...payload.filterModel,
			...this.activeTab.filter,
			'configs.involvedCampaignCountries': {
				filterType: 'set',
				values: this.selectedCountries.map(el => el.key)
			}
		};
		if (this.activeTab.state == 'no_configs') {
			delete payload.filterModel['configs.involvedCampaignCountries'];
		}


		if (payload.sortModel && !payload.sortModel.find(e => e.colId && e.colId.indexOf('name') >= 0)) {
			payload.sortModel.push({ colId: 'name', sort: 'asc' });
		}

		if (this.activeTab.state == 'disabled') {
			payload.groupKeys = [];
			payload.rowGroupCols = [];
		}
		if (this.activeTab.state == 'missing_data') {
			payload.state = 'missing_data';
			payload.countries = this.selectedCountries.map(el => el.key);
		}
		let result: QueryResultsModel;
		try {
			const res = await this.sourceService.getWithPagination(payload);
			result = new QueryResultsModel(res.items.map(item => {
				if (this.latestDaemonResult) {
					item.errors = [
						...this.latestDaemonResult.updated.filter(r => r.source && r.source._id == item._id && r.error && r.error.length > 0),
						...this.latestDaemonResult.created.filter(r => r.source && r.source._id == item._id && r.error && r.error.length > 0)
					];
				}
				return item;
			}), res.totalCount);
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
		if (this.keptPage > 0) {
			setTimeout(() => {
				this.tableCtrl.gridApi.paginationGoToPage(this.keptPage);
				this.keptPage = -1;
			}, 0);
		}
	}

	onAction(param) {
		const ids = param.payload;

		if (!['ENTER'].includes(param.type) && !this.checkPermission(ids)) { return; }

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
		if (param.type == 'EDIT') {
			this.router.navigate(['edit', ids[0]], { relativeTo: this.activatedRoute });
		} else if (param.type == 'DELETE') {
			this.onDeleteByIds(selectedIds);
		} else if (param.type == 'ENABLE') {
			if (node) {
				this.sourceService.update({
					_id: ids[0],
					disabled: !node.data.disabled
				}).then(res => {
					this.loadState().then(() => {
						this.tableCtrl.willRefreshTable.next('DATA');
					});
				});
			}
		}
		else if (param.type == 'FORCE') {
			if (node) {
				this.sourceService.update({
					_id: ids[0],
					forceUpdate: node.data.forceUpdate ? false : true
				}).then(res => {
					this.loadState().then(() => {
						this.tableCtrl.willRefreshTable.next('DATA');
					});
				});
			}
		} else if (param.type == 'START_SCRAP') {
			this.startScrapingByIds(selectedIds);
		} else if (param.type == 'EDIT_ROOT') {
		} else if (param.type == 'DUPLICATE') {
			if (node.data.type != 'root') {
				this.onDuplicate(selectedIds[0]);
			}
		} else if (param.type == 'CSV') {
			// this.onDownloadCSV(selectedIds[0]);
		} else if (param.type == 'ENTER') {
			const node = this.tableCtrl.gridApi.getRowNode(ids[0]);
			if (node && node.data && node.data.link) {
				window.open(node.data.link);
			}
		}
	}
	async onDownloadCSV(id) {
		this.loadingSubject.next(true);

		try {
			const payload = {
				filterModel: {
					source: {
						filterType: 'eq',
						value: id
					}
				},
				pageSize: 500,
				sortModel: [],
				startRow: 0
			};
		} catch (error) {
		}

		this.loadingSubject.next(false);
	}
	async onEditSourceRoot(id) {

		try {
			const source = await this.sourceService.getById(id);
			if (!source) { throw {}; }

			const modalRef = this.modal.open(SourceRootEditDialog, { animation: false, size: 'xl' });
			modalRef.componentInstance.source = source;

			const subscr = modalRef.closed.subscribe(async res => {
				try {
				} catch (error) {

				}
				setTimeout(() => subscr.unsubscribe(), 100);
			});
		} catch (error) {

		}
	}
	onDeleteByIds(ids) {

		const _description = 'Are you sure to permanently delete these sources?';
		const _success = `Sources have been deleted`;

		const modalRef = this.modal.open(MainModalComponent, { animation: false });
		modalRef.componentInstance.modalData = {
			text: _description,
			yes: 'GENERAL.YES',
			withNotify: true,
			notifyLabel: 'Delete related campaigns'
		};

		const subscr = modalRef.closed.subscribe(async e => {
			if (e) {
				const res = await this.sourceService.deleteByIds(ids, e.notify);
				if (res) {
					this.toastService.show(this.translate.instant(_success));
					this.keptPage = Math.max(0, this.tableCtrl.gridApi.paginationGetCurrentPage() - Math.floor(ids.length / this.tableCtrl.gridApi.paginationGetPageSize()));
					this.tableCtrl.onDeSelectAllButton();
					await this.loadState();
					this.tableCtrl.willRefreshTable.next('DATA');
				}
			}
			setTimeout(() => subscr.unsubscribe(), 100);
		});

	}
	onDuplicate(id) {

		const _description = 'Are you sure to duplicate this source?';
		const _waitDescription = 'Source is duplicating...';
		const _success = `Source has been duplicated`;

		const modalRef = this.modal.open(MainModalComponent, { animation: false });
		modalRef.componentInstance.modalData = {
			text: _description,
			yes: 'GENERAL.YES',
		};

		const subscr = modalRef.closed.subscribe(async e => {
			if (e) {
				const res = await this.sourceService.duplicate(id);
				if (res) {
					this.toastService.show(this.translate.instant(_success));

					if (res && res._id) {
						this.router.navigate(['edit', res._id], { relativeTo: this.activatedRoute });
					}
				}
			}

			setTimeout(() => subscr.unsubscribe(), 100);
		});

	}
	startScrapingByIds(ids) {

		if (this.selectedCountries.length == 0) {
			this.toastService.show('Please select countries');
			return;
		}

		const _description = 'Are you sure to start scraping?';
		const _waitDescription = 'Sources are scraping...';
		const _success = `Scraping have been started`;

		const modalRef = this.modal.open(MainModalComponent, { animation: false });
		modalRef.componentInstance.modalData = {
			text: _description,
			yes: 'GENERAL.YES',
		};

		const subscr = modalRef.closed.subscribe(async e => {
			if (e) {
				const res = await this.sourceService.startScraping({ ids, countries: this.selectedCountries.map(el => el.key) });
				if (res) {
					this.toastService.show(this.translate.instant(_success));
					// this.keptPage = Math.max (0, this.tableCtrl.gridApi.paginationGetCurrentPage() - Math.floor(ids.length / this.tableCtrl.gridApi.paginationGetPageSize()));
					// this.tableCtrl.onDeSelectAllButton();
					this.router.navigateByUrl('/admin/scraping');
				}
			}

			setTimeout(() => subscr.unsubscribe(), 100);
		});
	}
	addCommas(nStr) {
		if (nStr == null) {
			return '';
		}
		nStr += '';
		const comma = /,/g;
		nStr = nStr.replace(comma, '');
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
	onClickTab(item) {
		this.activeTab = item;
		this.defineColumns();
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
		this.tableCtrl.onDeSelectAllButton();
		this.tableCtrl.willRefreshTable.next('DATA');
	}
	async loadState() {
		this.loadingSubject.next(true);
		try {
			const res = await this.sourceService.getCountByState({ countries: this.selectedCountries.map(el => el.key) });
			if (!res) { throw {}; }

			each(res, (value, key) => {
				const tab = this.tabs.find(el => el.state == key);
				if (tab) {
					tab.count = value;
				}
			});
			if (!this.activeTab || this.activeTab.count == 0) {
				this.activeTab = this.tabs[0];
			}
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
			this.defineColumns();
		} catch (error) {
			console.log(error);
		}
		this.loadingSubject.next(false);
	}
	checkPermission(ids) {
		const selectedSources = ids.map(id => {
			const node = this.tableCtrl.gridApi.getRowNode(id);
			if (node) { return node.data; }
			return this.tableCtrl.originSelectedRows.find(el => el._id == id);
		}).filter(el => el);
		try {
			if (selectedSources.length == 0) { throw {}; }
			if (this.writable.admin) { return true; }
			if (!this.writable.allowed) { throw {}; }

			if (!selectedSources.reduce((carry, item) => carry && item.configs.filter(el => intersection(el.involvedCampaignCountries, this.writable.countries).length).length > 0, true)) { throw {}; }

			return true;
		} catch (error) {

		}
		this.toastService.show('You dont have permission for this action!');
		return false;
	}
	async onSelectCountry() {
		sessionStorage.setItem('selectedCountries', JSON.stringify(this.selectedCountries));
		try {
			await this.loadState();
			this.tableCtrl.willRefreshTable.next('DATA');
		} catch (error) {

		}
	}
	async onClickEditComment(param) {
		const modalRef = this.modal.open(AddCommentDialog, { animation: false });
		modalRef.componentInstance.comment = param.comment;
		const subscr = modalRef.closed.subscribe(async e => {
			if (e) {
				await this.sourceService.update({ _id: param._id, comment: e });
				this.tableCtrl.willRefreshTable.next('DATA');
			}
			setTimeout(() => subscr.unsubscribe(), 100);
		});
	}
	convertToPlain(html) {
		const tempDivElement = document.createElement('div');
		tempDivElement.innerHTML = html;
		const text = tempDivElement.textContent || tempDivElement.innerText || '';
		return text.substr(0, 40) + (text.length > 40 ? '...' : '');
	}
}
