import { Router } from '@angular/router';
import { ToastService } from './../../common/toast.service';
import { AdvertisementService } from './../../common/advertisement.service';
import { campaign2htmlData, tag2category } from 'src/app/pages/common/common';
import { CampaignService } from './../../common/campaign.service';
import { cloneDeep, each } from 'lodash';
import { CountryService } from './../../common/country.service';
import { AuthService } from './../../../modules/auth/_services/auth.service';
import { SplashScreenService } from './../../../_metronic/partials/layout/splash-screen/splash-screen.service';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewRef, ViewChild, ApplicationRef } from '@angular/core';
import * as moment from 'moment';

@Component({
  selector: 'app-location',
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.scss']
})
export class LocationComponent implements OnInit, OnDestroy {

  @ViewChild('map', {static: false}) map;
  selectedMarkerCampaign;
	selectedMarkerCampaigns;
	selectedMarkerCampaignsStartIndex = 0;

  loadingSubject = new BehaviorSubject<boolean>(true);
	loading$: Observable<boolean>;
  isEmptyTable = false;

  activeCampaignQuery: any = {
		filterModel: {},
		pageSize: 100000,
		sortModel: [],
		startRow: 0,
		campaigns: [],
		curIndex: 0,

		default: {
			filterModel: {
				status: { filterType: 'set', values: ['1_ongoing', '2_comingsoon']},
				disabled: {
					filterType: 'ne',
					value: true
				},
				deleted: {
					filterType: 'ne',
					value: true
				}
			},
			sortModel: [{ colId: 'leftDays', sort: 'asc'}, { colId: 'description', sort: 'desc'}]
		}
	};

  wallets;
  user;
  locale = 'it-IT';

  unsubscribe: Subscription[] = [];

	_countries = [
		// {key: 'europe', title: 'Europe'},
		{key: 'italy', title: 'Italy'},
		{key: 'france', title: 'France'},
		{key: 'spain', title: 'Spain'},
		{key: 'german', title: 'German'}
	];
	_selectedCountries = [
		{key: 'italy', title: 'Italy'}
	];
  countries: any[] = [];  
	selectedCountries = [];
	country = 'italy';
  
  categories: any[] = [];
	selectedCategories: any[] = [];

  sources: any[] = [];
	selectedSources: any[] = [];

  typologies: any[] = [
    { title: 'company equity', key: 'company equity' },
		{ title: 'company lending', key: 'company lending' },
		{ title: 'real estate equity', key: 'real estate equity' },
		{ title: 'real estate lending', key: 'real estate lending' },
		{ title: 'minibond', key: 'minibond' }
  ];
  typology: any;
	selectedTypologies: any[] = [
		{ title: 'company equity', key: 'company equity' },
		{ title: 'company lending', key: 'company lending' }
	];

	statuses = [
		{ title: 'ongoing', key: '1_ongoing' },
		{ title: 'comingsoon', key: '2_comingsoon' },
		{ title: 'closed funded', key: '3_funded' },
		{ title: 'close not funded', key: '4_closed' },
		{ title: 'closing', key: '5_extra' },
		{ title: 'refunded', key: '6_refunded' },
	];
	selectedStatus = [
		{ title: 'ongoing', key: '1_ongoing' },
		{ title: 'comingsoon', key: '2_comingsoon' },
	];

	periodType = 'month';
	periodStart: Date = new Date((new Date()).getFullYear(), (new Date()).getMonth(), 1);
	periodEnd: Date = new Date((new Date()).getFullYear() + 1, (new Date()).getMonth() + 1, 0);
	periodRange: Date[] = [new Date((new Date()).getFullYear(), (new Date()).getMonth(), 1),
	new Date((new Date()).getFullYear() + 1, (new Date()).getMonth() + 1, 0)];

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

	showGroup = true;
	availableRegions: any[] = [];
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

	selectedGroups = [];


