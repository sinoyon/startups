import { CommonService } from 'src/app/pages/common/common.service';
// Angular
import { Component, OnInit, ViewChild, ChangeDetectionStrategy, OnDestroy, ViewRef, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription, BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { cloneDeep, union, each } from 'lodash';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as objectPath from 'object-path';
import { LpTableComponent } from 'src/app/pages/common/lp-table/lp-table.component';
import { ToastService } from 'src/app/pages/common/toast.service';
import { CampaignService } from 'src/app/pages/common/campaign.service';
import { CompanyService } from 'src/app/pages/common/company.service';
import { KTUtil } from 'src/app/_metronic/kt';
import { QueryResultsModel } from 'src/app/pages/common/models/query-results.model';
import { MainModalComponent } from 'src/app/_metronic/partials/layout/modals/main-modal/main-modal.component';
import { LayoutService } from 'src/app/_metronic/layout';
import { tag2category } from 'src/app/pages/common/common';


@Component({
	selector: 'app-companies-list',
	templateUrl: './companies-list.component.html',
	styleUrls: ['./companies-list.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompaniesListComponent implements OnInit, OnDestroy {

	locale = 'it-IT';

	loadingSubject = new BehaviorSubject<boolean>(true);
	loading$: Observable<boolean>;

	columnDefs: any[] = [];
	isEmptyTable = false;
	keptPage = -1;
	tabs: any[] = [
		{
			title: 'All',
			state: 'all',
			filter: {
			}
		},
		{
			title: 'No campaigns',
			state: 'no_campaigns',
			filter: {
				campaigns: {
					filterType: 'size',
					value: 0
				}
			},
			count: 0
		},
		{
			title: 'Duplicated',
			state: 'duplicated',
			filter: {
			},
			count: 0
		}
	];
	activeTab;

	extraActions: any[] = [{
		type: 'RE_SCRAP',
		text: 're-scrap'
	}];

	filterCountries = [];

	@ViewChild('tableCtrl', { static: true }) tableCtrl: LpTableComponent;

	private unsubscribe: Subscription[] = [];

	constructor(
		private activatedRoute: ActivatedRoute,
		private cdr: ChangeDetectorRef,
		private router: Router,
		private translate: TranslateService,
		private toastService: ToastService,
		private modal: NgbModal,
		private layoutService: LayoutService,
		private campaignService: CampaignService,
		private companyService: CompanyService,
		private comService: CommonService
	) { }

	ngOnInit() {
		this.loading$ = this.loadingSubject.asObservable();

		this.unsubscribe.push(this.translate.onLangChange.subscribe(lang => {
			this.updateByTranslate(lang.lang);
		}));
		this.updateByTranslate(this.translate.currentLang);

		this.loadState().then(() => {
			this.tableCtrl.willRefreshTable.next('DATA');
		});

		this.unsubscribe.push(this.layoutService.createOnToolbarSubject.subscribe(param => {
			this.router.navigate(['/admin/companies/add']);
		}));
		this.layoutService.createVisibleOnToolbar$.next(true);
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
			{ headerName: this.translate.instant('Name'), filter: 'agTextColumnFilter', field: 'name', editable: false, minWidth: 200 },
			{
				headerName: this.translate.instant('Type'), field: 'type', editable: false, filter: 'agTextColumnFilter',
				cellRenderer: param => {
					if (param.data && param.data.type) {
						return param.data.type.names[0].value;
					}
				},
			},
			{
				headerName: this.translate.instant('Country'), filter: 'agTextColumnFilter', field: 'country', editable: false, minWidth: 100,
				cellRenderer: param => {
					if (param.data && param.data.country) {
						return `<span class="badge rounded-0 badge-primary">${param.data.country.charAt(0).toUpperCase() + param.data.country.slice(1)}</span>`;
					}
				},
				floatingFilterComponent: 'dropdownFloatingFilter',
				suppressMenu: true,
				floatingFilterComponentParams: {
					suppressFilterButton: true,
					options: this.filterCountries
				},
			},
			{
				headerName: this.translate.instant('Involved Campaigns'), field: 'campaigns', editable: false, action: 'OVERVIEW',
				cellRenderer: param => {
					if (param.data && param.data.campaigns) {
						setTimeout(() => {
							param.data.campaigns.forEach(c => {
								const campaignButton = param.eGridCell.querySelector('#theCampaign-' + c._id);
								if (campaignButton) {
									campaignButton.addEventListener('click', () => {
										this.onClickViewCampaign(c);
									});
								}
							});
						}, 0);
						return param.data.campaigns.map(c => {
							if (c) {
								let statusClass;
								switch (c.status) {
									case '1_ongoing':
										statusClass = 'badge me-1 badge-success rounded-0 text-uppercase';
										break;
									case '2_comingsoon':
										statusClass = 'badge me-1 badge-warning rounded-0 text-uppercase';
										break;
									case '3_funded':
										statusClass = 'badge me-1 badge-light-primary rounded-0 text-uppercase';
										break;
									case '4_closed':
										statusClass = 'badge me-1 badge-secondary rounded-0 text-uppercase';
										break;
									case '5_extra':
										statusClass = 'badge me-1 badge-info rounded-0 text-uppercase';
										break;
									case '6_refunded':
										statusClass = 'badge me-1 badge-light-success rounded-0 text-uppercase';
										break;
									default:
										break;
								}
								if (statusClass) {
									return `<span id="theCampaign-${c.id}"
										class="${statusClass}">${c.name}</span>`;
								}
							}
							return ' ';
						}).join('');
					}
				}
			},
			{
				headerName: this.translate.instant('Original tags'), filter: 'agTextColumnFilter', field: 'originalTags', editable: false, minWidth: 150,
				cellRenderer: param => {
					if (param.data) {
						return union(param.data.originalTags).map(el => `<span
						class="badge badge-secondary">${el}</span>`).join(' ');
					}
				},
			},
			{
				headerName: this.translate.instant('Tags'), filter: 'agTextColumnFilter', field: 'tags', editable: false, minWidth: 150,
				cellRenderer: param => {
					if (param.data) {

						const tags = param.data.tags || [];
						const tagsHtml = tags.map((el, index) =>
							`<span class="badge me-1 rounded-0 badge-light-primary">${tag2category(el)}
						</span>`).join(' ');

						return tagsHtml;
					}
				},
			},
			{
				headerName: this.translate.instant('Fiscal Code'), filter: 'agTextColumnFilter', field: 'fiscalCode', editable: false, minWidth: 150,
			},
			{
				headerName: this.translate.instant('Web link'), filter: 'agTextColumnFilter', field: 'webPageLink', editable: false, minWidth: 150,
				cellRenderer: param => {
					if (param.data && param.data.webPageLink) {
						const regexpValidUrl = /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
						let webPage = param.data.webPageLink;
						if (regexpValidUrl.test(webPage)) {
							webPage = webPage.indexOf('http') >= 0 ? webPage : 'https://' + webPage;
							return `<a href="${webPage}" target="_blank">${webPage}</a>`;
						} else {
						}
					}
				}
			},
			{
				headerName: this.translate.instant('Socials'), filter: 'agTextColumnFilter', field: 'socials', editable: false, minWidth: 150,
				cellRenderer: param => {
					if (param.data && param.data.socials && param.data.socials.length > 0) {
						return param.data.socials.filter(e => e).map(e => {
							if (e.indexOf('facebook') >= 0) {
								return `<span class="social">
									<a href="${e}" target="_blank">
										<i class="socicon-facebook"></i>
									</a>
								</span>`;
							} else if (e.indexOf('twitter') >= 0) {
								return `<span class="social">
									<a href="${e}" target="_blank">
										<i class="socicon-twitter"></i>
									</a>
								</span>`;
							} else if (e.indexOf('linkedin') >= 0) {
								return `<span class="social">
									<a href="${e}" target="_blank">
										<i class="socicon-linkedin"></i>
									</a>
								</span>`;
							} else if (e.indexOf('youtube') >= 0) {
								return `<span class="social">
									<a href="${e}" target="_blank">
										<i class="socicon-youtube"></i>
									</a>
								</span>`;
							} else if (e.indexOf('mailto') >= 0) {
								return `<span class="social">
									<a href="${e}" target="_blank">
										<i class="socicon-mail"></i>
									</a>
								</span>`;
							} else {
								return null;
							}
						}).filter(e => e).join(' ');
					}
				},
				cellClass: isMobile ? 'custom-cell' : 'last-column-cell custom-cell'
			},
			{
				action: 'EDIT', width: 42, fixed: true, pinned: isMobile ? null : 'right', editable: false, sortable: false,
				cellRenderer: param => '<i class="la la-pen"></i>'
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
		this.loadingSubject.next(true);
		if (!this.activeTab || this.activeTab.count == 0) {
			param.cb([], 0);
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

		if (payload.sortModel && !payload.sortModel.find(e => e.colId && e.colId.indexOf('name') >= 0)) {
			payload.sortModel.push({ colId: 'name', sort: 'asc' });
		}

		payload.filterModel = {
			...payload.filterModel,
			...this.activeTab.filter
		};
		let result: QueryResultsModel;
		try {
			const res = this.activeTab.state == 'duplicated' ? await this.companyService.getDuplicated(payload, {
				source: 'name'
			}) : await this.companyService.get(payload, {
				source: 'name'
			});
			result = new QueryResultsModel(res.items, res.totalCount);
		} catch (error) {
			console.log(error);
		}
		if (result) {
			if (!this.filterCountries.length) {
				payload.endRow = result.totalCount > 1000 ? 750 : result.totalCount;
				payload.pageSize = result.totalCount > 1000 ? 750 : result.totalCount;

				const tres = this.activeTab.state == 'duplicated' ? await this.companyService.getDuplicated(payload, {
					source: 'name'
				}) : await this.companyService.get(payload, {
					source: 'name'
				});
				(tres.items as Array<any>).forEach(elee => {
					if (elee.country) {
						const exis = this.filterCountries.findIndex(eel => eel.value == elee.country) > -1;
						if (!exis) {
							this.filterCountries.push({
								label: elee.country.charAt(0).toUpperCase() + elee.country.slice(1),
								value: elee.country
							});
						}
					}
				});
				this.defineColumns();
			}

			let otherCountries = [];
			(result.items as Array<any>).forEach(elee => {
				if (elee.country) {
					const exis = this.filterCountries.findIndex(eel => eel.value == elee.country) > -1;
					if (!exis) {
						otherCountries.push({
							label: elee.country.charAt(0).toUpperCase() + elee.country.slice(1),
							value: elee.country
						});
					}
				}
			});
			if (otherCountries.length) {
				this.filterCountries = this.filterCountries.concat(otherCountries);
				this.defineColumns();
			}

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
		} else if (param.type == 'RE_SCRAP') {
			this.onReScrapCompanies(selectedIds);
		}
	}
	onDeleteByIds(ids) {
		const _description = 'Are you sure to permanently delete these companies?';
		const _waitDescription = 'Companies are deleting...';
		const _success = `Companies have been deleted`;

		const modalRef = this.modal.open(MainModalComponent, { animation: false });
		modalRef.componentInstance.modalData = {
			text: _description,
			yes: 'GENERAL.YES',
		};

		const subscr = modalRef.closed.subscribe(async e => {
			if (e) {
				const res = await this.companyService.deleteByIds(ids);
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
	onReScrapCompanies(ids = null) {
		const _description = ids ? 'Are you sure to re-scrap these companies?' : 'Are you sure to re-scrap all companies?';
		const _waitDescription = 'Companies are re-scraping...';
		const _success = `Companies have been re-scraped`;

		const modalRef = this.modal.open(MainModalComponent, { animation: false });
		modalRef.componentInstance.modalData = {
			text: _description,
			yes: 'GENERAL.YES',
		};

		const subscr = modalRef.closed.subscribe(async e => {
			if (e) {
				const res = await this.companyService.reScrapCompanies(ids);
				if (res) {
					this.toastService.show(this.translate.instant(_success));
					if (ids) {
						this.keptPage = Math.max(0, this.tableCtrl.gridApi.paginationGetCurrentPage() - Math.floor(ids.length / this.tableCtrl.gridApi.paginationGetPageSize()));
					}
					this.tableCtrl.onDeSelectAllButton();
					this.tableCtrl.willRefreshTable.next('DATA');
				}
			}

			setTimeout(() => subscr.unsubscribe(), 100);
		});

	}
	async onClickViewCampaign(campaignData) {
		if (campaignData.systemTitle) {
			window.open(window.origin + '/crowdfunding/' + (campaignData.systemTitle || ''));
		} else if (campaignData._id) {

			try {
				const campaign = await this.campaignService.getById(campaignData._id);
				if (!campaign) { throw {}; }

				const modalRef = this.modal.open(MainModalComponent, { animation: false });

				modalRef.componentInstance.modalData = {
					key_values: ['name', 'source.name', 'status', 'tags', 'typology', 'link'].map(key => ({
						key,
						value: objectPath.get(campaign, key)
					}))
				};
			} catch (error) {

			}
		}
	}
	onClickTab(item) {
		this.activeTab = item;

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}

		this.tableCtrl.onDeSelectAllButton();
		this.tableCtrl.willRefreshTable.next('DATA');
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
	async loadState(active = null) {
		this.loadingSubject.next(true);
		try {
			if (active) {
				this.activeTab = this.tabs.find(el => el.state == active);
			}
			const res = await this.companyService.getCountByState();
			if (!res) { throw {}; }

			each(res, (value, key) => {
				const category = this.tabs.find(el => el.state == key);
				if (category) {
					category.count = value;
				}
			});
			if (!this.activeTab || this.activeTab.count == 0) {
				this.activeTab = this.tabs[0];
			}
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		} catch (error) {
			console.log(error);
		}
		this.loadingSubject.next(false);
	}
}
