import { CommonService } from 'src/app/pages/common/common.service';
// Angular
import { Component, OnInit, ViewChild, ChangeDetectionStrategy, OnDestroy, ViewRef, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription, BehaviorSubject } from 'rxjs';
import { cloneDeep, each, intersection, intersectionWith, unionBy} from 'lodash';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { switchMap } from 'rxjs/operators';
import { LpTableComponent } from 'src/app/pages/common/lp-table/lp-table.component';
import { ToastService } from 'src/app/pages/common/toast.service';
import { TranslateService } from '@ngx-translate/core';
import { AliasService } from 'src/app/pages/common/alias.service';
import { CompanyService } from 'src/app/pages/common/company.service';
import { CampaignService } from 'src/app/pages/common/campaign.service';
import { KTUtil } from 'src/app/_metronic/kt';
import { MainModalComponent } from 'src/app/_metronic/partials/layout/modals/main-modal/main-modal.component';
import { QueryResultsModel } from 'src/app/pages/common/models/query-results.model';
import { CompanySearchDialog } from '../../company/company-search-dialog/company-search-dialog';
import * as objectPath from 'object-path';
import { CountryService } from 'src/app/pages/common/country.service';
import { CheckCampaignsDialog } from './check-campaigns/check-campaigns.dialog';
import { DatePickerDialog } from 'src/app/pages/dialogs/date-picker/date-picker.dialog';
import { SplashScreenService } from 'src/app/_metronic/partials';
import { AuthService } from 'src/app/modules/auth';
import { tag2category } from 'src/app/pages/common/common';
import * as e from 'express';
import * as moment from 'moment';
import { saveAs } from 'file-saver';