	allEUs = [
		{key: 'austria', title: 'Austria'},
		{key: 'belgium', title: 'Belgium'},
		{key: 'bulgaria', title: 'Bulgaria'},
		{key: 'croatia', title: 'Croatia'},
		{key: 'cyprus', title: 'Cyprus'},
		{key: 'czech Republic', title: 'Czech Republic'},
		{key: 'denmark', title: 'Denmark'},
		{key: 'estonia', title: 'Estonia'},
		{key: 'finland', title: 'Finland'},
		{key: 'france', title: 'France'},
		{key: 'german', title: 'German'},
		{key: 'greece', title: 'Greece'},
		{key: 'hungary', title: 'Hungary'},
		{key: 'ireland', title: 'Ireland'},
		{key: 'italy', title: 'Italy'},
		{key: 'latvia', title: 'Latvia'},
		{key: 'lithuania', title: 'Lithuania'},
		{key: 'luxembourg', title: 'Luxembourg'},
		{key: 'malta', title: 'Malta'},
		{key: 'netherlands', title: 'Netherlands'},
		{key: 'poland', title: 'Poland'},
		{key: 'portugal', title: 'Portugal'},
		{key: 'romania', title: 'Romania'},
		{key: 'slovakia', title: 'Slovakia'},
		{key: 'slovenia', title: 'Slovenia'},
		{key: 'spain', title: 'Spain'},
		{key: 'sweden', title: 'Sweden'}
	];

	// @ViewChild('typologySelector', {static: true}) typologySelector;

  constructor(
    private splashScreenService: SplashScreenService,
    private cdr: ChangeDetectorRef,
    private auth: AuthService,
    private countryService: CountryService,
    private campaignService: CampaignService,
    private advertisementService: AdvertisementService,
		private toastService: ToastService,
		private router: Router,
		private apr: ApplicationRef
  ) { 
    this.loadingSubject = this.splashScreenService.loadingSubject;
		this.loading$ = this.loadingSubject.asObservable();
  }

  async ngOnInit() {
		// this.typologySelector.registerOnChange( (value) => {
		// 	this.typology = value;
		// 	console.info('typology == ', value);
		// });

		this.availableRegions = [...this.itRegions];

		this.countries = this._countries;
		this.selectedCountries = this._selectedCountries;

		// await this.loadCountries();

    this.unsubscribe.push(this.auth.currentUserSubject.subscribe ( user => {
			this.user = user;
			console.info('user : ', user);
			this.cdr.detectChanges();
			this.init();
		}));

    this.unsubscribe.push(this.loadingSubject.subscribe( _incomingValue => {
			if (!_incomingValue) {
				setTimeout(async () => {
					this.cdr.markForCheck();
				});
			}
		}));
  }

  ngOnDestroy(): void {
		this.unsubscribe.forEach ( u => u.unsubscribe());
	}

  getQueryParam(name, url = window.location.href) {
		name = name.replace(/[\[\]]/g, '\\$&');
		const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
				const results = regex.exec(url);
		if (!results) {return null;}
		if (!results[2]) {return '';}
		return decodeURIComponent(results[2].replace(/\+/g, ' '));
	}

