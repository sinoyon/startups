// Angular
import { Component, OnInit, ViewChild, ChangeDetectionStrategy, OnDestroy, ViewRef, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription, BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { cloneDeep, union, each, concat, find, findLast, sortBy, reverse, intersectionWith } from 'lodash';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { Location } from '@angular/common';
import { SourceService } from '../../common/source.service';
import { UserService } from '../../common/user.service';
import { AliasService } from '../../common/alias.service';
import { AdvertisementService } from '../../common/advertisement.service';
import { TransactionService } from '../../common/transaction.service';
import { WalletService } from '../../common/wallet.service';
import { CampaignService } from '../../common/campaign.service';
import { QueryResultsModel } from '../../common/models/query-results.model';
import { MainModalComponent } from 'src/app/_metronic/partials/layout/modals/main-modal/main-modal.component';
import { WalletDetailDialog } from './wallet-detail-dialog/wallet-detail-dialog';
import { LpTableComponent } from '../../common/lp-table/lp-table.component';
import { KTUtil } from 'src/app/_metronic/kt';
import { AuthService } from 'src/app/modules/auth';
import { AddCommentDialog } from '../../admin/user/user-list/add-comment-dialog/add-comment.dialog';
import { SplashScreenService } from 'src/app/_metronic/partials';
import { switchMap } from 'rxjs/operators';
import { ToastService } from '../../common/toast.service';
import * as e from 'express';

@Component({
	selector: 'app-reports-analytics-list',
	templateUrl: './analytics-list.component.html',
	styleUrls: ['./analytics-list.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnalyticsReportsListComponent implements OnInit, OnDestroy {

	locale = 'it-IT';

	loadingSubject = new BehaviorSubject<boolean>(true);
	loading$: Observable<boolean>;

	columnDefs: any[] = [];
	isEmptyTable = false;
	keptPage = -1;

	_typologies: any[] = [
		{ key: 'company equity', title: 'company equity' },
		{ key: 'company lending', title: 'company lending' },
		{ key: 'real estate equity', title: 'real estate equity' },
		{ key: 'real estate lending', title: 'real estate lending' },
		{ key: 'minibond', title: 'minibond' }
	];
	_countries: any[] = [
		{key: 'italy', title: 'Italy'},
		{key: 'france', title: 'France'},
		{key: 'spain', title: 'Spain'},
		{key: 'german', title: 'German'}
	];

	typologies = [];
	countries = [];

	selectedTypologies = [];
	selectedCountries = [];
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

	type = 'user';
	sourceReport: any = {};
	withPastAdvertisement = false;

	registeredUsers;
	user;
	periodType = 'month';
	periodStart: Date = new Date((new Date()).getFullYear(), (new Date()).getMonth(), 1);
	periodEnd: Date = new Date((new Date()).getFullYear() + 1, (new Date()).getMonth() + 1, 0);
	periodRange: Date[] = [new Date((new Date()).getFullYear(), (new Date()).getMonth(), 1),
	new Date((new Date()).getFullYear() + 1, (new Date()).getMonth() + 1, 0)];

	@ViewChild('tableCtrl', { static: true }) tableCtrl: LpTableComponent;
	@ViewChild('yearPicker', { static: true }) yearPicker;
	@ViewChild('monthPicker', { static: true }) monthPicker;

	page = {
		user: {
			permission: 'analytics',
			downloadable: false
		},
		home: {
			permission: 'analytics',
			downloadable: false
		},
		advertisement: {
			permission: 'analytics',
			downloadable: false
		},
		category: {
			permission: 'analytics',
			downloadable: false
		},
		campaign: {
			permission: 'analytics',
			downloadable: false
		},
		source: {
			permission: 'analytics',
			downloadable: false
		}
	};


	private unsubscribe: Subscription[] = [];

	constructor(
		private activatedRoute: ActivatedRoute,
		private cdr: ChangeDetectorRef,
		private router: Router,
		private translate: TranslateService,
		private sourceService: SourceService,
		private userService: UserService,
		private aliasService: AliasService,
		private advertisementService: AdvertisementService,
		private modal: NgbModal,
		private location: Location,
		private transactionService: TransactionService,
		private walletService: WalletService,
		private auth: AuthService,
		private toastService: ToastService,
		private splashScreenService: SplashScreenService,
		private campaignService: CampaignService) {

	}

	ngOnInit() {

		this.loading$ = this.splashScreenService.loadingSubject.asObservable();
		this.user = this.auth.currentUserValue;
		// this._countries = this.user.countries.map(el => ({
		// 	key: el,
		// 	title: el.charAt(0).toUpperCase() + el.slice(1)
		// }));

		this.selectedCountries = sessionStorage.getItem('selectedCountries') ? JSON.parse(sessionStorage.getItem('selectedCountries')) : [];

		this.unsubscribe.push(
			this.activatedRoute.paramMap.pipe(
				switchMap(async params => {
					const type = params.get('type');
					if (['user', 'home', 'advertisement', 'category', 'source', 'campaign'].includes(type)) {
						this.type = type;
						this.init();
					} else {
						this.router.navigate(['/report/analytics/user']);
					}
				})
			).subscribe(() => { })
		);
		this.loading$ = this.loadingSubject.asObservable();
		this.unsubscribe.push(this.translate.onLangChange.subscribe(lang => {
			this.updateByTranslate(lang.lang);
		}));
		this.updateByTranslate(this.translate.currentLang);

	}
	async init() {
		let pr = this.auth.hasPermission(this.page[this.type].permission, 'readable');
		if (!pr.allowed) {
			this.toastService.show('You dont have permision for this page');
			this.router.navigateByUrl('/');
			return;
		}
		this.typologies = this._typologies.filter(el => pr.typologies.includes(el.key));
		this.countries = this._countries.filter(el => pr.countries.includes(el.key));
		pr = this.auth.hasPermission(this.page[this.type].permission, 'downloadable');
		this.page[this.type].downloadable = pr.allowed;

		if (this.selectedCountries.length) {
			this.selectedCountries = intersectionWith(this.selectedCountries, this.countries, (a, b) => a.key == b.key);
		} else {
			this.selectedCountries = [this.countries.find(el => el.key == 'italy') || this.countries[0]];
		}

		if (this.selectedTypologies.length) {
			this.selectedTypologies = intersectionWith(this.selectedTypologies, this.typologies, (a, b) => a.key == b.key);
		} else {
			this.selectedTypologies = [this.typologies[0]];
		}

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		};

		this.defineColumns();
		this.tableCtrl.willRefreshTable.next('DATA');
	}

	ngOnDestroy() {
		this.unsubscribe.forEach(el => el.unsubscribe());
	}
	updateByTranslate(lang) {
		if (lang == 'en') {
			this.locale = 'en-US';
		} else if (lang == 'it') {
			this.locale = 'it-IT';
		}
		this.defineColumns();
	}


	async defineColumns() {
		const isMobile = KTUtil.isMobileDevice();

		this.tableCtrl.selectionPreviewColumns = [{ field: 'name' }];
		let columnDefs = [];
		this.columnDefs = columnDefs;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
		try {
			if (this.type == 'campaign') {
				columnDefs = [
					{
						headerName: this.translate.instant('Name'), filter: 'agTextColumnFilter', field: 'name', pinned: isMobile ? null : 'left', editable: false, minWidth: 200,
						cellRenderer: param => {
							if (param.data && param.data.name) {
								return param.data.name;
							}
						}
					},
					{
						headerName: this.translate.instant('Source'), filter: 'agTextColumnFilter', field: 'source', pinned: isMobile ? null : 'left', editable: false, minWidth: 100,
						cellRenderer: param => {
							if (param.data && param.data.source) {
								return param.data.source.name;
							}
						}
					},
					{
						headerName: this.translate.instant('Start date'), filter: 'agDateColumnFilter', field: 'startDate', editable: false,
						cellRenderer: param => {
							if (param.data && param.data.startDate) {
								return this.getDateTimeFromDate(param.data.startDate);
							}
						}
					},
					{
						headerName: this.translate.instant('End date'), filter: 'agDateColumnFilter', field: 'endDate', editable: false,
						cellRenderer: param => {
							if (param.data && param.data.endDate) {
								return this.getDateTimeFromDate(param.data.endDate);
							}
						}
					},
					{
						headerName: this.translate.instant('Status'), filter: 'agTextColumnFilter', field: 'status', editable: false, sortable: true, minWidth: 100,
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
						}
					},
					{ headerName: this.translate.instant('Following'), field: 'followsCount', editable: false },
					{ headerName: this.translate.instant('Watch Video'), field: 'clickVideo', editable: false },
					{ headerName: this.translate.instant('Visit Detail Page'), field: 'clickDetail', editable: false },
					{
						headerName: this.translate.instant('Visit External page'), field: 'clickExternal', editable: false,
						cellClass: isMobile ? 'custom-cell' : 'last-column-cell custom-cell'
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
			} else if (this.type == 'source') {
				columnDefs = [
					{
						headerName: this.translate.instant('Name'), field: 'name', pinned: isMobile ? null : 'left', editable: false, minWidth: 200,
						cellRenderer: param => {
							if (param.data && param.data.name) {
								return param.data.name;
							}
						}
					},
					{ headerName: this.translate.instant('Following'), field: 'followsCount', editable: false },
					{ headerName: this.translate.instant('Wallet'), field: 'walletCount', editable: false },
					{ headerName: this.translate.instant('Watch Video'), field: 'clickVideo', editable: false },
					{ headerName: this.translate.instant('Visit Detail Page'), field: 'clickDetail', editable: false },
					{
						headerName: this.translate.instant('Visit External page'), field: 'clickExternal', editable: false,
						cellClass: isMobile ? 'custom-cell' : 'last-column-cell custom-cell'
					},
					{
						action: 'ENTER_SOURCE', width: 42, fixed: true, pinned: isMobile ? null : 'right', editable: false, sortable: false,
						cellRenderer: param => {
							if (param.data && param.data.link) {
								return `<a target="_blank" href="${param.data.link}"><i class="fa fa-link"></i></a>`;
							}
						}
					},
				];
			} else if (this.type == 'user') {
				columnDefs = [
					{
						headerName: this.translate.instant('Name'), filter: 'agTextColumnFilter', field: 'name', editable: false, minWidth: 200,
						cellRenderer: param => {
							if (param.data && (param.data.firstName || param.data.lastName)) {
								return param.data.firstName + ' ' + param.data.lastName;
							}
						}
					},
					{
						headerName: this.translate.instant('Email'), filter: 'agTextColumnFilter', field: 'email', editable: false, minWidth: 200,
					},
					{
						headerName: this.translate.instant('Comments'), field: 'comments.content', editable: false,
						cellRenderer: (param) => {
							if (param.data) {
								let result = '';

								const commentHtml = `<span>
								${param.data && param.data.comments && param.data.comments.find(el => el.user == this.user._id) ? this.convertToPlain(param.data.comments.find(el => el.user == this.user._id).content || '') : ''}</span>`;
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
						headerName: this.translate.instant('Subscribe date'), filter: 'agDateColumnFilter', field: 'createdAt', editable: false,
						cellRenderer: param => {
							if (param.data && param.data.createdAt) {
								return this.getDateTimeFromDate(param.data.createdAt);
							}
						}
					},
					{ headerName: this.translate.instant('Following campaigns'), filter: 'agTextColumnFilter', field: 'followedCampaignsCount', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.followedCampaignsCount) {
								const contentHtml = `<span
								class="badge badge-light-primary rounded-0 text-uppercase">${param.data.followedCampaignsCount}</span>`;
								const actionBtnHtml = `<span id="theAction" class="action ml-2"><i class='la la-eye'></i></span>`;
								setTimeout(() => {
									const actionButton = param.eGridCell.querySelector('#theAction');
									if (actionButton) {
										actionButton.addEventListener('click', () => {
											this.onShowWallets(param.data, 'campaign');
										});
									}
								}, 100);

								return contentHtml + (actionBtnHtml || '');
							}
						}
				 	},
					{
						headerName: this.translate.instant('Following categories'), filter: 'agTextColumnFilter', field: 'followedCategories', editable: false, maxWidth: 200,
						cellRenderer: param => {
							if (param.data) {
								const tagsHtml = (param.data.followedCategories || []).map(el => `<span
								class="badge badge-light-primary">${el.names[0].value}</span>`).join(' ');
								return tagsHtml;
							}
						}
					},
					{
						headerName: this.translate.instant('Connection Time'), filter: 'agTextColumnFilter', field: 'connectedCount', editable: false,
						cellRenderer: (param) => {
							if (param.data) {
								const count = param.data.connectedCount || 0;
								const detailButtonHtml = `<span id="theDescription" class="action"><i class='la la-eye'></i></span>`;
								const countHtml = `<span>
								${count}</span>`;

								setTimeout(() => {
									const detailButton = param.eGridCell.querySelector('#theDescription');
									if (detailButton) {
										detailButton.addEventListener('click', () => {
											this.onShowConnectionLog(param.data._id);
										});
									}
								}, 0);

								return countHtml + (count > 0 ? detailButtonHtml : '');

							}
						}
					},
					{
						headerName: this.translate.instant('Portfolio'), filter: 'agTextColumnFilter', field: 'walletCount', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.walletCount) {
								const count = param.data.walletCount;
								const detailButtonHtml = `<span id="theDescription" class="action"><i class='la la-eye'></i></span>`;
								const countHtml = `<span>
								${count}</span>`;

								setTimeout(() => {
									const detailButton = param.eGridCell.querySelector('#theDescription');
									if (detailButton) {
										detailButton.addEventListener('click', () => {
											this.onShowWallets(param.data._id, 'wallet');
										});
									}
								}, 0);

								return countHtml + (count > 0 ? detailButtonHtml : '');

							}
						},
						cellClass: isMobile ? 'custom-cell' : 'last-column-cell custom-cell'
					}
				];
			} else if (this.type == 'home') {
				columnDefs = [
					{
						headerName: this.translate.instant('Name'), filter: 'agTextColumnFilter', field: 'name', editable: false, minWidth: 200,
						cellRenderer: param => {
							if (param.data && param.data.name) {
								return param.data.name;
							}
						}
					},
					{
						headerName: this.translate.instant('Value'), filter: 'agTextColumnFilter', field: 'count', editable: false,
						cellRenderer: (param) => {
							if (param.data) {
								const count = param.data.count || 0;
								const detailButtonHtml = `<span id="theDescription" class="action"><i class='la la-eye'></i></span>`;
								const countHtml = `<span>
								${count}</span>`;

								setTimeout(() => {
									const detailButton = param.eGridCell.querySelector('#theDescription');
									if (detailButton) {
										detailButton.addEventListener('click', () => {
											this.onShowHomeActionDetail(param.data.value);
										});
									}
								}, 0);

								return countHtml + (count > 0 && param.data.hasDetail ? detailButtonHtml : '');

							}
						},
						cellClass: isMobile ? 'custom-cell' : 'last-column-cell custom-cell'
					}
				];
			} else if (this.type == 'advertisement') {
				columnDefs = [
					{
						headerName: this.translate.instant('Name'), field: 'name', editable: false, minWidth: 200, sortable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.type == 'campaign') {
								if (param.data.campaign) {
									return param.data.campaign.name;
								} else {
									return `<span class="badge badge-brand rounded-0 text-uppercase">Advertisement</span>`;
								}
							} else if (param.data && param.data.type == 'source') {
								if (param.data.campaign) {
									return param.data.source.name;
								} else {
									return `<span class="badge badge-brand rounded-0 text-uppercase">Advertisement</span>`;
								}
							}
						}
					},
					{
						headerName: this.translate.instant('Type'), editable: false, sortable: false,
						cellRenderer: (param) => {
							if (param.data) {
								switch (param.data.type) {
									case 'campaign':
										return `<span class="badge badge-primary rounded-0 text-uppercase">Campaign</span>`;
									case 'source':
										return `<span class="badge badge-success rounded-0 text-uppercase">Source</span>`;
									case null:
										return `<span class="badge badge-warning rounded-0 text-uppercase">Advertisement</span>`;
								}
							}
						}
					},
					{
						headerName: this.translate.instant('Start date'), filter: false, field: 'startDate', editable: false,
						cellRenderer: param => {
							if (param.data && param.data.type == 'campaign') {
								if (param.data.campaign && param.data.campaign.startDate) {
									return this.getDateTimeFromDate(param.data.campaign.startDate, 'day');
								}
							} else if (param.data && param.data.type == 'source') {
							}
						}
					},
					{
						headerName: this.translate.instant('End date'), filter: false, field: 'endDate', editable: false,
						cellRenderer: param => {
							if (param.data && param.data.type == 'campaign') {
								if (param.data.campaign && param.data.campaign.endDate) {
									return this.getDateTimeFromDate(param.data.campaign.endDate, 'day');
								}
							} else if (param.data && param.data.type == 'source') {
							}
						}
					},
					{ headerName: this.translate.instant('Watch Video'), field: 'clickVideo', editable: false },
					{ headerName: this.translate.instant('Visit Detail Page'), field: 'clickDetail', editable: false },
					{ headerName: this.translate.instant('Visit External page'), field: 'clickExternal', editable: false },
					{
						headerName: this.translate.instant('Active days'), field: 'activeDays', editable: false,
						cellRenderer: param => {
							if (param && param.data && param.data.activeDuration && param.data.activeDuration.length) {
								return param.data.activeDuration.reduce((carry, item, index) => {
									if (item.startDate && item.endDate) {
										carry += moment(item.endDate).diff(moment(item.startDate), 'days');
									} else if (item.startDate && index == param.data.activeDuration.length - 1 && !param.data.deleted) {
										carry += moment().diff(moment(item.startDate), 'days');
									}
									return carry;
								}, 0);
							}
						},
						cellClass: isMobile ? 'custom-cell' : 'last-column-cell custom-cell'
					},
					{
						action: 'ENTER', width: 42, fixed: true, pinned: isMobile ? null : 'right', editable: false, sortable: false,
						cellRenderer: param => {
							if (param.data && param.data.type == 'campaign') {
								if (param.data.campaign) {
									return `<i class="fa fa-link" style="${param.data.campaign.link ? '' : 'opacity: 0.4; cursor: not-allowed'}"></i>`;
								}
							} else if (param.data && param.data.type == 'source') {
								if (param.data.campaign) {
								}
							}

						},
						tooltip: param => {
							if (param && param.data && param.data.campaign && param.data.campaign.link) {
								return param.data.campaign.link;
							}
						}
					},
				];
			} else if (this.type == 'category') {
				columnDefs = [
					{
						headerName: this.translate.instant('Name'), filter: 'agTextColumnFilter', field: 'name', pinned: isMobile ? null : 'left', editable: false, minWidth: 200,
						cellRenderer: param => {
							if (param.data && param.data.names) {
								return param.data.names[0].value;
							}
						}
					},

					{
						headerName: this.translate.instant('Following'), field: 'followsCount', editable: false
						, cellClass: isMobile ? 'custom-cell' : 'last-column-cell custom-cell'
					},

				];
			}

		} catch (error) {
			console.log(error);
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
		let startTime; let endTime;
		startTime = moment(this.periodStart).startOf('day').toDate();
		if (this.periodType == 'day') {
			endTime = moment(this.periodStart).endOf('day').toDate();
		} else if (this.periodType == 'none') {
			startTime = new Date(1970, 0, 0);
			endTime = new Date(2200, 0, 0);
		} else {
			endTime = moment(this.periodEnd).endOf('day').toDate();
		}
		if (this.type == 'home') {
			try {
				const res = await this.transactionService.getByTypes({
					startTime,
					endTime,
					types: [
						'home.filter.category',
						'home.filter.source',
						'home.filter.minimumInvestment',
						'home.filter.holdingTime',
						'home.filter.preMoneyEvaluation',
						'home.filter.roiAnnual',
						'home.sort.investorCount',
						'home.sort.raised',
						'home.sort.leftDays',
						'home.view',
						'home.more',
						'home.search',
						'home.map',
						'home.list',
						'home.typology',
					],
					countries: this.selectedCountries.map(el =>el.key)
				});
				if (!res) { throw {}; }
				const items = [];
				res.forEach(rel => {
					let name, hasDetail;
					switch (rel.type) {
						case 'home.filter.category':
							name = 'Filtered by category';
							hasDetail = true;
							break;
						case 'home.filter.source':
							name = 'Filtered by source';
							hasDetail = true;
							break;
						case 'home.filter.minimumInvestment':
							name = 'Filtered by minimum investment';
							hasDetail = true;
							break;
						case 'home.filter.holdingTime':
							name = 'Filtered by holdingTime';
							hasDetail = true;
							break;
						case 'home.filter.preMoneyEvaluation':
							name = 'Filtered by preMoneyEvaluation';
							hasDetail = true;
							break;
						case 'home.filter.roiAnnual':
							name = 'Filtered by roiAnnual';
							hasDetail = true;
							break;
						case 'home.sort.investorCount':
							name = 'Sorted by investors';
							break;
						case 'home.sort.raised':
							name = 'Sorted by raised money';
							break;
						case 'home.sort.leftDays':
							name = 'Sorted by end date';
							break;
						case 'home.more':
							name = 'View home with more result';
							break;
						case 'home.view':
							name = 'View home';
							break;
						case 'home.map':
							name = 'View map';
							break;
						case 'home.list':
							name = 'View list';
							break;
						case 'home.typology':
							name = 'View home with typology';
							hasDetail = true;
							break;
						case 'home.search':
							name = 'Searched by keyword';
							hasDetail = true;
							break;
					}
					const candidate = items.find(el => el.type == rel.type);
					if (candidate) {
						candidate.value.push({
							key: rel.name,
							value: rel.increased
						})
						candidate.count += rel.increased || 0;
					} else {
						items.push({
							id: items.length,
							type: rel.type,
							name,
							count: rel.increased || 0,
							value: [{
								key: rel.name,
								value: rel.increased
							}],
							hasDetail
						});
					}
				});
				param.cb(items, items.length);
				
			} catch (error) {
				console.log(error);
				param.cb([], 0);
			}

		} else {
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
			if (this.type == 'campaign') {
				if (Object.keys(payload.filterModel).find(key => key == 'tags')) {
					payload.filterModel.tags = {
						or: true,
						// filter: [[{ key: 'company.tags', ...payload.filterModel.tags}], [{ key: 'tags', ...payload.filterModel.tags}]]
						filter: [[{ key: 'company.tags', ...payload.filterModel.tags }]]
					};
				}
				if (payload.sortModel && !payload.sortModel.find(e => e.colId && e.colId.indexOf('followsCount') >= 0)) {
					payload.sortModel.push({ colId: 'followsCount', sort: 'desc' });
				}
				if (payload.sortModel && !payload.sortModel.find(e => e.colId && e.colId.indexOf('clickVideo') >= 0)) {
					payload.sortModel.push({ colId: 'clickVideo', sort: 'desc' });
				}
				if (payload.sortModel && !payload.sortModel.find(e => e.colId && e.colId.indexOf('clickDetail') >= 0)) {
					payload.sortModel.push({ colId: 'clickDetail', sort: 'desc' });
				}
				if (payload.sortModel && !payload.sortModel.find(e => e.colId && e.colId.indexOf('clickExternal') >= 0)) {
					payload.sortModel.push({ colId: 'clickExternal', sort: 'desc' });
				}
				if (Object.keys(payload.filterModel).find(key => key == 'source')) {
					payload.filterModel['source.name'] = payload.filterModel.source;
					delete payload.filterModel.source;
				}
			} if (this.type == 'source') {
				if (payload.sortModel && !payload.sortModel.find(e => e.colId && e.colId.indexOf('followsCount') >= 0)) {
					payload.sortModel.push({ colId: 'followsCount', sort: 'desc' });
				}
				if (payload.sortModel && !payload.sortModel.find(e => e.colId && e.colId.indexOf('clickVideo') >= 0)) {
					payload.sortModel.push({ colId: 'clickVideo', sort: 'desc' });
				}
				if (payload.sortModel && !payload.sortModel.find(e => e.colId && e.colId.indexOf('clickDetail') >= 0)) {
					payload.sortModel.push({ colId: 'clickDetail', sort: 'desc' });
				}
				if (payload.sortModel && !payload.sortModel.find(e => e.colId && e.colId.indexOf('clickExternal') >= 0)) {
					payload.sortModel.push({ colId: 'clickExternal', sort: 'desc' });
				}
			} else if (this.type == 'user') {
				if (Object.keys(payload.filterModel).find(key => key == 'name')) {
					payload.filterModel.name = {
						or: true,
						filter: [
							[{ key: 'firstName', filterType: 'text', filter: payload.filterModel.name.filter }],
							[{ key: 'lastName', filterType: 'text', filter: payload.filterModel.name.filter }]
						]
					};
				}
				if (payload.sortModel && !payload.sortModel.find(e => e.colId && e.colId.indexOf('createdAt') >= 0)) {
					payload.sortModel.push({ colId: 'createdAt', sort: 'desc' });
				}
				if (payload.sortModel && !payload.sortModel.find(e => e.colId && e.colId.indexOf('followedCampaignsCount') >= 0)) {
					payload.sortModel.push({ colId: 'followedCampaignsCount', sort: 'desc' });
				}
			} else if (this.type == 'advertisement') {
				if (payload.sortModel && !payload.sortModel.find(e => e.colId && e.colId.indexOf('mini') >= 0)) {
					payload.sortModel.push({ colId: 'mini', sort: 'desc' });
				}
			}

			if (this.type == 'category') {
				if (payload.sortModel && !payload.sortModel.find(e => e.colId && e.colId.indexOf('followsCount') >= 0)) {
					payload.sortModel.push({ colId: 'followsCount', sort: 'desc' });
				}
			}
			if (payload.sortModel && !payload.sortModel.find(e => e.colId && e.colId.indexOf('name') >= 0)) {
				payload.sortModel.push({ colId: 'name', sort: 'asc' });
			}

			let result: QueryResultsModel;

			try {

				if (this.type == 'campaign') {

					payload.filterModel.typology = {
						filterType: 'set',
						values: this.selectedTypologies.map(el => el.key)
					};
					payload.filterModel['source.configs.involvedCampaignCountries'] = {
						filterType: 'set',
						values: this.selectedCountries.map(el => el.key)
					};
					payload.filterModel.deleted = {
						filterType: 'ne',
						value: true
					};
					const res = await this.campaignService.getAnalyticsByPeriod(payload, {
						startTime,
						endTime
					});
					if (!res) { throw {}; }

					result = new QueryResultsModel(res.items, res.totalCount);

				} else if (this.type == 'source') {

					const res = await this.sourceService.getAnalytics({
						startTime,
						endTime,
						typologies: this.selectedTypologies.map(el => el.key),
						countries: this.selectedCountries.map(el => el.key)
					});
					if (!res) { throw {}; }

					this.sourceReport.totalFollows = 0;
					this.sourceReport.totalVideos = 0;
					this.sourceReport.totalDetails = 0;
					this.sourceReport.totalExternals = 0;
					res.forEach(item => {
						this.sourceReport.totalFollows += item.followsCount;
						this.sourceReport.totalVideos += item.clickVideo;
						this.sourceReport.totalDetails += item.clickDetail;
						this.sourceReport.totalExternals += item.clickExternal;
					});

					result = new QueryResultsModel(
						res.map((el, index) => {
							el.id = el._id || index;
							return el;
						}));

				} else if (this.type == 'user') {

					const it_c = this.selectedCountries.findIndex(ele => ele.key == 'italy') > -1;
					if (it_c) {
						payload.filterModel.country = {
							or: true,
							filter: [
								[
									{ key: 'country', filterType: 'set', values: this.selectedCountries.map(el =>el.key) }
								],
								[
									{ key: 'country', filterType: 'eq', values: null }
								]
							]
						};
					} else {
						payload.filterModel.country = {
							filterType: 'set',
							values: this.selectedCountries.map(el => el.key)
						};
					}

					const res = await this.userService.getAnalyticsByPeriod(payload, {
						startTime,
						endTime
					});
					if (!res) { throw ''; }

					result = new QueryResultsModel(res.items, res.totalCount);
					this.registeredUsers = res.registeredUsers;

				} else if (this.type == 'advertisement') {

					if (!this.withPastAdvertisement) {
						payload.filterModel.deleted = {
							filterType: 'ne',
							value: true
						};
					}					

					const res = await this.advertisementService.getAnalyticsByPeriod(payload, {
						startTime,
						endTime,
						countries: this.selectedCountries.map(el =>el.key)
					});
					if (!res) { throw {}; }
					result = new QueryResultsModel(res.items, res.totalCount);

				} else if (this.type == 'category') {

					payload.filterModel['synonyms.country'] = {
						filterType: 'set',
						values: this.selectedCountries.map(el => el.key)
					};

					const res = await this.aliasService.getAnalyticsByPeriod(payload, {
						startTime,
						endTime
					});
					if (!res) { throw {}; }

					result = new QueryResultsModel(res.items, res.totalCount);
				}

			} catch (error) {
				console.log(error);
			}

			if (result) {
				this.isEmptyTable = !isFiltered && result.totalCount == 0;
				param.cb(result.items, result.totalCount);
			} else {
				param.cb([], 0);
			}
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
		if (param.type == 'ENTER') {
			const node = this.tableCtrl.gridApi.getRowNode(ids[0]);
			if (this.type == 'campaign' || this.type == 'source') {
				if (node && node.data && node.data.link) {
					window.open(node.data.link);
				}
			} else if (this.type == 'advertisement') {
				if (node && node.data && node.data.campaign && node.data.campaign.link) {
					window.open(node.data.campaign.link);
				}
			}

		}
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
	async onShowConnectionLog(userId) {

		try {

			let startTime; let endTime;
			startTime = moment(this.periodStart).startOf('day').toDate();
			if (this.periodType == 'day') {
				endTime = moment(this.periodStart).endOf('day').toDate();
			} else if (this.periodType == 'none') {
				startTime = new Date(1970, 0, 0);
				endTime = new Date(2200, 0, 0);
			} else {
				endTime = moment(this.periodEnd).endOf('day').toDate();
			}
			const res = await this.transactionService.getWithPagination({
				filterModel: {
					ref: {
						filterType: 'eq',
						value: userId,
						isObject: true
					},
					type: {
						filterType: 'eq',
						value: 'user.connection'
					}
				}
			});
			if (!res) { throw {}; }
			const modalRef = this.modal.open(MainModalComponent, { animation: false });
			modalRef.componentInstance.modalData = {
				key_values: res.items[0].values
					.map((el, index) => ({
						key: this.getDateStringFromDate(el.date),
						value: (index == 0 ? el.value : el.value - res.items[0].values[index - 1].value) + ' times'
					}))
					.filter(el => moment(el.date).isAfter(moment(startTime)) && moment(endTime).isAfter(moment(el.date)))
			};
		} catch (error) {

		}
	}

	async onShowWallets(param, type = 'wallet') {

		if (type == 'wallet') {
			try {

				const res = await this.walletService.get({
					filterModel: {
						user: {
							filterType: 'eq',
							value: param,
							isObject: true
						}
					}
				});
				if (!res) { throw ''; }
				const result = new QueryResultsModel(res.items, res.totalCount);
				const modalRef = this.modal.open(WalletDetailDialog, { animation: false, size: 'xl' });
				modalRef.componentInstance.items = result.items;
			} catch (error) {
	
			}
		} else if (type == 'campaign') {
			const result = new QueryResultsModel(param.followedCampaigns, param.followedCampaigns.length);
			const modalRef = this.modal.open(WalletDetailDialog, { animation: false, size: 'xl' });
			modalRef.componentInstance.type = type;
			modalRef.componentInstance.items = result.items;
		}
	}

	async onShowHomeActionDetail(param) {

		try {
			if (!param) { throw {}; }
			param = reverse(sortBy(param, ['value']));
			const modalRef = this.modal.open(MainModalComponent, { animation: false });
			modalRef.componentInstance.modalData = {
				key_values: param.map(el => ({ key: el.key, value: el.value + ' times' }))
			};
		} catch (error) {

		}
	}

	onSelectTypology(e) {
		this.tableCtrl.willRefreshTable.next('DATA');
	}
	onSelectCountry(e) {
		sessionStorage.setItem('selectedCountries', JSON.stringify(this.selectedCountries));
		this.tableCtrl.willRefreshTable.next('DATA');
	}

	onDateRangeChanged(event) {
		this.periodStart = new Date(event[0]);
		this.periodEnd = moment(event[1]).endOf('day').toDate();
		this.tableCtrl.willRefreshTable.next('DATA');
	}
	onDateChanged(event) {
		this.periodStart = new Date(event);
		this.onChangePeriodType({});
		if (this.periodType == 'year') {
			this.periodEnd = moment(this.periodStart).endOf('year').toDate();
		} else if (this.periodType == 'month') {
			this.periodEnd = moment(this.periodStart).endOf('month').toDate();
		}
		this.tableCtrl.willRefreshTable.next('DATA');
	}
	onStartDateChanged(event) {
		this.periodStart = new Date(event.value);
	}
	onEndDateChanged(event) {
		this.periodEnd = moment(event.value).endOf('day').toDate();
		const start = moment(this.periodStart);
		const end = moment(this.periodEnd);
		if (!end.isAfter(start)) { throw {}; }
		this.tableCtrl.willRefreshTable.next('DATA');
	}
	onClickNextPeriod(isNext = true) {
		if (this.periodType == 'year') {
			const year = new Date(this.periodStart).getFullYear();
			if (isNext) {
				this.periodStart = new Date(year + 1, 0, 1);
				this.periodEnd = moment(this.periodStart).endOf('year').toDate();
			} else {
				this.periodStart = new Date(year - 1, 0, 1);
				this.periodEnd = moment(this.periodStart).endOf('year').toDate();
			}

		} else if (this.periodType == 'month') {
			const dt = new Date(this.periodStart);
			if (isNext) {
				this.periodStart = new Date(this.periodStart.setMonth(dt.getMonth() + 1));
				this.periodEnd = moment(this.periodStart).endOf('month').toDate();
			} else {
				this.periodStart = new Date(this.periodStart.setMonth(dt.getMonth() - 1));
				this.periodEnd = moment(this.periodStart).endOf('month').toDate();
			}
		} else if (this.periodType == 'day') {
			const dt = new Date(this.periodStart);
			if (isNext) {
				this.periodStart.setDate(dt.getDate() + 1);
			} else {
				this.periodStart.setDate(dt.getDate() - 1);
			}
		}
		this.tableCtrl.willRefreshTable.next('DATA');
	}
	onChangePeriodType(event) {
		if (this.periodType == 'year') {
			this.periodStart.setMonth(0);
			this.periodEnd = this.periodEnd = moment(this.periodStart).endOf('year').toDate();
		} else if (this.periodType == 'month') {
			this.periodEnd = this.periodEnd = moment(this.periodStart).endOf('month').toDate();
		}
		this.tableCtrl.willRefreshTable.next('DATA');
	}
	async onClickEditComment(param) {
		const modalRef = this.modal.open(AddCommentDialog, { animation: false });
		const comments = param.comments || [];
		if (comments.find(el => el.user == this.user._id)) {
			modalRef.componentInstance.comment = comments.find(el => el.user == this.user._id).content;
		}
		const subscr = modalRef.closed.subscribe(async e => {
			if (e) {
				const comments = param.comments || [];
				if (comments.find(el => el.user == this.user._id)) {
					comments.find(el => el.user == this.user._id).content = e;
				} else {
					comments.push({
						user: this.user._id,
						content: e
					});
				}
				await this.userService.update({ _id: param._id, comments });
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