@Component({
	selector: 'app-campaigns-list',
	templateUrl: './campaigns-list.component.html',
	styleUrls: ['./campaigns-list.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CampaignsListComponent implements OnInit, OnDestroy {

	locale = 'it-IT';
	country = 'italy';

	loadingSubject = new BehaviorSubject<boolean>(true);
	loading$: Observable<boolean>;

	columnDefs: any[] = [];
	isEmptyTable = false;
	keptPage = -1;

	duplicatedIds = [];
	deletedIds = [];

	tabs: any[] = [
		{
			title: 'All',
			state: 'all',
			filter : {
				deleted: {
					filterType: 'ne',
					value: true
				},
				disabled: {
					filterType: 'ne',
					value: true
				}
			}
		},
		{
			title: 'Unconfirmed',
			state: 'unconfirmed',
			filter : {
				companyConfirmed : {
					filterType: 'ne',
					value: true
				},
				deleted: {
					filterType: 'ne',
					value: true
				},
				disabled: {
					filterType: 'ne',
					value: true
				}
			},
			count: 0
		},
		{
			title: 'Confirmed',
			state: 'confirmed',
			filter : {
				companyConfirmed : {
					filterType: 'eq',
					value: true
				},
				deleted: {
					filterType: 'ne',
					value: true
				},
				disabled: {
					filterType: 'ne',
					value: true
				}
			},
			count: 0
		},
		{
			title: 'No Tags',
			state: 'no_tags',
			typologies: ['company equity', 'company lending'],
			filter : {
				deleted: {
					filterType: 'ne',
					value: true
				},
				disabled: {
					filterType: 'ne',
					value: true
				},
				no_tags: {
					or: true,
					filter: [[
						{
							key: 'tags',
							filterType: 'size',
							value: 0
						}
					]]
				},
				no_company_tags: {
					or: true,
					filter: [[
						{
							key: 'company.tags',
							filterType: 'size',
							value: 0
						}
					], [
						{
							key: 'company',
							filterType: 'exists',
							value: false
						},
					],
					[
						{
							key: 'company',
							filterType: 'eq',
							value: null
						},
					]]
				}
			},
			count: 0
		},
		{
			title: 'No Company',
			state: 'no_company',
			filter : {
				deleted: {
					filterType: 'ne',
					value: true
				},
				disabled: {
					filterType: 'ne',
					value: true
				},
				no_company: {
					or: true,
					filter: [
						[
							{
								key: 'company',
								filterType: 'exists',
								value: false
							},
						],
						[
							{
								key: 'company',
								filterType: 'eq',
								value: null
							},
						]
					]
				}
			},
			count: 0
		},
		{
			title: 'No Location',
			state: 'no_location',
			filter : {
				deleted: {
					filterType: 'ne',
					value: true
				},
				disabled: {
					filterType: 'ne',
					value: true
				},
				fullAddress: {
					filterType: 'eq',
					value: null
				}
			},
			count: 0
		},
		{
			title: 'No contacted',
			state: 'no_contacted',
			filter : {
				deleted: {
					filterType: 'ne',
					value: true
				},
				disabled: {
					filterType: 'ne',
					value: true
				},
				status: {
					filterType: 'set',
					values: ['1_ongoing', '2_comingsoon']
				},
				'company.contactDate': {
					filterType: 'exists',
					value: false
				},
			},
			count: 0
		},
		{
			title: 'Duplicated',
			state: 'duplicated',
			filter : {
				deleted: {
					filterType: 'ne',
					value: true
				},
				disabled: {
					filterType: 'ne',
					value: true
				}
			},
			count: 0
		},
		{
			title: 'Suspended',
			state: 'suspended',
			filter : {
				deleted: {
					filterType: 'eq',
					value: true
				}
			},
		},
		{
			title: 'Deleted',
			state: 'deleted',
			filter : {
				deleted: {
					filterType: 'ne',
					value: true
				},
				disabled: {
					filterType: 'ne',
					value: true
				},
				updatedAt: {
					filterType: 'lt',
					value: new Date().setDate(new Date().getDate() - 3),
					isDate: true
				},
				status: {
					filterType: 'set',
					values: ['1_ongoing', '2_comingsoon', '5_extra']
				}
			},
		},
		{
			title: 'No source',
			state: 'no_source',
			filter : {
				source: {
					filterType: 'eq',
					value: null
				}
			},
		},
		{
			title: 'No valid data',
			state: 'no_valid',
			filter : {
				deleted: {
					filterType: 'ne',
					value: true
				},
				disabled: {
					filterType: 'ne',
					value: true
				}
			}
		}
	];

	activeTab;
	activePayload: any;

	extraActions: any[] = [{
		type: 'CONFIRM',
		icon: 'la la-check-circle',
		text: 'Confirm company',
		onlyIcon: true,
	},
	{
		type: 'RESTORE_SOURCE',
		text: 'Restore source',
	},
	{
		type: 'ADDRESS',
		icon: 'flaticon-pin',
		text: 'Update location',
		onlyIcon: true,
	},
  {
		type: 'SUSPEND',
		text: 'Suspend',
	}];

	withCheckLink = true;

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
	_typologies: any[] = [
		{key: 'company equity', title: 'company equity'},
		{key: 'company lending', title: 'company lending'},
		{key: 'real estate equity', title: 'real estate equity'},
		{key: 'real estate lending', title: 'real estate lending'},
		{key: 'minibond', title: 'minibond'}
	];

	_countries = [];

	typologies = [];
	filterTypologies = [];
	countries = [];

	writable = {
		typologies: [],
		countries: [],
		allowed: false,
    admin: false
	};
	company_writable = false;

	selectedTypologies = [];
	selectedCountries = [];

  periodType = 'year';
	periodStart: Date = moment(new Date()).startOf('year').toDate();
	periodEnd: Date = moment(new Date()).endOf('year').toDate();
	periodRange: Date[] = [new Date((new Date()).getFullYear(),(new Date()).getMonth(),1),
		new Date((new Date()).getFullYear() + 1 ,(new Date()).getMonth() + 1,0)];
	
	statusFilters = [];
	typologyFilters = [];

	filterSources = [];
	filterCountries = [];

	@ViewChild('tableCtrl', {static: true}) tableCtrl: LpTableComponent;

	private unsubscribe: Subscription[] = [];

	constructor(
				   private activatedRoute: ActivatedRoute,
				   private cdr: ChangeDetectorRef,
				   private router: Router,
				   private translate: TranslateService,
				   private modal: NgbModal,
				   private toastService: ToastService,
				   private aliasService: AliasService,
				   private companyService: CompanyService,
				   private countryService: CountryService,
				   private splashScreenService: SplashScreenService,
				   private auth: AuthService,
				   private campaignService: CampaignService,
					 private comService: CommonService
					 ) { }

	ngOnInit() {

		const user = this.auth.currentUserValue;
		// this._countries = user.countries.map( el => ({
		// 		key: el,
		// 		title: el.charAt(0).toUpperCase() + el.slice(1)
		// 	}));

    this._countries = [
      {key: 'italy', title: 'Italy'},
      {key: 'spain', title: 'Spain'},
      {key: 'france', title: 'France'}
    ];		

		this.writable = this.auth.hasPermission('source', 'writable');
		this.company_writable = this.auth.hasPermission('company', 'writable').allowed;

		this.loadingSubject = this.splashScreenService.loadingSubject;
		this.loading$ = this.loadingSubject.asObservable();

		this.unsubscribe.push(this.translate.onLangChange.subscribe( lang => {
			this.updateByTranslate(lang.lang);
		}));
		this.updateByTranslate(this.translate.currentLang);

		this.selectedCountries = sessionStorage.getItem('selectedCountries') ? JSON.parse(sessionStorage.getItem('selectedCountries')) : [];

		const self = this;
		this.tableCtrl.rowClassRules['deleted-row'] = (param) => {
			if (param && param.data && param.data.id){
				return self.deletedIds.includes(param.data.id);
			}
		};
		this.tableCtrl.rowClassRules['duplicated-row'] = (param) => {
			if (param && param.data && param.data.id){
				return self.duplicatedIds.includes(param.data.id);
			}
		};
		this.init();

		this.unsubscribe.push(this.comService.filterOptions.subscribe(options => {
			this.filterSources = options;
			this.defineColumns();
		}));
	}

	async init() {
		try {
			const pr = this.auth.hasPermission('source', 'readable');
			if (!pr.allowed) {
				this.toastService.show('You dont have permision for this page');
				this.router.navigateByUrl('/');
				return;
			}
			this.typologies = this._typologies.filter( el => pr.typologies.includes(el.key));
			this.countries = this._countries.filter(el => pr.countries.includes(el.key));

			await this.loadState('unconfirmed');
			if (this.selectedCountries.length) {
				this.selectedCountries = intersectionWith(this.selectedCountries, this.countries, (a, b) => a.key == b.key);
			} else if (this.countries.length) {
				this.selectedCountries = [this.countries.find( el => el.key == 'italy') || this.countries[0]];
			} else {
				this.selectedCountries = [];
			}

			if (this.selectedTypologies.length) {
				this.selectedTypologies = intersectionWith(this.selectedTypologies, this.typologies, (a, b) => a.key == b.key);
			} else if (this.typologies.length) {
        this.selectedTypologies = this.typologies.filter( el => el.key == 'company lending' || el.key == 'company equity');
			} else {
				this.selectedTypologies = [];
			}

			// this.defineColumns();
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

	defineColumns() {
		if (sessionStorage.getItem('statusfilter')) {
			this.statusFilters = JSON.parse(sessionStorage.getItem('statusfilter'));
		}

		if (sessionStorage.getItem('typologyfilter')) {
			this.typologyFilters = JSON.parse(sessionStorage.getItem('typologyfilter'));
		}

		this.filterTypologies = this._typologies.map(ele => ({
			kind: 'typology',
			label: ele.title,
			value: ele.key,
			selected: this.typologyFilters.length ? (this.typologyFilters.find(el => el.value == ele.key)?.selected ? true : false) : ((ele.key == 'company equity' || ele.key == 'company lending') ? true : (((ele.key == 'real estate equity' || ele.key == 'real estate lending') && this.activeTab?.state == 'duplicated') ? true : false))
		}));

		const isMobile = KTUtil.isMobileDevice();
		this.tableCtrl.selectionPreviewColumns = [{field: 'name'}];
		const columnDefs: any[] = [
			{ headerName: this.translate.instant('Name'), filter: 'agTextColumnFilter', field: 'name', editable: false, pinned: isMobile? null: 'left', minWidth: 200,
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
        floatingFilterComponent: 'dropdownFloatingFilter',
				suppressMenu: true,
				floatingFilterComponentParams: {
					suppressFilterButton: true,
					options: [{
						kind: 'status',
						label: 'ongoing',
						value: '1_ongoing',
						selected: (this.statusFilters.length && this.statusFilters.find(el => el.value == '1_ongoing')?.selected) ? true: false
					},
					{
						kind: 'status',
						label: 'comingsoon',
						value: '2_comingsoon',
						selected: (this.statusFilters.length && this.statusFilters.find(el => el.value == '2_comingsoon')?.selected) ? true: false
					},
					{
						kind: 'status',
						label: 'closed funded',
						value: '3_funded',
						selected: (this.statusFilters.length && this.statusFilters.find(el => el.value == '3_funded')?.selected) ? true: false
					},
					{
						kind: 'status',
						label: 'close not funded',
						value: '4_closed',
						selected: (this.statusFilters.length && this.statusFilters.find(el => el.value == '4_closed')?.selected) ? true: false
					},
					{
						kind: 'status',
						label: 'closing',
						value: '5_extra',
						selected: (this.statusFilters.length && this.statusFilters.find(el => el.value == '5_extra')?.selected) ? true: false
					},
          {
						kind: 'status',
						label: 'refunded',
						value: '6_refunded',
						selected: (this.statusFilters.length && this.statusFilters.find(el => el.value == '6_refunded')?.selected) ? true: false
					},
					]
				},
			},
			{
				headerName: this.translate.instant('City'),  field: 'city',filter: 'agTextColumnFilter',  editable: false,
				hide: intersection(this.selectedTypologies.map( el => el.key), ['real estate equity', 'real estate lending']).length != 0
			},
			{
				headerName: this.translate.instant('Address'),  field: 'fullAddress', filter: 'agTextColumnFilter', editable: false,
				hide: intersection(this.selectedTypologies.map( el => el.key), ['real estate equity', 'real estate lending']).length != 0,
			},
			{ headerName: this.translate.instant('Source'), filter: 'agTextColumnFilter', field: 'source', editable: false, pinned: isMobile? null: 'left', minWidth: 100,
				cellRenderer: param => {
					if (param.data && param.data.source) {
						return `<span class="badge rounded-0 badge-primary">${param.data.source.name}</span>`;
					} else if (param.data && !param.data.source && param.data.sourceName) {
						return `<span class="badge rounded-0 badge-secondary">${param.data.sourceName}</span>`;
					}
				},
				floatingFilterComponent: 'dropdownFloatingFilter',
				suppressMenu: true,
				floatingFilterComponentParams: {
					suppressFilterButton: true,
					options: this.filterSources
				},
			},
			{ headerName: this.translate.instant('Typology'), filter: 'agTextColumnFilter', field: 'typology',editable: false, sortable: false, pinned: isMobile? null: 'left',
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
					options: this.filterTypologies
				},
			},
			{ headerName: this.translate.instant('Country'), field: 'country', filter: 'agTextColumnFilter', editable: false,
				floatingFilterComponent: 'dropdownFloatingFilter',
				suppressMenu: true,
				floatingFilterComponentParams: {
					suppressFilterButton: true,
					options: this.filterCountries
				},
			},
			{ headerName: this.translate.instant('Company'), filter: 'agTextColumnFilter', field: 'company', editable: false,  minWidth: 150,
				cellRenderer: (param) => {
					if (param.data) {
						let result = '';
						const companyNameHtml = `<span id="theName" class="show-action">
						${param.data.company? (param.data.company.name.substr(0,20) + (param.data.company.name.length > 20 ? '...': '')): ''}</span>`;
						if (param.data.company) {
							result = companyNameHtml;
						}
						if (this.activeTab && this.activeTab.state != 'suspended') {
							const confirmButtonHtml = `<span id="theConfirmButton" class="action" ><i class='la la-check'></i></span>`;
							const removeButtonHtml = `<span id="theRemoveButton" class="action"><i class='la la-trash'></i></span>`;
							const searchButtonHtml = `<span id="theSearchButton" class="action"><i class='la la-search'></i></span>`;
							const reScrapButtonHtml = `<span id="theReScrapButton" class="action"><i class='la la-sync'></i></span>`;

							setTimeout( () => {
								const searchButton = param.eGridCell.querySelector('#theSearchButton');
								if (searchButton) {
									searchButton.addEventListener('click', () => {
										this.onClickCompanyEdit(param.data);
									});
								}
								const confirmButton = param.eGridCell.querySelector('#theConfirmButton');
								if (confirmButton) {
									confirmButton.addEventListener('click', () => {
										this.confirmCompanyById([param.data._id], param.data);
									});
								}
								const removeButton = param.eGridCell.querySelector('#theRemoveButton');
								if (removeButton) {
									removeButton.addEventListener('click', () => {
										this.onClickCompanyRemove(param.data._id, param.data.name);
									});
								}
								const reScrapButton = param.eGridCell.querySelector('#theReScrapButton');
								if (reScrapButton) {
									reScrapButton.addEventListener('click', () => {
										this.onClickCompanyReScrap(param.data.company._id);
									});
								}
								if (param.data.company) {
									const theName = param.eGridCell.querySelector('#theName');
									if (theName) {
										theName.addEventListener('click', () => {
											this.onClickCompanyOverview(param.data.company);
										});
									}
								}
							}, 0);
							if (!param.data.companyConfirmed) {
								result += confirmButtonHtml;
							}
							result += searchButtonHtml;
							if (param.data.company) {
								result += reScrapButtonHtml;
								result += removeButtonHtml;
							}
						}
						return result;
					}
				}
			},
			{ headerName: this.translate.instant('Company Searched At'), filter: 'agDateColumnFilter', field: 'companySearchedAt', editable: false,
				cellRenderer: param => {
					if (param.data && param.data.companySearchedAt) {
						return this.getDateTimeFromDate(param.data.companySearchedAt);
					}
				}
			},
			{ headerName: this.translate.instant('Start date'), filter: 'agDateColumnFilter', field: 'startDate', editable: false.valueOf,
				cellStyle: param => {
					if (this.activeTab.state == 'no_valid' && ((!param.data.startDate && param.data.endDate) || (param.data.startDate && param.data.endDate && new Date(param.data.startDate) > new Date(param.data.endDate)))) {
						return { color: 'white', backgroundColor: '#7c1906' };
					}
					return null;
				},
				cellRenderer: param => {
					if (param.data) {
            setTimeout( () => {
              const theButton = param.eGridCell.querySelector('#theEditButton');
              if (theButton) {
                theButton.addEventListener('click', () => {
                  this.onEdit(param.data._id, 'startDate');
                });
              }
              const theRemoveButton = param.eGridCell.querySelector('#theRemoveButton');
              if (theRemoveButton) {
                theRemoveButton.addEventListener('click', () => {
                  this.onRemoveDate(param.data._id, 'startDate');
                });
              }
            }, 0);
						if (!param.data.startDate) {
							return `<span id="theEditButton" class="action" ><i class='la la-pen'></i></span>`;
						} else {
							return `<span>
							${this.getDateTimeFromDate(param.data.startDate)}</span><span id="theEditButton" class="action" ><i class='la la-pen'></i></span>
              <span id="theRemoveButton" class="action" ><i class='la la-trash'></i></span>`;
						}

					}
				}
			},
			{ headerName: this.translate.instant('End date'), filter: 'agDateColumnFilter', field: 'endDate', editable: false,
				cellStyle: param => {
					if (this.activeTab.state == 'no_valid' && (param.data.startDate && param.data.endDate && new Date(param.data.startDate) > new Date(param.data.endDate))) {
						return { color: 'white', backgroundColor: '#7c1906' };
					}
					return null;
				},
				cellRenderer: param => {
					if (param.data) {
            setTimeout( () => {
              const theButton = param.eGridCell.querySelector('#theEditButton');
              if (theButton) {
                theButton.addEventListener('click', () => {
                  this.onEdit(param.data._id, 'endDate');
                });
              }
              const theRemoveButton = param.eGridCell.querySelector('#theRemoveButton');
              if (theRemoveButton) {
                theRemoveButton.addEventListener('click', () => {
                  this.onRemoveDate(param.data._id, 'endDate');
                });
              }
            }, 0);

						if (!param.data.endDate) {
							return `<span id="theEditButton" class="action" ><i class='la la-pen'></i></span>`;
						} else {
							return `<span>
							${this.getDateTimeFromDate(param.data.endDate)}</span><span id="theEditButton" class="action" ><i class='la la-pen'></i></span>
              <span id="theRemoveButton" class="action" ><i class='la la-trash'></i></span>`;
						}
					}
				}
			},
			{ headerName: this.translate.instant('Contact Date'), filter: 'agDateColumnFilter', field: 'contactDate', editable: false, sortable: false, minWidth: 150,
				cellRenderer: (param) => {
					if (param.data && param.data.company) {
						let result = `<span id="theCompanyContact">
						${param.data.company.contactDate?  this.getDateTimeFromDate(param.data.company.contactDate): ''}</span>`;

						if (!param.data.company.contactDate) {
							const contactButtonHtml = `<span id="theContactButton" class="action"><i class='la la-phone'></i></span>`;
							setTimeout( () => {
								const contactButton = param.eGridCell.querySelector('#theContactButton');
								if (contactButton) {
									contactButton.addEventListener('click', () => {
										this.contactCompany([param.data.company._id]);
									});
								}
							}, 0);
							result += contactButtonHtml;

							if (param.data.company.note && param.data.company.note.trim() != '') {
								const noteButtonHtml = `<span id="theNote" class="action"><i class='la la-eye'></i></span>`;
								setTimeout( () => {
									const noteButton = param.eGridCell.querySelector('#theNote');
									if (noteButton) {
										noteButton.addEventListener('click', () => {
											const modalRef = this.modal.open(MainModalComponent, { animation: false});
											modalRef.componentInstance.modalData = {
												text: 'Company Note',
												description: this.convertToPlain(param.data.company.note),
											};
										});
									}
								}, 0);
								result += noteButtonHtml;
							} else {
								const theEditNoteHtml = `<span id="theEditNote" class="action"><i class='la la-pen'></i></span>`;
								setTimeout( () => {
									const theEditNote = param.eGridCell.querySelector('#theEditNote');
									if (theEditNote) {
										theEditNote.addEventListener('click', () => {
											window.open(window.origin + '/admin/companies/edit/' + param.data.company._id);
										});
									}
								}, 0);
								result += theEditNoteHtml;
							}

						}

						return result;
					}
				}
			},
			{ headerName: this.translate.instant('Original Tags'), filter: 'agTextColumnFilter', field: 'originalTags', editable: false, minWidth: 200,
				cellRenderer: param => {
					if (param.data) {
						const tagsHtml = (param.data.originalTags || []).map( el => `<span
						class="badge badge-light">${el}</span>`).join(' ') + ' ' +
						(param.data.company ? (param.data.company.originalTags || []) : []).map( el => `<span
						class="badge rounded-0 badge-light-primary">${el}</span>`).join(' ');
						return tagsHtml;
					}
				}
			},
			{ headerName: this.translate.instant('Tags'), filter: 'agTextColumnFilter', field: 'tags', editable: false, minWidth: 200,
				cellRenderer: param => {
					if (param.data) {
						// const campaignTags = param.data.tags.map( el => {
						// 	return {
						// 		_id: el._id,
						// 		name: el.names[0].value
						// 	}
						// })
						const campaignTags = [];
						const companyTags = param.data.company ? param.data.company.tags.map( el => ({
								_id: el._id,
								name: tag2category(el),
								company: true
							})): [];
						const tags = unionBy(companyTags, campaignTags, '_id');
						const tagsHtml = tags.filter( el => el.company).map( (el, index) =>
							`<span class="badge rounded-0 badge-light-primary">${el.name}
							${index > 0 ? '<span class="action" id="theLeftButton" index="'+ index +'"><i class="la la-angle-left"></i></span>' : ''}
							${index < companyTags.length - 1? '<span class="action" id="theRightButton" index="'+ index +'"><i class="la la-angle-right"></i></span>': ''}
							</span>`).join(' ') + tags.filter( el => !el.company).map( (el, index) =>
							`<span class="badge badge-light">${el.name}
							</span>`
						).join(' ');
						setTimeout( () => {
							const leftButtons = param.eGridCell.querySelectorAll('#theLeftButton');
							if (leftButtons && leftButtons.length) {
								leftButtons.forEach ( leftButton => {
									const index = parseInt(leftButton.getAttribute('index'));
									leftButton.addEventListener('click', () => {
										this.onSwapTag(param.data, index, false);
									});
								});
							}
							const rightButtons = param.eGridCell.querySelectorAll('#theRightButton');
							if (rightButtons && rightButtons.length) {
								rightButtons.forEach( rightButton => {
									const index = parseInt(rightButton.getAttribute('index'));
									rightButton.addEventListener('click', () => {
										this.onSwapTag(param.data, index);
									});
								});
							}
						}, 0);
						return tagsHtml;
					}
				}
			},
			{ headerName: this.translate.instant('Description'), filter: 'agTextColumnFilter', field: 'description', editable: false,
				cellRenderer: param => {
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
						}, 0);

						return descriptionHtml + detailButtonHtml;
					}

				}
			},
			{ headerName: this.translate.instant('VideoUrl'), filter: 'agTextColumnFilter', field: 'videoUrl', editable: false,
			 	cellRenderer: param => {
					if (param.data && param.data.videoUrl) {
						const watchButtonHtml = `<span id="theVideoUrl" class="action"><i class='la la-eye'></i></span>`;
						const videoUrlHtml = `<span>
							${param.data.videoUrl? (param.data.videoUrl.substr(0,30) + (param.data.videoUrl.length > 30 ? '...': '')): ''}</span>`;

						setTimeout( () => {
							const watchButton = param.eGridCell.querySelector('#theVideoUrl');
							if (watchButton) {
								watchButton.addEventListener('click', () => {
									window.open(param.data.videoUrl);
								});
							}
						}, 0);

						return videoUrlHtml + watchButtonHtml;
					}
				}
			},
			{ headerName: this.translate.instant('Money Raised'), filter: false, field: 'raised', editable: false,
				cellStyle: param => {
					if (this.activeTab.state == 'no_valid' && param.data.raised != null && (param.data.raised > 8000000 || param.data.raised < 0)) {
						return { color: 'white', backgroundColor: '#7c1906' };
					}
					return null;
				},
				cellRenderer: param => {
					if (param.data && param.data.raised!= null) {
						const contentHtml = `<span>${this.addCommas(param.data.raised) + ' €'}</span>`;
						return contentHtml;
					}
				}
			},
			{ headerName: this.translate.instant('MinAmount'), filter: 'agTextColumnFilter', field: 'minimumGoal', editable: false,
				cellStyle: param => {
					if (this.activeTab.state == 'no_valid' && param.data.minimumGoal != null && ((param.data.maximumGoal != null && param.data.minimumGoal > param.data.maximumGoal) || param.data.minimumGoal < 0)) {
						return { color: 'white', backgroundColor: '#7c1906' };
					}
					return null;
				},
				cellRenderer: param => {
					if (param.data && param.data.minimumGoal) {
						return this.addCommas(param.data.minimumGoal) + ' €';
					}
				}},
			{ headerName: this.translate.instant('MaxAmount'), filter: 'agTextColumnFilter', field: 'maximumGoal', editable: false,
				cellStyle: param => {
					if (this.activeTab.state == 'no_valid' && param.data.maximumGoal != null && ((param.data.minimumGoal != null && param.data.minimumGoal > param.data.maximumGoal) || param.data.maximumGoal < 0)) {
						return { color: 'white', backgroundColor: '#7c1906' };
					}
					return null;
				},
				cellRenderer: param => {
					if (param.data && param.data.maximumGoal!= null) {
						return this.addCommas(param.data.maximumGoal) + ' €';
					}
				}},
			{ headerName: this.translate.instant('Number of Investors'),  field: 'investorCount', editable: false,
				cellStyle: param => {
					if (this.activeTab.state == 'no_valid' && param.data.investorCount != null && param.data.investorCount > 3000) {
						return { color: 'white', backgroundColor: '#7c1906' };
					}
					return null;
				},
				cellRenderer: param => {
					if (param.data && param.data.investorCount!= null) {
						const contentHtml = `<span>${this.addCommas(param.data.investorCount)}</span>`;
						return contentHtml;
					}
				}
			},
			{ headerName: this.translate.instant('Left Days'),  field: 'leftDays', editable: false,
				cellStyle: param => {
					if (this.activeTab.state == 'no_valid' && param.data.leftDays != null && param.data.leftDays < 0) {
						return { color: 'white', backgroundColor: '#7c1906' };
					}
					return null;
				},
				cellRenderer: param => {
					if (param.data && param.data.leftDays) {
						// return Math.max(param.data.leftDays, 0);
						return param.data.leftDays;
					}
				}
			},
			{
				headerName: this.translate.instant('Holding Time'),  field: 'holdingTime', editable: false,
				hide: intersection(this.selectedTypologies.map( el => el.key), ['real estate company', 'real estate lending', 'company lending', 'minibond']).length == 0,
				cellStyle: param => {
					if (this.activeTab.state == 'no_valid' && param.data.holdingTime != null && (param.data.holdingTime > 100 || param.data.holdingTime < 0)) {
						return { color: 'white', backgroundColor: '#7c1906' };
					}
					return null;
				},
			},
			{ headerName: this.translate.instant('Equity'), filter: 'agTextColumnFilter', field: 'equity', editable: false,
				hide: intersection(this.selectedTypologies.map( el => el.key), ['company equity']).length == 0,
				cellStyle: param => {
					if (this.activeTab.state == 'no_valid' && param.data.equity != null && (param.data.equity > 100)) {
						return { color: 'white', backgroundColor: '#7c1906' };
					}
					return null;
				},
				cellRenderer: param => {
					if (param.data && param.data.equity) {
						return this.addCommas(param.data.equity) + ' %';
					}
				}
			},
			{ headerName: this.translate.instant('ROI'), filter: 'agTextColumnFilter', field: 'roi', editable: false,
			hide: intersection(this.selectedTypologies.map( el => el.key), ['real estate company', 'real estate lending', 'company lending', 'minibond']).length == 0,
				cellRenderer: param => {
					if (param.data && param.data.roi) {
						return this.addCommas(param.data.roi) + ' %';
					}
				}
			},
			{ headerName: this.translate.instant('ROI annual'), filter: 'agTextColumnFilter', field: 'roiAnnual', editable: false,
			hide: intersection(this.selectedTypologies.map( el => el.key), ['real estate company', 'real estate lending', 'company lending', 'minibond']).length == 0,
				cellRenderer: param => {
					if (param.data && param.data.roiAnnual) {
						return this.addCommas(param.data.roiAnnual) + ' %';
					}
				}
			},
			{ headerName: this.translate.instant('PerMoneyEvaluation'), field: 'preMoneyEvaluation', editable: false,
				cellRenderer: param => {
					if (param.data && param.data.preMoneyEvaluation) {
						return this.addCommas(param.data.preMoneyEvaluation) + ' €';
					}
				}},
			{ headerName: this.translate.instant('MinimumInvestment'), field: 'minimumInvestment', editable: false,
				cellStyle: param => {
					if (this.activeTab.state == 'no_valid' && param.data.minimumInvestment != null && (param.data.minimumInvestment > 100000 || param.data.minimumInvestment < 0)) {
						return { color: 'white', backgroundColor: '#7c1906' };
					}
					return null;
				},
				cellRenderer: param => {
					if (param.data && param.data.minimumInvestment) {
						return this.addCommas(param.data.minimumInvestment) + ' €';
					}
				}},

			{ headerName: this.translate.instant('Logo'), filter: 'agTextColumnFilter', field: 'logo', editable: false,  },
			{ headerName: this.translate.instant('Background'), filter: 'agTextColumnFilter', field: 'background', editable: false,  },
			{ headerName: this.translate.instant('Crowdfunding Site'),  filter: 'agTextColumnFilter', field: 'link', editable: false,
				cellRenderer: (param) => {
					if (param.data && param.data.link) {
						return `<a href="${param.data.link}" target="_blank">${param.data.link}</a>`;
					}
				}
			},
			{ headerName: this.translate.instant('Detail Page'),  filter: 'agTextColumnFilter', field: 'systemTitle', editable: false,  minWidth: 200,
				cellRenderer: (param) => {
					if (param.data && param.data.systemTitle) {
						setTimeout( () => {
							const copyButton = param.eGridCell.querySelector('#theCopyButton');
							copyButton.addEventListener('click', () => {
								const el = document.createElement('textarea');
								el.value =  window.location.origin + '/crowdfunding/' + param.data.systemTitle;
								document.body.appendChild(el);
								const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
								if (iOS){
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
						return `<a>${window.location.origin + '/crowdfunding/' + param.data.systemTitle}</a>
							<span id="theCopyButton"
								class="action">
								<i class='la la-copy the-copy-button'></i></span>`;
					}
				}
			},

			{ headerName: this.translate.instant('Comingsoon start'), filter: 'agDateColumnFilter', field: 'comingSoonPeriod.startDate', editable: false,
				cellStyle: param => {
					if (this.activeTab.state == 'no_valid' && param.data.comingSoonPeriod && ((!param.data.comingSoonPeriod.startDate && param.data.comingSoonPeriod.endDate) || (param.data.comingSoonPeriod.startDate && param.data.comingSoonPeriod.endDate && new Date(param.data.comingSoonPeriod.startDate) > new Date(param.data.comingSoonPeriod.endDate)))) {
						return { color: 'white', backgroundColor: '#7c1906' };
					}
					return null;
				},
				cellRenderer: param => {
					if (param.data && param.data.comingSoonPeriod && param.data.comingSoonPeriod.startDate) {
						return this.getDateTimeFromDate(param.data.comingSoonPeriod.startDate);
					}
				}
			},
			{ headerName: this.translate.instant('Comingsoon end'), filter: 'agDateColumnFilter', field: 'comingSoonPeriod.endDate', editable: false,
				cellStyle: param => {
					if (this.activeTab.state == 'no_valid' && param.data.comingSoonPeriod && (param.data.comingSoonPeriod.startDate && param.data.comingSoonPeriod.endDate && new Date(param.data.comingSoonPeriod.startDate) > new Date(param.data.comingSoonPeriod.endDate))) {
						return { color: 'white', backgroundColor: '#7c1906' };
					}
					return null;
				},
				cellRenderer: param => {
					if (param.data && param.data.comingSoonPeriod && param.data.comingSoonPeriod.endDate) {
						return this.getDateTimeFromDate(param.data.comingSoonPeriod.endDate);
					}
				},
			},
			{ headerName: this.translate.instant('Updated At'), filter: 'agDateColumnFilter', field: 'updatedAt', editable: false,
				cellRenderer: param => {
					if (param.data && param.data.updatedAt) {
						return this.getDateTimeFromDate(param.data.updatedAt);
					}
				},
				cellClass: isMobile? 'custom-cell' :'last-column-cell custom-cell'
			},
			{
				action: 'MERGE',	width: 42, fixed: true, pinned: isMobile? null: 'right', editable: false, sortable: false, hide: !(this.activeTab && this.activeTab.state == 'duplicated'),
				cellRenderer:  param => {
					if (param.data) {
						return `<i class="fa fa-code-branch"></i>`;
					}
				}
			},
			{
				action: 'ENTER_IN',	width: 42, fixed: true, pinned: isMobile? null: 'right', editable: false, sortable: false,
				cellRenderer:  param => {
					if (param.data) {
						return `<a target="_blank" href="${window.location.origin + '/crowdfunding/' + param.data.systemTitle}"><i class="fa fa-link" style="color: blue"></i></a>`;
					}
				}
			},
			{
				action: 'ENTER',	width: 42, fixed: true, pinned: isMobile? null: 'right', editable: false, sortable: false,
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
			// {
			// 	action: 'EDIT',	width: 42, fixed: true, pinned: 'right', editable: false, sortable: false,
			// 	cellRenderer:  param => {
			// 		return '<i class="la la-pen"></i>';
			// 	}
			// },
			{
				action: 'SUSPEND',	width: 42, fixed: true, pinned: isMobile? null: 'right', editable: false, sortable: false,
				cellRenderer:  param => {
					if (param.data) {
						if (this.activeTab && this.activeTab.title != 'Suspended') {
							return `<i class="fa fa-pause-circle"></i>`;
						} else {
							return `<i class="fa fa-play-circle"></i>`;
						}

					}
				},
				tooltip: param => {
					if (this.activeTab && this.activeTab.title != 'Suspended') {
						return `Suspend`;
					} else {
						return `Resume`;
					}
				}
			},
			// {
			// 	action: 'DELETE',	width: 42, fixed: true, pinned: isMobile? null: 'right', editable: false, sortable: false,
			// 	tooltip: params => {
			// 		if (params && params.data){
			// 			return this.translate.instant('COMMON.GENERAL.DELETE');
			// 		}
			// 	},
			// 	cellRenderer (params) {
			// 		if (params.data){
			// 			if (params.data.notRemovable){
			// 				return '';
			// 			} else {
			// 				return '<i class="la la-trash"></i>';
			// 			}
			// 		}
			// 	},
			// 	cellClass: isMobile? 'last-column-cell custom-cell': 'custom-cell'
			// }
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
			this.loadingSubject.next(false);
			return;
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
		if (!Object.keys(payload.filterModel).find( key => key == 'status')) {
			payload.filterModel.status = {
				filterType: 'ne',
				value: null
			};
		}
		if (Object.keys(payload.filterModel).find( key => key == 'source')) {
			payload.filterModel['source.name'] = payload.filterModel.source;
			delete payload.filterModel.source;
		}
		if (Object.keys(payload.filterModel).find( key => key == 'company')) {
			payload.filterModel['company.name'] = payload.filterModel.company;
			delete payload.filterModel.company;
		}
		if (Object.keys(payload.filterModel).find( key => key == 'contactDate')) {
			payload.filterModel['company.contactDate'] = payload.filterModel.contactDate;
			delete payload.filterModel.contactDate;
		}
		if (Object.keys(payload.filterModel).find( key => key == 'tags')) {

			let tags = [];
			try {
				tags = await this.aliasService.getTagIdsByName(payload.filterModel.tags.filter);
			} catch (error) {

			}

			payload.filterModel.tags = {
				or: true,
				filter: [[{ key: 'company.tags', filterType: 'set', values: tags, isObject: true}], [{ key: 'tags', filterType: 'set', values: tags,isObject: true}]]
				// filter: [[{ key: 'company.tags', ...payload.filterModel.tags}]]
			};
		}
		if (Object.keys(payload.filterModel).find( key => key == 'originalTags')) {
			payload.filterModel.originalTags = {
				or: true,
				filter: [[{ key: 'company.originalTags', ...payload.filterModel.originalTags}], [{ key: 'originalTags', ...payload.filterModel.originalTags}]]
			};
		}
		payload.filterModel = {
			...payload.filterModel,
			...this.activeTab.filter
		};

		// payload.filterModel.typology = {
		// 	filterType: 'set',
		// 	values: this.selectedTypologies.map(el => el.key)
		// };

		payload.filterModel['source.configs.involvedCampaignCountries'] = {
			filterType: 'set',
			values: this.selectedCountries.map(el => el.key)
		};


		if (this.activeTab.state == 'suspended') {
			this.tableCtrl.showExtraAction = false;
		} else {
			this.tableCtrl.showExtraAction = true;
		}
		if (this.activeTab.state == 'duplicated') {
			if (payload.sortModel && !payload.sortModel.find( e => e.colId && e.colId.indexOf('name') >= 0)) {
				payload.sortModel.push({ colId: 'name', sort: 'asc'});
			}
		} else {
			if (payload.sortModel && !payload.sortModel.find( e => e.colId && e.colId.indexOf('status') >= 0)) {
				payload.sortModel.push({ colId: 'status', sort: 'asc'});
			}
			if (payload.sortModel && !payload.sortModel.find( e => e.colId && e.colId.indexOf('name') >= 0)) {
				payload.sortModel.push({ colId: 'name', sort: 'asc'});
			}
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

    payload.filterModel.createdAt = {
      filterType: 'gte', value: startTime, isDate: true
    };
    payload.filterModel.createdAt_ = {
      or: true,
      filter: [[{ key: 'createdAt',  filterType: 'lt', value: endTime, isDate: true}]]
    };

		if (this.activeTab.state == 'no_valid') {
			payload.filterModel.status = {
				filterType: 'set',
				values: ['1_ongoing', '2_comingsoon']
			};
		}

		this.activePayload = payload;
		console.info('activePayload : ', this.activePayload);

		try {
			const res = this.activeTab.state == 'duplicated' ? await this.campaignService.getDuplicated(payload, {
				company: 'name tags originalTags campaigns physicalLocation fiscalCode subscribedCapitalRange type contactDate note',
				source: 'name'
			}, this.withCheckLink) : this.activeTab.state == 'no_valid' ? await this.campaignService.noValid(payload, {
				company: 'name tags originalTags campaigns physicalLocation fiscalCode subscribedCapitalRange type contactDate note',
				source: 'name'
			}) : await this.campaignService.get(payload, {
				company: 'name tags originalTags campaigns physicalLocation fiscalCode subscribedCapitalRange type contactDate note',
				source: 'name'
			});

			console.info('res == ', res);

			this.activePayload.startRow = 0;
			this.activePayload.endRow = res.totalCount;
			this.activePayload.pageSize = res.totalCount;
			
			result = new QueryResultsModel(res.items, res.totalCount);
			// this.countries = this._countries.filter(el => (res.countries && res.countries.includes(el.key)));
			// if (this.selectedCountries.length) {
			// 	this.selectedCountries = intersectionWith(this.selectedCountries, this.countries, (a, b) => a.key == b.key);
			// } else if (this.countries.length) {
			// 	this.selectedCountries = [this.countries[0]];
			// } else {
			// 	this.selectedCountries = [];
			// }

			// if (this.selectedTypologies.length) {
			// 	this.selectedTypologies = intersectionWith(this.selectedTypologies, this.typologies, (a, b) => a.key == b.key);
			// } else if (this.typologies.length) {
			// 	this.selectedTypologies = [this.typologies[0]];
			// } else {
			// 	this.selectedTypologies = []
			// }

			if (!this.filterSources.length) {
				payload.endRow = res.totalCount;
				payload.pageSize = res.totalCount;
				
				const totalres = this.activeTab.state == 'duplicated' ? await this.campaignService.getDuplicated(payload, {
					company: 'name tags originalTags campaigns physicalLocation fiscalCode subscribedCapitalRange type contactDate note',
					source: 'name'
				}, this.withCheckLink) : this.activeTab.state == 'no_valid' ? await this.campaignService.noValid(payload, {
					company: 'name tags originalTags campaigns physicalLocation fiscalCode subscribedCapitalRange type contactDate note',
					source: 'name'
				}) : await this.campaignService.get(payload, {
					company: 'name tags originalTags campaigns physicalLocation fiscalCode subscribedCapitalRange type contactDate note',
					source: 'name'
				});
				
				totalres.countries.forEach(element => {
					const exis = this.filterCountries.findIndex(eel => eel.value == element) > -1;
					if (!exis) {
						this.filterCountries.push({
							label: element.charAt(0).toUpperCase() + element.slice(1),
							value: element
						});
					}
				});

				this.filterSources.push({
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
				});
				this.comService.filterOptions.next(this.filterSources);
			}

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
	
	convertToPlain(html){
		const tempDivElement = document.createElement('div');
		tempDivElement.innerHTML = html;
		return tempDivElement.textContent || tempDivElement.innerText || '';
	}

	onAction(param) {

		const ids = param.payload;

		if (!['ENTER', 'ENTER_DETAIL'].includes(param.type) && !this.checkPermission(ids)) {return;}

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
		if (param.type == 'SUSPEND') {
			this.onSuspendByIds(selectedIds);
		} else if (param.type == 'DELETE') {
			this.onDeleteByIds(selectedIds);
		} else if (param.type == 'RESTORE_SOURCE') {
			this.restoreSourceByIds(selectedIds);
		} else if (param.type == 'ENTER') {
			const node = this.tableCtrl.gridApi.getRowNode(ids[0]);
			if (node && node.data && node.data.link) {
				window.open(node.data.link);
			}
		}  else if (param.type == 'ENTER_DETAIL') {
			const node = this.tableCtrl.gridApi.getRowNode(ids[0]);
			if (node && node.data && node.data.systemTitle) {
				this.router.navigate(['/crowdfunding/' + node.data.systemTitle]);
			}
		} else if (param.type == 'CONFIRM') {
			this.confirmCompanyById(selectedIds);
		} else if (param.type == 'MERGE') {
			this.onMerge(selectedIds[0]);
		} else if (param.type == 'EDIT') {
			const link = window.location.origin + '/admin/campaigns/edit/' + ids[0];
			window.open(link);
		} else if (param.type == 'ADDRESS') {
			this.updateLocationByIds(selectedIds);
		}
	}
	onClickCompanyEdit(campaign){

		if (!this.checkPermission([campaign._id])) {return;}

		const modalRef = this.modal.open(CompanySearchDialog, { animation: false});
		modalRef.componentInstance.campaign = campaign;

		modalRef.result.then ( async result => {
			if (result) {
				try {
					this.keptPage = Math.max (0, this.tableCtrl.gridApi.paginationGetCurrentPage());
					this.tableCtrl.onDeSelectAllButton();
					await this.loadState();
					this.tableCtrl.willRefreshTable.next('DATA');
				} catch (error) {
					console.log(error);
				}

			}
		});
	}
	onClickCompanyOverview(company){
		if (company) {
			const modalRef = this.modal.open(MainModalComponent, { animation: false});

			modalRef.componentInstance.modalData = {
				key_values: ['name', 'physicalLocation', 'fiscalCode', 'subscribedCapitalRange', 'type.names.0.value' ].map( key => ({
						key: key.split('.')[0],
						value: objectPath.get(company, key)
					}))
				,
				yes: 'Edit'
			};
			const subscr = modalRef.closed.subscribe( result => {
				if (result) {
					window.open(window.origin + '/admin/companies/edit/' + company._id);
				}
				setTimeout(() => subscr.unsubscribe(), 100);
			});
		}
	}
	async onClickCompanyRemove(campaignId, campaignName){

		if (!this.checkPermission([campaignId])) {return;}

		const _description = 'Are you sure to remove company from campaign?';

		const modalRef = this.modal.open(MainModalComponent, { animation: false});
		modalRef.componentInstance.modalData = {
			text: _description,
			yes: 'GENERAL.YES',
		};

		const subscr = modalRef.closed.subscribe ( async e => {
			if (e) {
				if (campaignId) {
					try {
						const res = await this.campaignService.update({_id: campaignId, companyConfirmed: true, company: null});
						if (!res) {throw {};}
						const node = this.tableCtrl.gridApi.getRowNode(campaignId);
						if (node) {
							node.data.companyConfirmed = true;
							node.data.company = null;
							this.tableCtrl.willRefreshTable.next('ROWS');
						}
					} catch (error) {
					}

				}
			}
			setTimeout(() => subscr.unsubscribe(), 100);
		});

	}
	loadCampaignsList() {

	}

	editCampaign(id) {
		this.router.navigate(['../edit', id], { relativeTo: this.activatedRoute });
	}
	createCampaign() {
		this.router.navigateByUrl('/campaigns/add');
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
	async onDeleteByIds(ids) {
		const _description = 'Are you sure to permanently delete these campaign?';
		const _waitDescription = 'Campaigns are deleting...';
		const _success = `Campaigns have been deleted`;

		const modalRef = this.modal.open(MainModalComponent, { animation: false});
		modalRef.componentInstance.modalData = {
			text: _description,
			yes: 'GENERAL.YES',
		};

		const subscr = modalRef.closed.subscribe ( async e => {
			if (e) {
				const res  = await this.campaignService.deleteByIds(ids);
				if (res) {
					this.toastService.show(this.translate.instant(_success));
					this.keptPage = Math.max (0, this.tableCtrl.gridApi.paginationGetCurrentPage() - Math.floor(ids.length / this.tableCtrl.gridApi.paginationGetPageSize()));
					this.tableCtrl.onDeSelectAllButton();
					await this.loadState();
					this.tableCtrl.willRefreshTable.next('DATA');
				}
			}
			setTimeout(() => subscr.unsubscribe(), 100);
		});
	}
	async restoreSourceByIds(ids) {
		const _description = 'Are you sure to restore source for these campaigns?';
		const _success = `Success`;

		const modalRef = this.modal.open(MainModalComponent, { animation: false});
		modalRef.componentInstance.modalData = {
			text: _description,
			yes: 'GENERAL.YES',
		};

		const subscr = modalRef.closed.subscribe ( async e => {
			if (e) {
				const res  = await this.campaignService.restoreSourceByIds(ids);
				if (res) {
					this.toastService.show(this.translate.instant(_success));
					this.keptPage = Math.max (0, this.tableCtrl.gridApi.paginationGetCurrentPage() - Math.floor(ids.length / this.tableCtrl.gridApi.paginationGetPageSize()));
					this.tableCtrl.onDeSelectAllButton();
					await this.loadState();
					this.tableCtrl.willRefreshTable.next('DATA');
				}
			}
			setTimeout(() => subscr.unsubscribe(), 100);
		});
	}
	async onMerge(id) {
		try {

			const res = await this.campaignService.getDuplicatedById(id);
			if (!res) {throw {};}

			const modalRef = this.modal.open(CheckCampaignsDialog, { animation: false, size: 'xl'});
			modalRef.componentInstance.items = [res.find( el => el._id == id), ...res.filter( el => el._id != id)];
			modalRef.componentInstance.tableCtrl.disabledSelectRowIds = [id];

			const subscr = modalRef.closed.subscribe( async r => {
				try {
					if (r) {
						const ids = r.ids;
						await this.campaignService.mergeByIds([...ids, id], id);
						this.toastService.show(this.translate.instant('Merged successfully'));
						this.keptPage = Math.max (0, this.tableCtrl.gridApi.paginationGetCurrentPage() - Math.floor(ids.length / this.tableCtrl.gridApi.paginationGetPageSize()));
						this.tableCtrl.onDeSelectAllButton();
						await this.loadState();
						this.tableCtrl.willRefreshTable.next('DATA');
					}
				} catch (error) {

				}
				setTimeout(() => subscr.unsubscribe(), 100);
			});

		} catch (error) {

		}
	}
	async updateLocationByIds(ids) {
		const _description = 'Are you sure to update location of these campaigns?';
		const _waitDescription = 'Location is updating...';
		const _success = 'Locations have been updated';

		const modalRef = this.modal.open(MainModalComponent, { animation: false});
		modalRef.componentInstance.modalData = {
			text: _description,
			yes: 'GENERAL.YES',
		};

		const subscr = modalRef.closed.subscribe ( async e => {
			if (e) {
				const res  = await this.campaignService.generateLocationByIds(ids);
				if (res) {
					this.toastService.show(this.translate.instant(_success));
					this.keptPage = Math.max (0, this.tableCtrl.gridApi.paginationGetCurrentPage() - Math.floor(ids.length / this.tableCtrl.gridApi.paginationGetPageSize()));
					this.tableCtrl.onDeSelectAllButton();
					await this.loadState();
					this.tableCtrl.willRefreshTable.next('DATA');
				}
			}
			setTimeout(() => subscr.unsubscribe(), 100);
		});
	}

	async confirmCompanyById(ids, data = null) {
		if (!this.checkPermission(ids)) {return;}

		const _description = 'Are you sure to confirm these campaigns?';
		const _waitDescription = 'Campaigns are confirming...';
		const _success = 'Campaigns have been confirmed';

		const modalRef = this.modal.open(MainModalComponent, { animation: false});
		modalRef.componentInstance.modalData = {
			text: _description,
			yes: 'GENERAL.YES',
			notify: true,
			withNotify: true
		};

		const subscr = modalRef.closed.subscribe ( async e => {
			if (e) {
				const res  = await this.campaignService.confirmCompany({ids, notify: e.notify});
				if (res) {
					this.toastService.show(this.translate.instant(_success));
					this.keptPage = Math.max (0, this.tableCtrl.gridApi.paginationGetCurrentPage() - Math.floor(ids.length / this.tableCtrl.gridApi.paginationGetPageSize()));
					this.tableCtrl.onDeSelectAllButton();
					await this.loadState();

					if (data) {
						data.companyConfirmed = true;
						this.tableCtrl.willRefreshTable.next('ROWS');
					} else {
						this.tableCtrl.willRefreshTable.next('DATA');
					}

					this.cdr.detectChanges();
				}
			}

			setTimeout(() => subscr.unsubscribe(), 100);
		});
	}

	async onClickCompanyReScrap(id) {
		const _description = 'Are you sure to re-scrap this company?';
		const _waitDescription = 'Company is re-scraping...';
		const _success = 'Company has been re-scrapped';

		const modalRef = this.modal.open(MainModalComponent, { animation: false});
		modalRef.componentInstance.modalData = {
			text: _description,
			yes: 'GENERAL.YES',
		};

		const subscr = modalRef.closed.subscribe ( async e => {
			if (e) {
				const res  = await this.companyService.reScrapCompanies([id]);
				if (res) {
					this.toastService.show(this.translate.instant(_success));
					this.keptPage = Math.max (0, this.tableCtrl.gridApi.paginationGetCurrentPage());
					this.tableCtrl.onDeSelectAllButton();
					await this.loadState();
					this.tableCtrl.willRefreshTable.next('DATA');
				}
			}
			setTimeout(() => subscr.unsubscribe(), 100);
		});
	}
	async contactCompany(ids) {
		const _description = 'Are you sure to set these companies as contacted?';
		const _waitDescription = 'Companies are contacting...';
		const _success = 'Companies have been contacted';


		const modalRef = this.modal.open(MainModalComponent, { animation: false});
		modalRef.componentInstance.modalData = {
			text: _description,
			yes: 'GENERAL.YES',
		};

		const subscr = modalRef.closed.subscribe ( async e => {
			if (e) {
				const res  = await this.companyService.updateByIds({ids, data: { contactDate: new Date()} });
				if (res) {
					this.toastService.show(this.translate.instant(_success));
					this.keptPage = Math.max (0, this.tableCtrl.gridApi.paginationGetCurrentPage() - Math.floor(ids.length / this.tableCtrl.gridApi.paginationGetPageSize()));
					this.tableCtrl.onDeSelectAllButton();
					await this.loadState();
					this.tableCtrl.willRefreshTable.next('DATA');
				}
			}
			setTimeout(() => subscr.unsubscribe(), 100);
		});
	}
	async onSuspendByIds(ids) {
		const isSuspended = this.activeTab && this.activeTab.state == 'suspended';
		const _description = isSuspended ? 'Are you sure to resume scraping for these campaigns? ': 'Are you sure to suspend scraping for these campaigns?';
		const _waitDescription = isSuspended ? 'Campaigns are resuming': 'Campaigns are suspending...';
		const _success = isSuspended ? 'Campaigns have been resumed' : `Campaigns have been suspended`;

		const modalRef = this.modal.open(MainModalComponent, { animation: false});
		modalRef.componentInstance.modalData = {
			text: _description,
			yes: 'GENERAL.YES',
		};

		const subscr = modalRef.closed.subscribe ( async e => {
			if (e) {
				const res  = await this.campaignService.updateByIds({ids, data: { deleted: !isSuspended} });
				if (res) {
					this.toastService.show(this.translate.instant(_success));
					this.keptPage = Math.max (0, this.tableCtrl.gridApi.paginationGetCurrentPage() - Math.floor(ids.length / this.tableCtrl.gridApi.paginationGetPageSize()));
					this.tableCtrl.onDeSelectAllButton();
					await this.loadState();
					this.tableCtrl.willRefreshTable.next('DATA');
				}
			}
			setTimeout(() => subscr.unsubscribe(), 100);
		});
	}
	onClickTab(item) {
		this.activeTab = item;

		this.extraActions.find(el => el.type == 'CONFIRM').disabled = this.activeTab.state != 'unconfirmed';
		this.extraActions.find(el => el.type == 'RESTORE_SOURCE').disabled = this.activeTab.state != 'no_source';
    if (this.activeTab.state == 'suspended') {
      this.extraActions.find(el => el.type == 'SUSPEND').text = 'Restore'
    } else {
      this.extraActions.find(el => el.type == 'SUSPEND').text = 'Suspend'
    }
		if (!(this.cdr as ViewRef).destroyed){
			this.cdr.detectChanges();
		}
		this.countries = [...this._countries];
		if (this.selectedCountries.length) {
			this.selectedCountries = intersectionWith(this.selectedCountries, this.countries, (a, b) => a.key == b.key);
		} else if (this.countries.length) {
		} else {
			this.selectedCountries = [];
		}

		if (this.selectedTypologies.length) {
			this.selectedTypologies = intersectionWith(this.selectedTypologies, this.typologies, (a, b) => a.key == b.key);
		} else if (this.typologies.length) {
			this.selectedTypologies = [this.typologies[0]];
		} else {
			this.selectedTypologies = [];
		}

		sessionStorage.removeItem('sourcefilter');
		this.filterSources = [];
		this.filterCountries = [];

		this.defineColumns();
		this.tableCtrl.onDeSelectAllButton();
		this.tableCtrl.willRefreshTable.next('DATA');
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
				this.activeTab = this.tabs.find( el => el.state == active);
			}
			const res = await this.campaignService.getCountByState(this.typologies.map( el => el.key), [], this.withCheckLink);
			if (!res) {throw {};}

			each( res, (value, key) => {
				const category = this.tabs.find( el => el.state == key);
				if (category) {
					category.count = value;
				}
			});
			this.duplicatedIds = res.duplicatedIds;
			this.deletedIds = res.deletedIds;

			if (!this.activeTab || this.activeTab.count == 0) {
				this.activeTab = this.tabs[0];
			}
			this.extraActions.find(el => el.type == 'CONFIRM').disabled = this.activeTab.state != 'unconfirmed';
			this.extraActions.find(el => el.type == 'RESTORE_SOURCE').disabled = this.activeTab.state != 'no_source';
			if (!(this.cdr as ViewRef).destroyed){
				this.cdr.detectChanges();
			}
		} catch (error) {
			console.log(error);
		}
		this.loadingSubject.next(false);
	}
	async onSwapTag(data, index, isNext = true) {
		const temp = data.company.tags[index];
		if (isNext) {
			if (index < data.company.tags.length - 1) {
				data.company.tags[index] = data.company.tags[index + 1];
				data.company.tags[index + 1] = temp;
			}
		} else {
			if (index > 0) {
				data.company.tags[index] = data.company.tags[index - 1];
				data.company.tags[index - 1] = temp;
			}
		}
		this.tableCtrl.willRefreshTable.next('ROWS');

		this.loadingSubject.next(true);
		try {

			await this.companyService.update({_id: data.company._id, tags: data.company.tags.map(el => el._id)});

		} catch (error) {

		}
		this.loadingSubject.next(false);
	}
	onEdit(id, key) {

		if (!this.checkPermission([id])) {return;}

		const modalRef = this.modal.open(DatePickerDialog, { animation: false, size: 'md', centered: true});
		const subscr = modalRef.closed.subscribe( async res => {
			try {
				if (!res) {throw '';}
				await this.campaignService.update({
					_id: id,
					[key]: res
				});
				this.keptPage = Math.max (0, this.tableCtrl.gridApi.paginationGetCurrentPage() - Math.floor(1 / this.tableCtrl.gridApi.paginationGetPageSize()));
				this.tableCtrl.onDeSelectAllButton();
				await this.loadState();
				this.tableCtrl.willRefreshTable.next('DATA');
			} catch (error) {
			}
			setTimeout(() => subscr.unsubscribe(), 10);
		});
	}
  async onRemoveDate(id, key) {

		if (!this.checkPermission([id])) {return;}

    try {
      await this.campaignService.update({
        _id: id,
        [key]: null
      });
      this.keptPage = Math.max (0, this.tableCtrl.gridApi.paginationGetCurrentPage() - Math.floor(1 / this.tableCtrl.gridApi.paginationGetPageSize()));
      this.tableCtrl.onDeSelectAllButton();
      await this.loadState();
      this.tableCtrl.willRefreshTable.next('DATA');
    } catch (error) {
    }
	}
	onSelectCountry() {
		sessionStorage.setItem('selectedCountries', JSON.stringify(this.selectedCountries));
		sessionStorage.removeItem('sourcefilter');
		this.filterSources = [];
		this.filterCountries = [];

		this.defineColumns();
		this.tableCtrl.willRefreshTable.next('DATA');
	}
	onSelectTypology() {
		this.defineColumns();
		this.tableCtrl.willRefreshTable.next('DATA');
	}

	checkPermission(ids) {
		const selectedCampaigns = ids.map( id => {
			const node = this.tableCtrl.gridApi.getRowNode(id);
			if (node) {return node.data;}
			return this.tableCtrl.originSelectedRows.find(el => el._id == id);
		}).filter( el => el);
		try {
			if (selectedCampaigns.length == 0) {throw {};}
      if (this.writable.admin) {return true;}
			if (!this.writable.allowed) {throw {};}
			if (selectedCampaigns.filter( el => !this.writable.typologies.includes(el.typology)).length) {throw {};}
			// if (selectedCampaigns.filter( el => el.country && !this.writable.countries.includes(el.country)).length) {throw {};}
			return true;
		} catch (error) {

		}
		this.toastService.show('You dont have permission for this action!');
		return false;
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
		if (!end.isAfter(start)) {throw {};}
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
			this.periodEnd = moment(this.periodStart).endOf('year').toDate();
		} else if (this.periodType == 'month') {
			this.periodEnd = moment(this.periodStart).endOf('month').toDate();
		}
		this.tableCtrl.willRefreshTable.next('DATA');
	}

	/**
	 * 
	 */
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

			const data = await this.campaignService.downloadCampaignXLS(this.activePayload, {
				startTime,
				endTime,
				ids: this.tableCtrl.originSelectedRowIds,
				company: 'name tags originalTags campaigns physicalLocation fiscalCode subscribedCapitalRange type contactDate note',
				source: 'name'
			});

			if (!data) { throw {}; }
			const blob = new Blob([data], { type: 'application/vnd.ms-excel' });
			if (this.periodType == 'none') {
				saveAs(blob, `${this.selectedCountries.map(el => el.key).join('_')},${this.activePayload.filterModel.typology ? this.activePayload.filterModel.typology.values.join('_') : this.filterTypologies.map(el =>el.value).join('_')}(entire).xlsx`);
			} else {
				saveAs(blob, `${this.selectedCountries.map(el => el.key).join('_')},${this.activePayload.filterModel.typology ? this.activePayload.filterModel.typology.values.join('_') : this.filterTypologies.map(el =>el.value).join('_')}(${this.getTimeFromDate(this.periodStart, 'day')}-${this.getTimeFromDate(this.periodEnd, 'day')}).xlsx`);
			}			

		} catch (error) {

		}
		this.loadingSubject.next(false);
	}

	getTimeFromDate(param, format = 'datetime'): string {
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
}