  setQueryParams(typology = null, country = null, category = null, status = null, source = null, region = null) {

		// this.typology = typology || 'equity';
		// this.country = country || 'italy';
		
		if (this.selectedTypologies.length) {
			this.activeCampaignQuery.default.filterModel.typology = {
				filterType: 'set',
				values: this.selectedTypologies.map(el => el.key)
			};
		} else {
			delete this.activeCampaignQuery.default.filterModel.typology;
		}
		
		if (this.selectedCountries.length) {
			this.activeCampaignQuery.default.filterModel.country = {
				filterType: 'set',
				values: this.selectedCountries.map(el => el.key)
			};
		} else {
			delete this.activeCampaignQuery.default.filterModel.country;
		}
		

		if (this.selectedStatus.length) {
			this.activeCampaignQuery.default.filterModel.status = {
				filterType: 'set',
				values: this.selectedStatus.map(el => el.key)
			};
		} else {
			delete this.activeCampaignQuery.default.filterModel.status;
		}		

		if (this.selectedCategories.length) {
			this.activeCampaignQuery.default.filterModel.tags = {
				key: 'tags',
				filterType: 'set',
				values: this.selectedCategories.map(el => el.key),
				isObject: true
			};
		} else {
			delete this.activeCampaignQuery.default.filterModel.tags;
		}
		
		if (this.selectedSources.length) {
			this.activeCampaignQuery.default.filterModel.source = {
				key: 'source',
				filterType: 'set',
				values: this.selectedSources.map(el => el.key),
				isObject: true
			};
		} else {
			delete this.activeCampaignQuery.default.filterModel.source;
		}

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
				this.activeCampaignQuery.default.filterModel['region'] = {
					filterType: 'set',
					values: regions
				};
			} else {
				delete this.activeCampaignQuery.default.filterModel['region'];
			}
		} else {
			delete this.activeCampaignQuery.default.filterModel['region'];
		}

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

  updateByTranslate(lang){
		if (lang == 'en') {
			this.locale = 'en-US';
		} else if (lang == 'it') {
			this.locale = 'it-IT';
		}
	}

  async init() {
		this.setQueryParams();

		this.loadCampaigns(false);
		try {
			this.loadCSR();
		} catch (error) {
		}
	}

  async loadCountries() {
		try {
			const res = await this.countryService.getWithPagination({
				startRow: 0,
				pageSize: 100,
				filterModel: [],
				sortModdel: []
			});
			
			if (res && res.items.length) {
				this._countries = res.items.map(el => ({
					key: el.name,
					title: el.name.charAt(0).toUpperCase() + el.name.slice(1)
				}));
			}
			this.cdr.detectChanges();

		} catch (error) {
		}
	}

  async loadCampaigns(isMore = false) {
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

		this.loadingSubject.next(true);
		try {

			if (!isMore) {
				this.activeCampaignQuery.curIndex = 0;
				this.activeCampaignQuery.startRow = 0;
				this.activeCampaignQuery.endRow = 1000000;
			}
			const payload = cloneDeep(this.activeCampaignQuery);

			payload.filterModel = cloneDeep(this.activeCampaignQuery.default.filterModel);
			// payload.filterModel.updatedAt = {
			// 	filterType: 'gte',
			// 	value: new Date().setDate(new Date().getDate() - 3),
			// 	isDate: true
			// };

			payload.filterModel.fullAddress = {
        filterType: 'ne',
        value: null
      };

			this.campaignService.getFromLocation(payload,{
				self: 'name names descriptions description systemTitle logo logoSM backgroundSM background leftDays endDate startDate videoUrl raised status investorCount minimumGoal maximumGoal follows link typology roi roiAnnual holdingTime city address lat lng fullCity fullAddress minimumInvestment preMoneyEvaluation country',
				company: 'name tags campaigns article foundedDate physicalLocation fiscalCode type originalTags',
				source: 'link name description logo',
				startTime,
				endTime
			}).then(res => {
				if (!isMore) {
					this.activeCampaignQuery.campaigns = [];
				}
	
				// if (res.countries.length && !this.countries.length) {
				// 	this._countries.forEach( el => {
				// 		if (res.countries.includes(el.key)) {
        //       this.countries.push(el);
        //     }
				// 	});
				// }
	
				res.items.forEach((item, index) => {
					item.index = this.activeCampaignQuery.campaigns.length;
					this.activeCampaignQuery.campaigns.push(campaign2htmlData(item, this.wallets, this.user));
				});
	
				this.activeCampaignQuery.totalCount = res.totalCount;
        console.info('this.activeCampaignQuery == ', this.activeCampaignQuery);

				if (this.map) {
					this.map.setMarkers(this.activeCampaignQuery.campaigns);
					this.map.onClickCloseMarkerSelection();
				}
	
				if (!(this.cdr as ViewRef).destroyed){
					this.cdr.detectChanges();
				}
				this.loadingSubject.next(false);
				
				this.apr.tick();

			}).catch(err => {
				throw {};
			});

		} catch (error) {
			console.log(error);
			this.loadingSubject.next(false);
		}
	}

  async loadCSR() {
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

		var payload: any = {};
		payload.startRow = 0;
		payload.endRow = 100000;
		payload.pageSize = 100000;

		payload.filterModel = {
			deleted: {
				filterType: 'ne',
				value: true
			},
			country: {
				filterType: 'set',
				values: this.selectedCountries.map(el => el.key)
			},
			typology: {
				filterType: 'set',
				values: this.selectedTypologies.map(el => el.key)
			}
		}		

		const res = await this.campaignService.getValueByPeriod(payload, {
			startTime,
			endTime
		});

		if (res) {
			(res.items as Array<any>).forEach(element => {
				(element.tags || []).forEach(el => {
					var fid = this.categories.findIndex(item => item.key == el._id) > -1;
					if (!fid) {
						this.categories.push({
							title: tag2category(el, 'it'),
							key: el._id
						});
					}
				});
				
				if (element.source) {
					var fid = this.sources.findIndex(item => item.key == element.source._id) > -1;
					if (!fid) {
						this.sources.push({
							title: element.source.name,
							key: element.source._id
						});
					}
				}
			});
		}

		if(!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}

	}
  

	/**
	 * Filter action part
	 * country, status, typology, date, source, category, region 
	 */

	onChangePeriodType(event) {
		if (this.periodType == 'year') {
			this.periodStart.setMonth(0);
			this.periodEnd = this.periodEnd = moment(this.periodStart).endOf('year').toDate();
		} else if (this.periodType == 'month') {
			this.periodEnd = this.periodEnd = moment(this.periodStart).endOf('month').toDate();
		}
		this.init();
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
		this.init();
	}

	onDateChanged(event) {
		this.periodStart = new Date(event);
		this.onChangePeriodType({});
		if (this.periodType == 'year') {
			this.periodEnd = moment(this.periodStart).endOf('year').toDate();
		} else if (this.periodType == 'month') {
			this.periodEnd = moment(this.periodStart).endOf('month').toDate();
		}
		this.init();
	}

	onDateRangeChanged(event) {
		this.periodStart = new Date(event[0]);
		this.periodEnd = moment(event[1]).endOf('day').toDate();
		this.init();
	}

	async onSelectCountry(e) {
		this.availableRegions = [];
		// this.activeCampaignQuery.default.filterModel['source.configs.involvedCampaignCountries'] = {
		// 	filterType: 'set',
		// 	values: this.selectedCountries.map(el => el.key)
		// }
		this.activeCampaignQuery.default.filterModel.country = {
			filterType: 'set',
			values: this.selectedCountries.map(el => el.key)
		};

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
		setTimeout(() => {
			this.init();
		}, 500);
	}

	async onSelectTypology(e) {
		setTimeout(() => {
			this.init();
		}, 500);
	}

	async onSelectCategory(e) {
		setTimeout(() => {
			this.init();
		}, 500);
	}

	async onSelectSources(e) {
		setTimeout(() => {
			this.init();
		}, 500);
	}

	async onSelectStatus(e) {
		setTimeout(() => {
			this.init();
		}, 500);
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
		setTimeout(() => {
			this.init();
		}, 500);
	}

	onChangeRegion($event, region) {
		region.selected = $event.target.checked;
		setTimeout(() => {
			this.init();
		}, 500);
	}

	selectEU($event) {
		if ($event.target.checked) {
			this.country = 'europe';
			this.countries = this.allEUs;
			this.selectedCountries = this.allEUs;
		} else {
			this.country = 'italy';
			this.countries = this._countries;
			this.selectedCountries = this._selectedCountries;
		}
		setTimeout(() => {
			this.init();
		}, 500);
	}

}
