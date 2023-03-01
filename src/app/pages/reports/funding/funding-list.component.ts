// Angular
import { Component, OnInit, ViewChild, ChangeDetectionStrategy, OnDestroy, ViewRef, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription, BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { cloneDeep, union, each, concat, find, findLast, unionBy, sortedUniq, intersection, unionWith, intersectionWith, sortBy } from 'lodash';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { saveAs } from 'file-saver';
import { Location } from '@angular/common';
import { LpTableComponent } from '../../common/lp-table/lp-table.component';
import { SourceService } from '../../common/source.service';
import { AliasService } from '../../common/alias.service';
import { AuthService } from 'src/app/modules/auth';
import { CampaignService } from '../../common/campaign.service';
import { KTUtil } from 'src/app/_metronic/kt';
import { QueryResultsModel } from '../../common/models/query-results.model';
import { DailyDetailDialog } from '../../admin/common/daily-detail/daily-detail.dialog';
import { DatePickerDialog } from '../../dialogs/date-picker/date-picker.dialog';
import { switchMap } from 'rxjs/operators';
import { ToastService } from '../../common/toast.service';
import { tag2category } from '../../common/common';
import { MainModalComponent } from 'src/app/_metronic/partials/layout/modals/main-modal/main-modal.component';
import { SplashScreenService } from 'src/app/_metronic/partials';


@Component({
	selector: 'app-reports-funding-list',
	templateUrl: './funding-list.component.html',
	styleUrls: ['./funding-list.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class FundingReportsListComponent implements OnInit, OnDestroy {

	locale = 'it-IT';

	loadingSubject = new BehaviorSubject<boolean>(true);
	loading$: Observable<boolean>;

	columnDefs: any[] = [];
	isEmptyTable = false;
	keptPage = -1;

	periodType = 'month';
	periodStart: Date = new Date((new Date()).getFullYear(), (new Date()).getMonth(), 1);
	periodEnd: Date = new Date((new Date()).getFullYear() + 1, (new Date()).getMonth() + 1, 0);
	periodRange: Date[] = [new Date((new Date()).getFullYear(), (new Date()).getMonth(), 1),
	new Date((new Date()).getFullYear() + 1, (new Date()).getMonth() + 1, 0)];

	totalReport: any = {};

	itRegions = [
		{key: 'g_1', title: 'SUD', regions: [
			{name: 'MOLISE', key: 'Molise', selected: false},
			{name: 'BASILICATA', key: 'Basillilcata', selected: false},
			{name: 'ABRUZZO', key: 'Abruzzo', selected: false},
			{name: 'SARDEGNA', key: 'Sardegna', selected: false},
			{name: 'CAMPANIA', key: 'Campania', selected: false},
			{name: 'CALABRIA', key: 'Calabria', selected: false},
			{name: 'PUGLIA ', key: 'Puglia', selected: false},
			{name: 'SICILIA ', key: 'Sicilia', selected: false}
		], selected: false},
		{key: 'g_2', title: 'CENTRO', regions: [
			{name: 'LAZIO', key: 'Lazio', selected: false},
			{name: 'MARCHE', key: 'Marche', selected: false},
			{name: 'TOSCANA', key: 'Toscana', selected: false},
			{name: 'UMBRIA', key: 'Umbria', selected: false}
		], selected: false},
		{key: 'g_3', title: 'NORD OVEST', regions: [
			{name: 'PIEMONTE ', key: 'Piemonte', selected: false},
			{name: "VALLE D'AOSTA", key: "Valle D'aosta", selected: false},
			{name: 'LIGURIA', key: 'Liguria', selected: false},
			{name: 'LOMBARDIA ', key: 'Lombardia', selected: false}
		], selected: false},
		{key: 'g_4', title: 'NORD EST', regions: [
			{name: 'TRENTINO-ALTO ADIGE', key: 'Trentino-Alto Adige', selected: false},
			{name: 'FRIULI-VENEZIA GIULIA', key: 'Friuli-Venezia Giulia', selected: false},
			{name: 'EMILIA-ROMAGNA', key: 'Emilia-Romagna', selected: false},
			{name: 'VENETO', key: 'Veneto', selected: false}
		], selected: false}
	];

	frRegions = [
		{key: 'fg_1', title: 'SUD-OUEST', regions: [
			{name: 'NOUVELLE-AQUITAINE', key: 'Nouvelle-Aquitaine', selected: false},
			{name: 'OCCITANIE', key: 'Occitanie', selected: false}
		], selected: false},
		{key: 'fg_2', title: 'SUD-EST', regions: [
			{name: 'AUVERGNE-RHONE-ALPES', key: 'Auvergne-Rhône-Alpes', selected: false},
			{name: "PROVENCE-ALPES-COTE D'AZUR", key: "Provence-Alpes-Côte d'Azur", selected: false},
			{name: 'CORSE', key: 'Corse', selected: false}
		], selected: false},
		{key: 'fg_3', title: 'NORD', regions: [
			{name: 'HAUTS DE FRANCE', key: 'Hauts de France', selected: false}
		], selected: false},
		{key: 'fg_4', title: 'NORD-OUEST', regions: [
			{name: 'BRETAGNE', key: 'Bretagne', selected: false},
			{name: 'PAYS DE LA LOIRE', key: 'Pays de la Loire', selected: false},
			{name: 'CENTRE VAL DE LOIRE', key: 'Centre Val de Loire', selected: false},
			{name: 'NORMANDIE', key: 'Normandie', selected: false}
		], selected: false},
		{key: 'fg_5', title: 'NORD-EST', regions: [
			{name: 'BOURGOGNE-FRANCHE COMTE', key: 'Bourgogne-Franche Comte', selected: false},
			{name: 'GRAND EST', key: 'Grand EST', selected: false}
		], selected: false},
		{key: 'fg_6', title: 'ILE DE FRANCE', regions: [
			{name: 'ILE DE FRANCE', key: 'Île-de-France', selected: false}
		], selected: false}
	];

	availableRegions = [];
	selectedGroups = [];
	showGroup = false;
	withFirstCategory = false;

	activePayload;

	tabs: any[] = [
		{
			title: 'Campaign',
			state: 'campaign'
		},
		{
			title: 'Source',
			state: 'source'
		},
		{
			title: 'Category',
			state: 'category'
		},
		{
			title: 'Rocation',
			state: 'region'
		}
	];

	activeTab;

	_typologies: any[] = [
		{ label: 'company equity', value: 'company equity' },
		{ label: 'company lending', value: 'company lending' },
		{ label: 'real estate equity', value: 'real estate equity' },
		{ label: 'real estate lending', value: 'real estate lending' },
		{ label: 'minibond', value: 'minibond' }
	];
	_countries: any[] = [];
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

	type = 'campaign';
	categories = [];
	user;

	@ViewChild('tableCtrl', { static: true }) tableCtrl: LpTableComponent;
	@ViewChild('yearPicker', { static: true }) yearPicker;
	@ViewChild('monthPicker', { static: true }) monthPicker;

	crowdfundingPermission: any = {
		enabled: false,
		typology: []
	};


	typologies = [];
	countries = [];

	page = {
		campaign: {
			permission: 'funding',
			downloadable: false
		},
		source: {
			permission: 'funding',
			downloadable: false
		},
		category: {
			permission: 'funding',
			downloadable: false
		},
		region: {
			permission: 'funding',
			downloadable: false
		}
	};

	filterSources = [];
	filterCountries = [];
	started = false;

	private unsubscribe: Subscription[] = [];

	constructor(
		private activatedRoute: ActivatedRoute,
		private cdr: ChangeDetectorRef,
		private translate: TranslateService,
		private sourceService: SourceService,
		private aliasService: AliasService,
		private modal: NgbModal,
		private location: Location,
		private auth: AuthService,
		private router: Router,
		private toastService: ToastService,
		private campaignService: CampaignService,
		private splashScreenService: SplashScreenService
	) {

	}

	ngOnInit() {
		this.user = this.auth.currentUserValue;
		// this._countries = this.user.countries.map(el => ({
		// 	key: el,
		// 	title: el.charAt(0).toUpperCase() + el.slice(1)
		// }));

		this._countries = [
      {key: 'italy', title: 'Italy'},
      {key: 'spain', title: 'Spain'},
      {key: 'france', title: 'France'}
    ]

		this.selectedCountries = sessionStorage.getItem('selectedCountries') ? JSON.parse(sessionStorage.getItem('selectedCountries')) : [];

		this.unsubscribe.push(
			this.activatedRoute.paramMap.pipe(
				switchMap(async params => {
					const type = params.get('type');
					if (['campaign', 'source', 'category', 'region'].includes(type)) {
						this.type = type;
						this.init();
					} else {
						this.router.navigate(['/report/funding/campaign']);
					}
				})
			).subscribe(() => { })
		);

		this.loadingSubject = this.splashScreenService.loadingSubject;
		this.loading$ = this.loadingSubject.asObservable();
		this.unsubscribe.push(this.translate.onLangChange.subscribe(lang => {
			this.updateByTranslate(lang.lang);
		}));
		this.updateByTranslate(this.translate.currentLang);

		this.activePayload = {
			filterModel: {
				typology: {
					filterType: 'set',
					values: this.typologies.map(el => el.value)
				},
				'source.configs.involvedCampaignCountries': {
					filterType: 'set',
					values: this.selectedCountries.map(el => el.key)
				},
				deleted: {
					filterType: 'ne',
					value: true
				}
			}
		}
	}

	async init() {
		let pr = this.auth.hasPermission(this.page[this.type].permission, 'readable');
		if (!pr.allowed) {
			this.toastService.show('You dont have permision for this page');
			this.router.navigateByUrl('/');
			return;
		}
		this.typologies = this._typologies.filter(el => pr.typologies.includes(el.value));
		this.countries = this._countries.filter(el => pr.countries.includes(el.key));
		pr = this.auth.hasPermission(this.page[this.type].permission, 'downloadable');
		this.page[this.type].downloadable = pr.allowed;

		if (this.selectedCountries.length) {
			this.selectedCountries = intersectionWith(this.selectedCountries, this.countries, (a, b) => a.key == b.key);
		} else {
			this.selectedCountries = [this.countries.find(el => el.key == 'italy') || this.countries[0]];
		}

		var isItaly = this.selectedCountries.findIndex(el => el.key == 'italy') > -1;
		var isFrance = this.selectedCountries.findIndex(el => el.key == 'france') > -1;
		if (isItaly || isFrance) {
			this.showGroup = true;
			if (isItaly) {
				this.itRegions.forEach(ell => {
					this.availableRegions.push(ell);
				});
			}
			if (isFrance) {
				this.frRegions.forEach(ell => {
					this.availableRegions.push(ell);
				});
			}
		} else {
			this.showGroup = false;
		}

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		};

		this.activePayload = {
			filterModel: {
				typology: {
					filterType: 'set',
					values: this.typologies.map(el => el.value)
				},
				'source.configs.involvedCampaignCountries': {
					filterType: 'set',
					values: this.selectedCountries.map(el => el.key)
				},
				deleted: {
					filterType: 'ne',
					value: true
				}
			}
		}

		await this.loadRegions();

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

	async loadRegions() {
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
			// this.availableRegions = (await this.campaignService.getRegions(this.activePayload, {
			// 	startTime,
			// 	endTime
			// })).map(el => el._id.region).filter(ele => ele !== null);
			// console.log('regions == ', this.availableRegions);
		} catch (error) {

		}
	}

	async loadCategories() {

		try {
			const payload = {
				filterModel: {
					type: {
						filterType: 'text',
						filter: 'campaign.tag'
					},
					confirmed: {
						filterType: 'eq',
						value: true
					},
					ignore: {
						filterType: 'ne',
						value: true
					}
				},
				startRow: 0,
				endRow: 0,
				pageSize: 100,
				totalCount: 0,
				result: []
			};
			const res = await this.aliasService.get(payload, { self: 'names' });
			if (res) {
				this.categories = res.items;
			}
		} catch (error) {

		}
	}

	async defineColumns() {
		let statusFilters = [];
		if (sessionStorage.getItem('statusfilter')) {
			statusFilters = JSON.parse(sessionStorage.getItem('statusfilter'));
		}

		let typologyFilters = [];
		if (sessionStorage.getItem('typologyfilter')) {
			typologyFilters = JSON.parse(sessionStorage.getItem('typologyfilter'));
		}

		const isMobile = KTUtil.isMobileDevice();
		this.tableCtrl.selectionPreviewColumns = [{ field: 'name' }];
		let columnDefs = [];
		this.columnDefs = columnDefs;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}

		if (this.categories.length == 0) {
			await this.loadCategories();
		}

		this.typologies.forEach(ele => {
			ele['kind'] = 'typology';
			ele['selected'] = typologyFilters.length ? (typologyFilters.find(el => el.value == ele.value)?.selected ? true : false) : false
		});

		try {
			if (this.type == 'campaign') {

				columnDefs = [
					{
						headerName: this.translate.instant('Name'), filter: 'agTextColumnFilter', field: 'name', pinned: isMobile ? null : 'left', editable: false, maxWidth: 400,
						cellRenderer: param => {
							if (param.data && param.data.name) {
								return param.data.name;
							}
						}
					},
					{
						headerName: this.translate.instant('Source'), filter: 'agTextColumnFilter', field: 'source', editable: false, minWidth: 100,
						cellRenderer: param => {
							if (param.data && param.data.source) {
								return param.data.source.name;
							}
						},
						floatingFilterComponent: 'dropdownFloatingFilter',
						suppressMenu: true,
						floatingFilterComponentParams: {
							suppressFilterButton: true,
							options: this.filterSources
						}
					},
					{
						headerName: this.translate.instant('Increased money'), field: 'raisedIncreased', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.raisedIncreased != null) {
								const contentHtml = `<span
								class="badge badge-light-primary rounded-0 text-uppercase">${param.data.raisedIncreased + ' €'}</span>`;
								const actionBtnHtml = `<span id="theAction" class="action ml-2"><i class='la la-eye'></i></span>`;
								setTimeout(() => {
									const actionButton = param.eGridCell.querySelector('#theAction');
									if (actionButton) {
										actionButton.addEventListener('click', () => {
											this.onShowDailyDetail(param.data);
										});
									}
								}, 100);

								return contentHtml + (actionBtnHtml || '');

							}
						}
					},
					{
						headerName: this.translate.instant('Increased investors'), field: 'investorCountIncreased', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.investorCountIncreased != null) {

								const contentHtml = `<span
								class="badge badge-light-primary rounded-0 text-uppercase">${param.data.investorCountIncreased}</span>`;
								const actionBtnHtml = `<span id="theAction" class="action ml-2"><i class='la la-eye'></i></span>`;
								setTimeout(() => {
									const actionButton = param.eGridCell.querySelector('#theAction');
									if (actionButton) {
										actionButton.addEventListener('click', () => {
											this.onShowDailyDetail(param.data);
										});
									}
								}, 100);

								return contentHtml + (actionBtnHtml || '');
							}
						}
					},
					{
						headerName: this.translate.instant('Typology'), field: 'typology', filter: 'agTextColumnFilter', editable: false, sortable: false,
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
						floatingFilterComponent: 'dropdownFloatingFilter',
						suppressMenu: true,
						floatingFilterComponentParams: {
							suppressFilterButton: true,
							options: this.typologies
						},
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
						},
						floatingFilterComponent: 'dropdownFloatingFilter',
						suppressMenu: true,
						floatingFilterComponentParams: {
							suppressFilterButton: true,
							options: [{
								kind: 'status',
								label: 'ongoing',
								value: '1_ongoing',
								selected: (statusFilters.length && statusFilters.find(el => el.value == '1_ongoing')?.selected) ? true: false
							},
							{
								kind: 'status',
								label: 'comingsoon',
								value: '2_comingsoon',
								selected: (statusFilters.length && statusFilters.find(el => el.value == '2_comingsoon')?.selected) ? true: false
							},
							{
								kind: 'status',
								label: 'closed funded',
								value: '3_funded',
								selected: (statusFilters.length && statusFilters.find(el => el.value == '3_funded')?.selected) ? true: false
							},
							{
								kind: 'status',
								label: 'close not funded',
								value: '4_closed',
								selected: (statusFilters.length && statusFilters.find(el => el.value == '4_closed')?.selected) ? true: false
							},
							{
								kind: 'status',
								label: 'closing',
								value: '5_extra',
								selected: (statusFilters.length && statusFilters.find(el => el.value == '5_extra')?.selected) ? true: false
							},
							{
								kind: 'status',
								label: 'refunded',
								value: '6_refunded',
								selected: (statusFilters.length && statusFilters.find(el => el.value == '6_refunded')?.selected) ? true: false
							},
							]
						},
					},
					{
						headerName: this.translate.instant('Money Raised'), filter: false, field: 'raised', editable: false,
						cellRenderer: param => {
							if (param.data && param.data.raised != null) {
								const contentHtml = `<span>${param.data.raised + ' €'}</span>`;
								return contentHtml;
							}
						}
					},
					{
						headerName: this.translate.instant('Number of Investors'), field: 'investorCount', editable: false,
						cellRenderer: param => {
							if (param.data && param.data.investorCount != null) {
								const contentHtml = `<span>${this.addCommas(param.data.investorCount)}</span>`;
								return contentHtml;
							}
						}
					},
					{
						headerName: this.translate.instant('MinAmount'), filter: 'agTextColumnFilter', field: 'minimumGoal', editable: false,
						cellRenderer: param => {
							if (param.data && param.data.minimumGoal) {
								return this.addCommas(param.data.minimumGoal) + ' €';
							}
						}
					},
					{
						headerName: this.translate.instant('MaxAmount'), filter: 'agTextColumnFilter', field: 'maximumGoal', editable: false,
						cellRenderer: param => {
							if (param.data && param.data.maximumGoal != null) {
								return this.addCommas(param.data.maximumGoal) + ' €';
							}
						}
					},
					{ headerName: this.translate.instant('City'), filter: 'agTextColumnFilter', field: 'fullCity', editable: false },
					{ headerName: this.translate.instant('Province'), filter: 'agTextColumnFilter', field: 'province', editable: false },
					{
						headerName: this.translate.instant('Region'), filter: 'agTextColumnFilter', field: 'region', editable: false,
						// floatingFilterComponent: 'dropdownFloatingFilter',
						// suppressMenu: true,
						// floatingFilterComponentParams: {
						// 	suppressFilterButton: true,
						// 	options: (this.availableRegions || []).map(el => {
						// 		return {
						// 			label: el,
						// 			value: el
						// 		}
						// 	})
						// },
					},
					{ headerName: this.translate.instant('Country') ,field: 'country', filter: 'agTextColumnFilter', editable: false,
						floatingFilterComponent: 'dropdownFloatingFilter',
						suppressMenu: true,
						floatingFilterComponentParams: {
							suppressFilterButton: true,
							options: this.filterCountries
						},
					},
					{
						headerName: this.translate.instant('Company Type'), filter: 'agTextColumnFilter', field: 'company', editable: false, minWidth: 150,
						cellRenderer: (param) => {
							try {
								return param.data.company.type.names[0].value;
							} catch (error) {

							}
						}
					},
					{
						headerName: this.translate.instant('Comingsoon start'), filter: 'agDateColumnFilter', field: 'comingSoonPeriod.startDate', editable: false,
						cellRenderer: param => {
							if (param.data && param.data.comingSoonPeriod && param.data.comingSoonPeriod.startDate) {
								return this.getDateTimeFromDate(param.data.comingSoonPeriod.startDate);
							}
						}
					},
					{
						headerName: this.translate.instant('Comingsoon end'), filter: 'agDateColumnFilter', field: 'comingSoonPeriod.endDate', editable: false,
						cellRenderer: param => {
							if (param.data && param.data.comingSoonPeriod && param.data.comingSoonPeriod.endDate) {
								return this.getDateTimeFromDate(param.data.comingSoonPeriod.endDate);
							}
						},
					},
					{
						headerName: this.translate.instant('Start date'), filter: 'agDateColumnFilter', field: 'startDate', editable: false,
						cellRenderer: param => {
							if (param.data) {
								if (!param.data.startDate) {
									setTimeout(() => {
										const theButton = param.eGridCell.querySelector('#theEditButton');
										if (theButton) {
											theButton.addEventListener('click', () => {
												this.onEdit(param.data._id, 'startDate');
											});
										}
									}, 100);
									return `<span id="theEditButton" class="action" ><i class='la la-pen'></i></span>`;
								} else {
									return `<span>
									${this.getDateTimeFromDate(param.data.startDate)}</span>`;

								}
							}
						}
					},
					{
						headerName: this.translate.instant('End date'), filter: 'agDateColumnFilter', field: 'endDate', editable: false,
						cellRenderer: param => {
							if (param.data) {
								if (!param.data.endDate) {
									setTimeout(() => {
										const theButton = param.eGridCell.querySelector('#theEditButton');
										if (theButton) {
											theButton.addEventListener('click', () => {
												this.onEdit(param.data._id, 'endDate');
											});
										}
									}, 100);
									return `<span id="theEditButton" class="action" ><i class='la la-pen'></i></span>`;
								} else {
									setTimeout(() => {
										const theButton = param.eGridCell.querySelector('#showAction');
										if (theButton) {
											theButton.addEventListener('click', () => {
												this.onClickEndDateOverview(param.data);
											});
										}
									}, 100);
									const actionBtnHtml = `<span id="showAction" class="action ml-2"><i class='la la-eye'></i></span>`;
									return `<span>
									${this.getDateTimeFromDate(param.data.endDate)}</span>` +
										(param.data.previousEndDates && param.data.previousEndDates.length ? actionBtnHtml : '');
								}
							}
						}
					},
					{
						headerName: this.translate.instant('Tags'), filter: 'agTextColumnFilter', field: 'tags', editable: false, minWidth: 200,
						cellRenderer: param => {
							if (param.data) {
								const campaignTags = [];
								const companyTags = param.data.company ? param.data.company.tags.map(el => ({
									_id: el._id,
									name: tag2category(el),
									company: true,
									confirmed: el.confirmed
								})) : [];
								const tags = unionBy(companyTags, campaignTags, '_id');
								const tagsHtml = tags.filter(el => el.company && el.confirmed).map((el, index) =>
									`<span class="badge rounded-0 badge-light-primary">${el.name}
								</span>`).join(' ') + tags.filter(el => !el.company && el.confirmed).map((el, index) =>
										`<span class="badge">${el.name}
								</span>`).join(' ');

								return tagsHtml;
							}
						},
						floatingFilterComponent: 'dropdownFloatingFilter',
						suppressMenu: true,
						floatingFilterComponentParams: {
							suppressFilterButton: true,
							options: [{
								label: 'Select All',
								value: 'sall'
							}].concat(this.categories.map(category => {
								return {
									label: tag2category(category),
									value: category._id
								}
							}))
						},
					},
					{
						headerName: this.translate.instant('Holding time'), field: 'holdingTime', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.holdingTime) {
								return param.data.holdingTime + 'mesi';
							}
						}
					},
					{
						headerName: this.translate.instant('Annual ROI'), field: 'roiAnnual', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.roiAnnual) {
								return this.addCommas(param.data.roiAnnual) + ' %';
							}
						}
					},
					{
						headerName: this.translate.instant('Pre money evaluation'), field: 'preMoneyEvaluation', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.preMoneyEvaluation) {
								return param.data.preMoneyEvaluation + ' €';
							}
						}
					},
					{
						headerName: this.translate.instant('Minimum investment'), field: 'minimumInvestment', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.minimumInvestment) {
								return param.data.minimumInvestment + ' €';
							}
						}
					},
					{
						headerName: this.translate.instant('Pre commitment user'), editable: false, field: 'preCommitmentUser',
						cellRenderer: (param) => {
							if (param.data && param.data.investorCountDaily && param.data.investorCountDaily.length && param.data.investorCountDaily[0].value) {
								return param.data.preCommitmentUser;
							}
						}
					},
					{
						headerName: this.translate.instant('Pre commitment money'), editable: false, field: 'preCommitmentMoney',
						cellRenderer: (param) => {
							if (param.data && param.data.raisedDaily && param.data.raisedDaily.length && param.data.raisedDaily[0].value) {
								return param.data.preCommitmentMoney + ' €';
							}
						},
						cellClass: isMobile ? 'custom-cell' : 'last-column-cell custom-cell'
					},
					{
						headerName: this.translate.instant('Description'), filter: 'agTextColumnFilter', field: 'description', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.description) {
								const detailButtonHtml = `<span id="theDescription" class="action"><i class='la la-eye'></i></span>`;
								const descriptionHtml = `<span>
									${param.data.description? (param.data.description.substr(0,30) + (param.data.description.length > 30 ? '...': '')): ''}</span>`;
		
								setTimeout( () => {
									const detailButton = param.eGridCell.querySelector('#theDescription');
									if (detailButton) {
										detailButton.addEventListener('click', () => {
											const modalRef = this.modal.open(MainModalComponent, { animation: false});
											modalRef.componentInstance.modalData = {
												description: param.data.description
											};
										});
									}
								}, 100);
		
								return descriptionHtml + detailButtonHtml;
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
			} else if (this.type == 'region') {
				columnDefs = [
					{
						headerName: this.translate.instant('Address'), filter: 'agTextColumnFilter', field: 'region', pinned: isMobile ? null : 'left', editable: false, minWidth: 200,
						cellRenderer: (param) => {
							if (param.data && param.data.region != null) {
								return param.data.region;
							} else if (param.data && param.data.region == null) {
								return `<span
										class="badge badge-secondary rounded-0 text-uppercase">No region</span>`;
							}
						}
					},
					{
						headerName: this.translate.instant('Increased money'), field: 'raisedIncreased', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.raisedIncreased != null) {
								const contentHtml = `<span class="badge badge-light-primary rounded-0 text-uppercase">${param.data.raisedIncreased + ' €'}</span>`;
								return contentHtml;

								// const actionBtnHtml = `<span id="theAction" class="action ml-2"><i class='la la-eye'></i></span>`;
								// setTimeout(() => {
								// 	const actionButton = param.eGridCell.querySelector('#theAction');
								// 	if (actionButton) {
								// 		actionButton.addEventListener('click', () => {
								// 			this.onShowDailyDetail(param.data);
								// 		});
								// 	}
								// }, 100);

								// return contentHtml + (actionBtnHtml || '');
							}
						}
					},
					{
						headerName: this.translate.instant('Increased investors'), field: 'investorCountIncreased', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.investorCountIncreased != null) {
								const contentHtml = `<span
									class="badge badge-light-primary rounded-0 text-uppercase">${param.data.investorCountIncreased}</span>`;
								return contentHtml;

								// const actionBtnHtml = `<span id="theAction" class="action ml-2"><i class='la la-eye'></i></span>`;
								// setTimeout(() => {
								// 	const actionButton = param.eGridCell.querySelector('#theAction');
								// 	if (actionButton) {
								// 		actionButton.addEventListener('click', () => {
								// 			this.onShowDailyDetail(param.data);
								// 		});
								// 	}
								// }, 100);

								// return contentHtml + (actionBtnHtml || '');
							}
						},
					},
					{
						headerName: this.translate.instant('Involves Campaign Typologies'), filter: 'agTextColumnFilter', field: 'involvedCampaignTypologies', editable: false, sortable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.involvedCampaignTypologies) {
								return param.data.involvedCampaignTypologies.map(typology => {
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
							options: this.typologies
						}
					},
					{
						headerName: this.translate.instant('Campaigns'), field: 'involvedCampaigns', editable: false, minWidth: 100,
						cellClass: isMobile ? 'custom-cell' : 'last-column-cell custom-cell',
						cellRenderer: (param) => {
							if (param.data && param.data.involvedCampaigns != null) {
								const contentHtml = `<span class="badge badge-light-primary rounded-0 text-uppercase">${param.data.involvedCampaigns}</span>`;
								const actionBtnHtml = `<span id="theAction" class="action ml-2"><i class='la la-eye'></i></span>`;
								setTimeout(() => {
									const actionButton = param.eGridCell.querySelector('#theAction');
									if (actionButton) {
										actionButton.addEventListener('click', () => {
											this.onShowDailyDetail(param.data);
										});
									}
								}, 100);

								return contentHtml + (actionBtnHtml || '');
							}
						},
					},
				];
			} else if (this.type == 'source') {

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
						headerName: this.translate.instant('Increased money'), field: 'raisedIncreased', editable: false, pinned: isMobile ? null : 'left',
						cellRenderer: (param) => {
							if (param.data && param.data.raisedIncreased != null) {
								if (param.data.raisedIncreased == 0) { return; }
								return `<span
										class="badge badge-light-primary rounded-0 text-uppercase">${param.data.raisedIncreased + ' €'}</span>`;
							}
						}
					},
					{
						headerName: this.translate.instant('Increased investors'), field: 'investorCountIncreased', editable: false, pinned: isMobile ? null : 'left',
						cellRenderer: (param) => {
							if (param.data && param.data.investorCountIncreased != null) {
								return `<span
										class="badge badge-light-primary rounded-0 text-uppercase">${param.data.investorCountIncreased}</span>`;
							}
						}
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
							options: this.typologies
						}
					},
					{ headerName: this.translate.instant('Campaigns'), field: 'involvedCampaigns', editable: false, minWidth: 100 },
					{
						headerName: this.translate.instant('Pre money evaluation (MIN)'), field: 'preMoneyEvaluationMin', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.preMoneyEvaluationMin) {
								return param.data.preMoneyEvaluationMin + ' €';
							}
						}
					},
					{
						headerName: this.translate.instant('Pre money evaluation (MAX)'), field: 'preMoneyEvaluationMax', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.preMoneyEvaluationMax) {
								return param.data.preMoneyEvaluationMax + ' €';
							}
						}
					},
					{
						headerName: this.translate.instant('Pre money evaluation (AVG)'), field: 'preMoneyEvaluationAvg', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.preMoneyEvaluationAvg) {
								return param.data.preMoneyEvaluationAvg + ' €';
							}
						}
					},
					{
						headerName: this.translate.instant('Minimum investment (MIN)'), field: 'minimumInvestmentMin', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.minimumInvestmentMin) {
								return param.data.minimumInvestmentMin + ' €';
							}
						}
					},
					{
						headerName: this.translate.instant('Minimum investment (MAX)'), field: 'minimumInvestmentMax', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.minimumInvestmentMax) {
								return param.data.minimumInvestmentMax + ' €';
							}
						}
					},
					{
						headerName: this.translate.instant('Minimum investment (AVG)'), field: 'minimumInvestmentAvg', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.minimumInvestmentAvg) {
								return param.data.minimumInvestmentAvg + ' €';
							}
						}
					},
					// pre commitment user
					{
						headerName: this.translate.instant('Pre commitment user (MIN)'), field: 'preCommitmentUserMin', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.preCommitmentUserMin) {
								return param.data.preCommitmentUserMin;
							}
						}
					},
					{
						headerName: this.translate.instant('Pre commitment user (MAX)'), field: 'preCommitmentUserMax', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.preCommitmentUserMax) {
								return param.data.preCommitmentUserMax;
							}
						}
					},
					{
						headerName: this.translate.instant('Pre commitment user (AVG)'), field: 'preCommitmentUserAvg', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.preCommitmentUserAvg) {
								return param.data.preCommitmentUserAvg;
							}
						}
					},
					// pre commitment money
					{
						headerName: this.translate.instant('Pre commitment money (MIN)'), field: 'preCommitmentMoneyMin', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.preCommitmentMoneyMin) {
								return param.data.preCommitmentMoneyMin + ' €';
							}
						}
					},
					{
						headerName: this.translate.instant('Pre commitment money (MAX)'), field: 'preCommitmentMoneyMax', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.preCommitmentMoneyMax) {
								return param.data.preCommitmentMoneyMax + ' €';
							}
						}
					},
					{
						headerName: this.translate.instant('Pre commitment money (AVG)'), field: 'preCommitmentMoneyAvg', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.preCommitmentMoneyAvg) {
								return param.data.preCommitmentMoneyAvg + ' €';
							}
						}
					},
					// duration
					{
						headerName: this.translate.instant('Duration (MIN)'), field: 'durationMin', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.durationMin) {
								return param.data.durationMin + ' days';
							}
						}
					},
					{
						headerName: this.translate.instant('Duration (MAX)'), field: 'durationMax', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.durationMax) {
								return param.data.durationMax + ' days';
							}
						}
					},
					{
						headerName: this.translate.instant('Duration (AVG)'), field: 'durationAvg', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.durationAvg) {
								return param.data.durationAvg + ' days';
							}
						}
					},
					// coming soon duration
					{
						headerName: this.translate.instant('Comingsoon Duration (MIN)'), field: 'comingSoonDurationMin', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.comingSoonDurationMin) {
								return param.data.comingSoonDurationMin + ' days';
							}
						}
					},
					{
						headerName: this.translate.instant('Comingsoon Duration (MAX)'), field: 'comingSoonDurationMax', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.comingSoonDurationMax) {
								return param.data.comingSoonDurationMax + ' days';
							}
						}
					},
					{
						headerName: this.translate.instant('Comingsoon Duration (AVG)'), field: 'comingSoonDurationAvg', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.comingSoonDurationAvg) {
								return param.data.comingSoonDurationAvg + ' days';
							}
						}
					},
					// minimum goal
					{
						headerName: this.translate.instant('Minimum goal (MIN)'), field: 'minimumGoalMin', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.minimumGoalMin) {
								return param.data.minimumGoalMin + ' €';
							}
						}
					},
					{
						headerName: this.translate.instant('Minimum goal (MAX)'), field: 'minimumGoalMax', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.minimumGoalMax) {
								return param.data.minimumGoalMax + ' €';
							}
						}
					},
					{
						headerName: this.translate.instant('Minimum goal (AVG)'), field: 'minimumGoalAvg', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.minimumGoalAvg) {
								return param.data.minimumGoalAvg + ' €';
							}
						}
					},
					// maximumGoal goal
					{
						headerName: this.translate.instant('Maximum goal (MIN)'), field: 'maximumGoalMin', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.maximumGoalMin) {
								return param.data.maximumGoalMin + ' €';
							}
						}
					},
					{
						headerName: this.translate.instant('Maximum goal (MAX)'), field: 'maximumGoalMax', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.maximumGoalMax) {
								return param.data.maximumGoalMax + ' €';
							}
						}
					},
					{
						headerName: this.translate.instant('Maximum goal (AVG)'), field: 'maximumGoalAvg', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.maximumGoalAvg) {
								return param.data.maximumGoalAvg + ' €';
							}
						}
					}
				];


				this.categories.forEach(category => {
					const name = tag2category(category);
					if (name != '') {
						columnDefs.push(
							{
								headerName: this.translate.instant(tag2category(category)), field: `category_${category._id}`, editable: false,
								cellRenderer: (param) => (param.data[`category_${category._id}`] || 0) + ' €'
							}
						);
					}
				});

				if (this.page[this.type].downloadable) {
					columnDefs = columnDefs.concat([
						{
							action: 'XLS', width: 42, fixed: true, pinned: isMobile ? null : 'right', editable: false, sortable: false,
							cellRenderer: param => {
								if (param.data) {
									return `<i class="la la-file-csv"></i>`;
								}
							},
							cellClass: isMobile ? 'last-column-cell custom-cell' : 'custom-cell'
						},
						{
							action: 'ENTER_IN', width: 42, fixed: true, pinned: isMobile ? null : 'right', editable: false, sortable: false,
							cellRenderer: param => {
								if (param.data && param.data.link) {
									return `<a target="_blank" href="${param.data.link[0]}"><i class="fa fa-link" style="color: blue"></i></a>`;
								}
							}
						},
					]);
				}
			} else if (this.type == 'category') {
				columnDefs = [
					{
						headerName: this.translate.instant('Name'), filter: 'agTextColumnFilter', field: 'name', pinned: isMobile ? null : 'left', editable: false, minWidth: 200,
						cellRenderer: (param) => {
							if (param.data) {
								if (param.data._id) {
									return param.data.names[0].value;
								} else {
									return `<span
										class="badge badge-secondary rounded-0 text-uppercase">No categories</span>`;
								}
							}
						}
					},
					{
						headerName: this.translate.instant('Increased money'), field: 'raisedIncreased', editable: false, pinned: isMobile ? null : 'left',
						cellRenderer: (param) => {
							if (param.data && param.data.raisedIncreased != null) {
								const contentHtml = `<span class="badge badge-light-primary rounded-0 text-uppercase">${param.data.raisedIncreased + ' €'}</span>`;
								return contentHtml;

								// const actionBtnHtml = `<span id="theAction" class="action ml-2"><i class='la la-eye'></i></span>`;
								// setTimeout(() => {
								// 	const actionButton = param.eGridCell.querySelector('#theAction');
								// 	if (actionButton) {
								// 		actionButton.addEventListener('click', () => {
								// 			this.onShowDailyDetail(param.data);
								// 		});
								// 	}
								// }, 100);

								// return contentHtml + (actionBtnHtml || '');
							}
						}
					},
					{
						headerName: this.translate.instant('Increased investors'), field: 'investorCountIncreased', editable: false, pinned: isMobile ? null : 'left',
						cellRenderer: (param) => {
							if (param.data && param.data.investorCountIncreased != null) {
								const contentHtml = `<span class="badge badge-light-primary rounded-0 text-uppercase">${param.data.investorCountIncreased}</span>`;
								return contentHtml;

								// const actionBtnHtml = `<span id="theAction" class="action ml-2"><i class='la la-eye'></i></span>`;
								// setTimeout(() => {
								// 	const actionButton = param.eGridCell.querySelector('#theAction');
								// 	if (actionButton) {
								// 		actionButton.addEventListener('click', () => {
								// 			this.onShowDailyDetail(param.data);
								// 		});
								// 	}
								// }, 100);

								// return contentHtml + (actionBtnHtml || '');
							}
						}
					},
					{
						headerName: this.translate.instant('Involves Campaign Typologies'), filter: 'agTextColumnFilter', field: 'involvedCampaignTypologies', editable: false, sortable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.involvedCampaignTypologies) {
								return param.data.involvedCampaignTypologies.map(typology => {
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
							options: this.typologies
						}
					},
					{ headerName: this.translate.instant('Campaigns'), field: 'involvedCampaigns', editable: false, minWidth: 100 },
					// pre money
					{
						headerName: this.translate.instant('Pre money evaluation (MIN)'), field: 'preMoneyEvaluationMin', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.preMoneyEvaluationMin) {
								return param.data.preMoneyEvaluationMin + ' €';
							}
						}
					},
					{
						headerName: this.translate.instant('Pre money evaluation (MAX)'), field: 'preMoneyEvaluationMax', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.preMoneyEvaluationMax) {
								return param.data.preMoneyEvaluationMax + ' €';
							}
						}
					},
					{
						headerName: this.translate.instant('Pre money evaluation (AVG)'), field: 'preMoneyEvaluationAvg', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.preMoneyEvaluationAvg) {
								return param.data.preMoneyEvaluationAvg + ' €';
							}
						}
					},
					// minimum investment
					{
						headerName: this.translate.instant('Minimum investment (MIN)'), field: 'minimumInvestmentMin', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.minimumInvestmentMin) {
								return param.data.minimumInvestmentMin + ' €';
							}
						}
					},
					{
						headerName: this.translate.instant('Minimum investment (MAX)'), field: 'minimumInvestmentMax', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.minimumInvestmentMax) {
								return param.data.minimumInvestmentMax + ' €';
							}
						}
					},
					{
						headerName: this.translate.instant('Minimum investment (AVG)'), field: 'minimumInvestmentAvg', editable: false,
						cellRenderer: (param) => {
							if (param.data && param.data.minimumInvestmentAvg) {
								return param.data.minimumInvestmentAvg + ' €';
							}

						}, cellClass: isMobile ? 'custom-cell' : 'last-column-cell custom-cell'
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
		if (!this.activeTab) {
			this.activeTab = this.tabs[0];
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

		if (this.type == 'source') {
			if (!payload.filterModel['configs.involvedCampaignTypologies']) {
				payload.filterModel['configs.involvedCampaignTypologies'] = {
					filterType: 'set',
					values: this.typologies.map(el => el.value)
				};
			}
		} else if (this.type == 'category' || this.type == 'region') {
			if (!payload.filterModel.involvedCampaignTypologies) {
				payload.filterModel.involvedCampaignTypologies = {
					filterType: 'set',
					values: this.typologies.map(el => el.value)
				};
			}
		} else {
			if (!payload.filterModel.typology) {
				payload.filterModel.typology = {
					filterType: 'set',
					values: this.typologies.map(el => el.value)
				};
			}
		}
		if (this.type == 'campaign' || this.type == 'source') {
			if (payload.filterModel.tags) {
				payload.filterModel.tags = {
					or: true,
					filter: [[{ key: 'company.tags', filterType: 'set', values: payload.filterModel.tags.values, isObject: true }], [{ key: 'tags', filterType: 'set', values: payload.filterModel.tags.values, isObject: true }]]
				};
			}
			if (Object.keys(payload.filterModel).find(key => key == 'source')) {
				payload.filterModel['source.name'] = payload.filterModel.source;
				delete payload.filterModel.source;
			}
		}
		if (payload.sortModel && !payload.sortModel.find(e => e.colId && e.colId.indexOf('raisedIncreased') >= 0)) {
			payload.sortModel.push({ colId: 'raisedIncreased', sort: 'desc' });
		}
		if (payload.sortModel && !payload.sortModel.find(e => e.colId && e.colId.indexOf('investorCountIncreased') >= 0)) {
			payload.sortModel.push({ colId: 'investorCountIncreased', sort: 'desc' });
		}
		let result: QueryResultsModel;
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
		try {
			if (this.type == 'campaign') {
				payload.filterModel['source.configs.involvedCampaignCountries'] = {
					filterType: 'set',
					values: this.selectedCountries.map(el => el.key)
				};
				payload.filterModel.deleted = {
					filterType: 'ne',
					value: true
				};

				if (this.showGroup) {
					var regions = [];
					this.availableRegions.forEach(el => {
						if (el.selected) {
							el.regions.forEach(ele => {
								if (ele.selected) {
									regions.push(ele.key);
								}
							});
						}
					});
					if (regions.length) {
						payload.filterModel['region'] = {
							filterType: 'set',
							values: regions
						};
					}
				}

				this.activePayload = payload;

				const res = await this.campaignService.getValueByPeriod(payload, {
					startTime,
					endTime
				});
				if (!res) { throw {}; }

				this.totalReport.totalRaised = Math.round((res.totalRaised || 0 + Number.EPSILON) * 100) / 100;
				this.totalReport.totalInvestorCount = res.totalInvestorCount;
				this.totalReport.totalOngoingCampaigns = res.totalOngoingCampaigns;
				this.totalReport.totalComingsoonCampaigns = res.totalComingsoonCampaigns;
				this.totalReport.totalFundedCampaigns = res.totalFundedCampaigns;
				this.totalReport.totalNotFundedCampaigns = res.totalNotFundedCampaigns;
				this.totalReport.totalOngoingCampaignsNow = res.totalOngoingCampaignsNow;
				this.totalReport.totalComingsoonCampaignsNow = res.totalComingsoonCampaignsNow;

				result = new QueryResultsModel(res.items.map(el => {
					el.raisedIncreased = this.addCommas(Math.round((el.raisedIncreased || 0 + Number.EPSILON) * 100) / 100);
					el.investorCountIncreased = this.addCommas(Math.round((el.investorCountIncreased || 0 + Number.EPSILON) * 100) / 100);
					el.raised = this.addCommas(Math.round((el.raised || 0 + Number.EPSILON) * 100) / 100);
					el.preMoneyEvaluation = this.addCommas(Math.round((el.preMoneyEvaluation || 0 + Number.EPSILON) * 100) / 100);
					el.minimumInvestment = this.addCommas(Math.round((el.minimumInvestment || 0 + Number.EPSILON) * 100) / 100);
					el.preCommitmentMoney = el.raisedDaily && el.raisedDaily.length && el.raisedDaily[0].value ? this.addCommas(Math.round((el.raisedDaily[0].value || 0 + Number.EPSILON) * 100) / 100) : 0;
					el.preCommitmentUser = el.investorCountDaily && el.investorCountDaily.length && el.investorCountDaily[0].value ? this.addCommas(Math.round((el.investorCountDaily[0].value || 0 + Number.EPSILON) * 100) / 100) : 0;

					return el;
				}), res.totalCount);

				if (!this.filterSources.length && !this.started) {
					this.started = true;
					payload.endRow = res.totalCount;
					payload.pageSize = res.totalCount;

					const totalres = await this.campaignService.getValueByPeriod(payload, {
						startTime,
						endTime
					});

					this.filterSources.push({
						label: 'Select All',
						value: 'sall'
					});

					this.filterCountries.push({
						label: 'Select All',
						value: 'sall'
					});
	
					totalres.items.forEach(element => {
						if (element.source) {
							const exis = this.filterSources.findIndex(eel => eel.value == element.source.name) > -1;
							if (!exis) {
								this.filterSources.push({
									kind: 'sources',
									label: element.source.name,
									value: element.source.name
								});
							}
						}

						if (element.country) {
							const exisc = this.filterCountries.findIndex(eel => eel.value == element.country) > -1;
							if (!exisc) {
								this.filterCountries.push({
									label: element.country.charAt(0).toUpperCase() + element.country.slice(1),
									value: element.country
								});
							}
						}
					});
					this.defineColumns();
				}

			} else if (this.type == 'source') {
				this.activePayload = payload;
				const res = await this.sourceService.getValueByPeriod(payload, {
					startTime,
					endTime,
					countries: this.selectedCountries.map(el => el.key),
				});
				if (!res) { throw {}; }
				this.totalReport.totalRaised = Math.round((res.totalRaised || 0 + Number.EPSILON) * 100) / 100;
				this.totalReport.totalInvestorCount = res.totalInvestorCount;
				this.totalReport.totalOngoingCampaigns = res.totalOngoingCampaigns;
				this.totalReport.totalComingsoonCampaigns = res.totalComingsoonCampaigns;
				this.totalReport.totalFundedCampaigns = res.totalFundedCampaigns;
				this.totalReport.totalNotFundedCampaigns = res.totalNotFundedCampaigns;
				this.totalReport.totalOngoingCampaignsNow = res.totalOngoingCampaignsNow;
				this.totalReport.totalComingsoonCampaignsNow = res.totalComingsoonCampaignsNow;

				result = new QueryResultsModel(res.items.map((el, index) => {
					el.id = el._id || index;
					el.raisedIncreased = this.addCommas(Math.round((el.raisedIncreased || 0 + Number.EPSILON) * 100) / 100);
					el.investorCountIncreased = this.addCommas(Math.round((el.investorCountIncreased || 0 + Number.EPSILON) * 100) / 100);
					el.preMoneyEvaluationMin = this.addCommas(Math.round((el.preMoneyEvaluationMin || 0 + Number.EPSILON) * 100) / 100);
					el.preMoneyEvaluationMax = this.addCommas(Math.round((el.preMoneyEvaluationMax || 0 + Number.EPSILON) * 100) / 100);
					el.preMoneyEvaluationAvg = this.addCommas(Math.round((el.preMoneyEvaluationAvg || 0 + Number.EPSILON) * 100) / 100);
					el.minimumInvestmentMin = this.addCommas(Math.round((el.minimumInvestmentMin || 0 + Number.EPSILON) * 100) / 100);
					el.minimumInvestmentMax = this.addCommas(Math.round((el.minimumInvestmentMax || 0 + Number.EPSILON) * 100) / 100);
					el.minimumInvestmentAvg = this.addCommas(Math.round((el.minimumInvestmentAvg || 0 + Number.EPSILON) * 100) / 100);
					el.preCommitmentMoneyMin = this.addCommas(Math.round((el.preCommitmentMoneyMin || 0 + Number.EPSILON) * 100) / 100);
					el.preCommitmentMoneyMax = this.addCommas(Math.round((el.preCommitmentMoneyMax || 0 + Number.EPSILON) * 100) / 100);
					el.preCommitmentMoneyAvg = this.addCommas(Math.round((el.preCommitmentMoneyAvg || 0 + Number.EPSILON) * 100) / 100);
					el.preCommitmentUserMin = this.addCommas(Math.round((el.preCommitmentUserMin || 0 + Number.EPSILON) * 100) / 100);
					el.preCommitmentUserMax = this.addCommas(Math.round((el.preCommitmentUserMax || 0 + Number.EPSILON) * 100) / 100);
					el.preCommitmentUserAvg = this.addCommas(Math.round((el.preCommitmentUserAvg || 0 + Number.EPSILON) * 100) / 100);
					el.durationMin = this.addCommas(Math.round((el.durationMin || 0 + Number.EPSILON) * 100) / 100);
					el.durationMax = this.addCommas(Math.round((el.durationMax || 0 + Number.EPSILON) * 100) / 100);
					el.durationAvg = this.addCommas(Math.round((el.durationAvg || 0 + Number.EPSILON) * 100) / 100);
					el.comingSoonDurationMin = this.addCommas(Math.round((el.comingSoonDurationMin || 0 + Number.EPSILON) * 100) / 100);
					el.comingSoonDurationMax = this.addCommas(Math.round((el.comingSoonDurationMax || 0 + Number.EPSILON) * 100) / 100);
					el.comingSoonDurationAvg = this.addCommas(Math.round((el.comingSoonDurationAvg || 0 + Number.EPSILON) * 100) / 100);
					el.minimumGoalMin = this.addCommas(Math.round((el.minimumGoalMin || 0 + Number.EPSILON) * 100) / 100);
					el.minimumGoalMax = this.addCommas(Math.round((el.minimumGoalMax || 0 + Number.EPSILON) * 100) / 100);
					el.minimumGoalAvg = this.addCommas(Math.round((el.minimumGoalAvg || 0 + Number.EPSILON) * 100) / 100);
					el.maximumGoalMin = this.addCommas(Math.round((el.maximumGoalMin || 0 + Number.EPSILON) * 100) / 100);
					el.maximumGoalMax = this.addCommas(Math.round((el.maximumGoalMax || 0 + Number.EPSILON) * 100) / 100);
					el.maximumGoalAvg = this.addCommas(Math.round((el.maximumGoalAvg || 0 + Number.EPSILON) * 100) / 100);
					if (el.categories) {
						Object.keys(el.categories).forEach(key => {
							el['category_' + key] = this.addCommas(Math.round((el.categories[key] || 0 + Number.EPSILON) * 100) / 100);
						});
					}
					return el;
				}), res.totalCount);

			} else if (this.type == 'region') {

				payload.filterModel['source.configs.involvedCampaignCountries'] = {
					filterType: 'set',
					values: this.selectedCountries.map(el => el.key)
				};

				payload.filterModel.typology = payload.filterModel.involvedCampaignTypologies;
				delete payload.filterModel.involvedCampaignTypologies;
				payload.filterModel.deleted = {
					filterType: 'ne',
					value: true
				};
				this.activePayload = payload;

				const res = await this.campaignService.getValueForLocationByPeriod(payload, {
					startTime,
					endTime
				});
				if (!res) { throw {}; }

				// (res.items as Array<any>).forEach(element => {
				// 	var raisedDaily = [];
				// 	(element.raisedDaily as Array<any>).forEach(ele => {
				// 		var frd = raisedDaily.find(el => moment(el.date).startOf('day').valueOf() + 1000 == moment(ele.date).startOf('day').valueOf() + 1000);
				// 		if (frd) {
				// 			frd.value += ele.value;
				// 		} else {
				// 			raisedDaily.push(ele);
				// 		}
				// 	});
				// 	element.raisedDaily = raisedDaily;

				// 	var investorCountDaily = [];
				// 	(element.investorCountDaily as Array<any>).forEach(ele => {
				// 		var frd = investorCountDaily.find(el => moment(el.date).startOf('day').valueOf() + 1000 == moment(ele.date).startOf('day').valueOf() + 1000);
				// 		if (frd) {
				// 			frd.value += ele.value;
				// 		} else {
				// 			investorCountDaily.push(ele);
				// 		}
				// 	});
				// 	element.investorCountDaily = investorCountDaily;
				// });

				this.totalReport.totalRaised = Math.round((res.totalRaised || 0 + Number.EPSILON) * 100) / 100;
				this.totalReport.totalInvestorCount = res.totalInvestorCount;
				this.totalReport.totalOngoingCampaigns = res.totalOngoingCampaigns;
				this.totalReport.totalComingsoonCampaigns = res.totalComingsoonCampaigns;
				this.totalReport.totalFundedCampaigns = res.totalFundedCampaigns;
				this.totalReport.totalNotFundedCampaigns = res.totalNotFundedCampaigns;
				this.totalReport.totalOngoingCampaignsNow = res.totalOngoingCampaignsNow;
				this.totalReport.totalComingsoonCampaignsNow = res.totalComingsoonCampaignsNow;

				result = new QueryResultsModel(res.items.map(el => {
					el.raisedIncreased = this.addCommas(Math.round((el.raisedIncreased || 0 + Number.EPSILON) * 100) / 100);
					el.investorCountIncreased = this.addCommas(Math.round((el.investorCountIncreased || 0 + Number.EPSILON) * 100) / 100);
					return el;
				}), res.totalCount);

			} else if (this.type == 'category') {

				this.activePayload = payload;

				const res = await this.aliasService.getValueByPeriod(payload, {
					startTime,
					endTime,
					withFirstCategory: this.withFirstCategory,
					countries: this.selectedCountries.map(el => el.key)
				});
				if (!res) { throw {}; }

				// (res.items as Array<any>).forEach(element => {
				// 	var raisedDaily = [];
				// 	(element.raisedDaily as Array<any>).forEach(ele => {
				// 		var frd = raisedDaily.find(el => moment(el.date).startOf('day').valueOf() + 1000 == moment(ele.date).startOf('day').valueOf() + 1000);
				// 		if (frd) {
				// 			frd.value += ele.value;
				// 		} else {
				// 			raisedDaily.push(ele);
				// 		}
				// 	});
				// 	element.raisedDaily = raisedDaily;

				// 	var investorCountDaily = [];
				// 	(element.investorCountDaily as Array<any>).forEach(ele => {
				// 		var frd = investorCountDaily.find(el => moment(el.date).startOf('day').valueOf() + 1000 == moment(ele.date).startOf('day').valueOf() + 1000);
				// 		if (frd) {
				// 			frd.value += ele.value;
				// 		} else {
				// 			investorCountDaily.push(ele);
				// 		}
				// 	});
				// 	element.investorCountDaily = investorCountDaily;
				// });

				this.totalReport.totalRaised = Math.round((res.totalRaised || 0 + Number.EPSILON) * 100) / 100;
				this.totalReport.totalInvestorCount = res.totalInvestorCount;
				this.totalReport.totalOngoingCampaigns = res.totalOngoingCampaigns;
				this.totalReport.totalComingsoonCampaigns = res.totalComingsoonCampaigns;
				this.totalReport.totalFundedCampaigns = res.totalFundedCampaigns;
				this.totalReport.totalNotFundedCampaigns = res.totalNotFundedCampaigns;
				this.totalReport.totalOngoingCampaignsNow = res.totalOngoingCampaignsNow;
				this.totalReport.totalComingsoonCampaignsNow = res.totalComingsoonCampaignsNow;

				result = new QueryResultsModel(res.items.map(el => {
					el.raisedIncreased = this.addCommas(Math.round((el.raisedIncreased || 0 + Number.EPSILON) * 100) / 100);
					el.investorCountIncreased = this.addCommas(Math.round((el.investorCountIncreased || 0 + Number.EPSILON) * 100) / 100);
					el.preMoneyEvaluationMin = this.addCommas(Math.round((el.preMoneyEvaluationMin || 0 + Number.EPSILON) * 100) / 100);
					el.preMoneyEvaluationMax = this.addCommas(Math.round((el.preMoneyEvaluationMax || 0 + Number.EPSILON) * 100) / 100);
					el.preMoneyEvaluationAvg = this.addCommas(Math.round((el.preMoneyEvaluationAvg || 0 + Number.EPSILON) * 100) / 100);
					el.minimumInvestmentMin = this.addCommas(Math.round((el.minimumInvestmentMin || 0 + Number.EPSILON) * 100) / 100);
					el.minimumInvestmentMax = this.addCommas(Math.round((el.minimumInvestmentMax || 0 + Number.EPSILON) * 100) / 100);
					el.minimumInvestmentAvg = this.addCommas(Math.round((el.minimumInvestmentAvg || 0 + Number.EPSILON) * 100) / 100);
					return el;
				}), res.totalCount);
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

		console.info('this.activePayload == ', this.activePayload);

		this.loadingSubject.next(false);
		if (this.keptPage > 0) {
			setTimeout(() => {
				this.tableCtrl.gridApi.paginationGoToPage(this.keptPage);
				this.keptPage = -1;
			}, 100);
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
			if (node && node.data && node.data.link) {
				window.open(node.data.link);
			}
		} else if (param.type == 'XLS') {
			this.onDownloadCampaignsXLS(node.data);
		}
	}
	async onDownloadCampaignsXLS(param) {
		this.loadingSubject.next(true);

		try {
			const data = await this.sourceService.downloadCampaignsXLS({
				startTime: moment(this.periodStart).startOf('day').toDate(),
				endTime: moment(this.periodEnd).endOf('day').toDate(),
				name: [param.name],
				typologies: this.activePayload.filterModel.typology.values,
				countries: this.selectedCountries.map(el => el.key)
			});

			if (!data) { throw {}; }
			const blob = new Blob([data], { type: 'application/vnd.ms-excel' });
			saveAs(blob, `${param.name}_${this.getDateTimeFromDate(this.periodStart, 'day')}-${this.getDateTimeFromDate(this.periodEnd, 'day')}.xlsx`);

		} catch (error) {
		}

		this.loadingSubject.next(false);
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
	onDateRangeChanged(event) {
		this.periodStart = new Date(event[0]);
		this.periodEnd = moment(event[1]).endOf('day').toDate();

		this.filterSources = [];
		this.filterCountries = [];
		this.started = false;

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

		this.filterSources = [];
		this.filterCountries = [];
		this.started = false;

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
	onChangeAnalyticsType(event) {
		this.defineColumns();
		this.tableCtrl.willRefreshTable.next('DATA');
	}
	getIncreasedMoney(param) {
		let result = 0;
		try {
			const raisedDaily = param.raisedDaily || [];
			const start = moment(this.periodStart);
			const end = moment(this.periodEnd);

			if (end && !end.isAfter(start)) { throw {}; }

			if (!param.startDate || (param.endDate && moment(param.startDate).isAfter(moment(param.endDate)))) {
				throw {};
			}

			const startRaised = findLast(raisedDaily, el => moment(start).isAfter(el.date));
			const endRaised = end ? findLast(raisedDaily, el => end.isAfter(moment(el.date))) : raisedDaily[raisedDaily.length - 1];

			if (endRaised) {
				if (startRaised) {
					result = endRaised.value - startRaised.value;
				} else {
					result = endRaised.value;
				}
			}

		} catch (error) {
		}
		return result;
	}
	getIncreasedInvestors(param) {
		let result = 0;
		try {
			const investorCountDaily = param.investorCountDaily || [];
			const start = moment(this.periodStart);
			const end = moment(this.periodEnd);

			if (end && !end.isAfter(start)) { throw {}; }

			if (!param.startDate || (param.endDate && moment(param.startDate).isAfter(moment(param.endDate)))) {
				throw {};
			}


			const startInvestorCount = findLast(investorCountDaily, el => moment(start).isAfter(el.date));
			const endInvestorCount = end ? findLast(investorCountDaily, el => end.isAfter(moment(el.date))) : investorCountDaily[investorCountDaily.length - 1];

			if (endInvestorCount) {
				if (startInvestorCount) {
					result = endInvestorCount.value - startInvestorCount.value;
				} else {
					result = endInvestorCount.value;
				}
			}

		} catch (error) {

		}
		return result;
	}
	onSelectTypology(e) {
		this.tableCtrl.willRefreshTable.next('DATA');
	}
	async onSelectCountry(e) {
		this.activePayload.filterModel['source.configs.involvedCampaignCountries'] = {
			filterType: 'set',
			values: this.selectedCountries.map(el => el.key)
		}
		await this.loadRegions();

		this.filterSources = [];
		this.filterCountries = [];
		this.started = false;
		this.availableRegions = [];

		var isItaly = this.selectedCountries.findIndex(el => el.key == 'italy') > -1;
		var isFrance = this.selectedCountries.findIndex(el => el.key == 'france') > -1;
		if (isItaly || isFrance) {
			this.showGroup = true;
			if (isItaly) {
				this.itRegions.forEach(ell => {
					this.availableRegions.push(ell);
				});
			}
			if (isFrance) {
				this.frRegions.forEach(ell => {
					this.availableRegions.push(ell);
				});
			}
		} else {
			this.showGroup = false;
		}

		this.defineColumns();
		sessionStorage.setItem('selectedCountries', JSON.stringify(this.selectedCountries));
		this.tableCtrl.willRefreshTable.next('DATA');
	}

	async onSelectGroup(e) {
		const selected = this.selectedGroups.findIndex(el => el.key == e.key) > -1;
		if (selected) {
			var group = this.availableRegions.find(ele => ele.key == e.key);
			if (group) {
				group.selected = true;
				group.regions.forEach(reg => reg.selected = true);
			}
		} else {
			var group = this.availableRegions.find(ele => ele.key == e.key);
			if (group) {
				group.selected = false;
				group.regions.forEach(reg => reg.selected = false);
			}
		}
		this.cdr.detectChanges();
		this.tableCtrl.willRefreshTable.next('DATA');
	}

	onChangeRegion($event, region) {
		region.selected = $event.target.checked;
		this.tableCtrl.willRefreshTable.next('DATA');
	}

	async downloadXLS() {
		this.loadingSubject.next(true);

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
			if (this.type == 'campaign') {

				const data = await this.campaignService.downloadReportXLS(this.activePayload, {
					startTime,
					endTime,
					ids: this.tableCtrl.originSelectedRowIds
				});

				if (!data) { throw {}; }
				const blob = new Blob([data], { type: 'application/vnd.ms-excel' });
				if (this.periodType == 'none') {
					saveAs(blob, `campaigns-${this.selectedCountries.map(el => el.key).join('_')},${this.activePayload.filterModel.typology.values.join('_')}(entires).xlsx`);
				} else {
					saveAs(blob, `campaigns-${this.selectedCountries.map(el => el.key).join('_')},${this.periodType},${this.activePayload.filterModel.typology.values.join('_')}(${this.getDateTimeFromDate(this.periodStart, 'day')}-${this.getDateTimeFromDate(this.periodEnd, 'day')}).xlsx`);
				}

			} else if (this.type == 'region') {

				const data = await this.campaignService.downloadLocationReportXLS(this.activePayload, {
					startTime,
					endTime,
					ids: this.tableCtrl.originSelectedRowIds
				});

				if (!data) { throw {}; }
				const blob = new Blob([data], { type: 'application/vnd.ms-excel' });

				if (this.periodType == 'none') {
					saveAs(blob, `region-${this.selectedCountries.map(el => el.key).join('_')},${this.activePayload.filterModel.typology.values.join('_')}(entires).xlsx`);
				} else {
					saveAs(blob, `region-${this.selectedCountries.map(el => el.key).join('_')},${this.activePayload.filterModel.typology.values.join('_')},${this.periodType}(${this.getDateTimeFromDate(this.periodStart, 'day')}-${this.getDateTimeFromDate(this.periodEnd, 'day')}).xlsx`);
				}
				
			} else if (this.type == 'source') {
				const data = await this.sourceService.downloadReportXLS({
					startTime,
					endTime,
					typologies: this.activePayload.filterModel['configs.involvedCampaignTypologies'].values,
					countries: this.selectedCountries.map(el => el.key),
					ids: this.tableCtrl.originSelectedRowIds
				});

				if (!data) { throw {}; }
				const blob = new Blob([data], { type: 'application/vnd.ms-excel' });
				if (this.periodType == 'none') {
					saveAs(blob, `source-${this.selectedCountries.map(el => el.key).join('_')},${this.activePayload.filterModel['configs.involvedCampaignTypologies'].values.join('_')}(entires).xlsx`);
				} else {
					saveAs(blob, `source-${this.selectedCountries.map(el => el.key).join('_')},${this.activePayload.filterModel['configs.involvedCampaignTypologies'].values.join('_')},${this.periodType}(${this.getDateTimeFromDate(this.periodStart, 'day')}-${this.getDateTimeFromDate(this.periodEnd, 'day')}).xlsx`);
				}
				
			} else if (this.type == 'category') {
				const data = await this.aliasService.downloadReportXLS(this.activePayload, {
					startTime,
					endTime,
					withFirstCategory: this.withFirstCategory,
					countries: this.selectedCountries.map(el => el.key),
					ids: this.tableCtrl.originSelectedRowIds
				});

				if (!data) { throw {}; }
				const blob = new Blob([data], { type: 'application/vnd.ms-excel' });
				if (this.periodType == 'none') {
					saveAs(blob, `category-${this.selectedCountries.map(el => el.key).join('_')},${this.activePayload.filterModel.involvedCampaignTypologies.values.join('_')}(entires).xlsx`);
				} else {
					saveAs(blob, `category-${this.selectedCountries.map(el => el.key).join('_')},${this.activePayload.filterModel.involvedCampaignTypologies.values.join('_')},${this.periodType}(${this.getDateTimeFromDate(this.periodStart, 'day')}-${this.getDateTimeFromDate(this.periodEnd, 'day')}).xlsx`);
				}
			}

		} catch (error) {

		}
		this.loadingSubject.next(false);
	}
	onShowDailyDetail(data) {
		console.info('data =: ', data);
		if (data.data) {
			const modalRef = this.modal.open(DailyDetailDialog, {
				animation: false, backdrop: 'static', size: 'lg',
				keyboard: false
			});
			modalRef.componentInstance.periodStart = this.periodStart;
			modalRef.componentInstance.periodEnd = this.periodEnd;
			modalRef.componentInstance.periodType = this.periodType;
			modalRef.componentInstance.forIncrease = false;

			modalRef.componentInstance.items = data.data.map(ell => {
				const temp = {
					...ell, id: ell._id
				}
				return temp;
			});
		} else {
			const raisedDaily = data.raisedDaily || [];
			const investorCountDaily = data.investorCountDaily || [];
			const days = sortBy(union(
				raisedDaily.map(el => moment(el.date).startOf('day').valueOf() + 1000),
				investorCountDaily.map(el => moment(el.date).startOf('day').valueOf() + 1000),
			));
			console.info('days =: ', days);
			const modalRef = this.modal.open(DailyDetailDialog, {
				animation: false, backdrop: 'static', size: 'lg',
				keyboard: false
			});

			let prevRaised; let prevInvestorCount;

			modalRef.componentInstance.periodStart = this.periodStart;
			modalRef.componentInstance.periodEnd = this.periodEnd;
			modalRef.componentInstance.periodType = this.periodType;

			modalRef.componentInstance.items = days.map(dt => {
				const raised = raisedDaily.find(el => el.value && moment(el.date).startOf('day').valueOf() + 1000 == dt);
				const investorCount = investorCountDaily.find(el => el.value && moment(el.date).startOf('day').valueOf() + 1000 == dt);
				const result = {
					date: dt,
					raised: raised ? (this.addCommas(raised.value) + (prevRaised ? ` (${raised.value > prevRaised.value ? '+' : ''}${this.addCommas(raised.value - prevRaised.value)})` : '')) : null,
					investorCount: investorCount ? (this.addCommas(investorCount.value) + (prevInvestorCount ? ` (${investorCount.value > prevInvestorCount.value ? '+' : ''}${this.addCommas(investorCount.value - prevInvestorCount.value)})` : '')) : null,
				};

				prevRaised = raised || prevRaised;
				prevInvestorCount = investorCount || prevInvestorCount;

				return result;
			});
		}		
	}

	onEdit(id, key) {
		const modalRef = this.modal.open(DatePickerDialog, { animation: false, size: 'md', centered: true });
		const subscr = modalRef.closed.subscribe(async res => {
			try {
				if (!res) { throw ''; }
				await this.campaignService.update({
					_id: id,
					[key]: res
				});
				this.keptPage = Math.max(0, this.tableCtrl.gridApi.paginationGetCurrentPage() - Math.floor(1 / this.tableCtrl.gridApi.paginationGetPageSize()));
				this.tableCtrl.onDeSelectAllButton();
				this.tableCtrl.willRefreshTable.next('DATA');
			} catch (error) {
			}
			setTimeout(() => subscr.unsubscribe(), 100);
		});
	}
	onClickEndDateOverview(param) {
		if (param) {
			const modalRef = this.modal.open(MainModalComponent, { animation: false });
			modalRef.componentInstance.modalData = {
				key_values: param.previousEndDates.map(el => ({ value: this.getDateStringFromDate(el.value) }))
			};
		}
	}
}
