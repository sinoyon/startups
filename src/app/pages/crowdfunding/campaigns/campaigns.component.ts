// Angular
import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewRef, AfterViewInit, ViewChild } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { Meta } from '@angular/platform-browser';
import { cloneDeep, debounce, each } from 'lodash';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Location } from '@angular/common';
import { KTUtil } from '../../../_metronic/kt/index';

import { CampaignService } from '../../common/campaign.service';
import { AdvertisementService } from '../../common/advertisement.service';
import { UserService } from '../../common/user.service';
import { AliasService } from '../../common/alias.service';
import { TransactionService } from '../../common/transaction.service';
import { WalletService } from '../../common/wallet.service';

import { campaign2htmlData, tag2category } from '../../common/common';
import { AuthService } from 'src/app/modules/auth/_services/auth.service';
import { InvestAmountDialog } from '../../dialogs/invest-amount/invest-amount.dialog';
import { SplashScreenService } from 'src/app/_metronic/partials';
import { AuthDialog } from 'src/app/modules/auth/auth.dialog';
import { MainModalComponent } from 'src/app/_metronic/partials/layout/modals/main-modal/main-modal.component';
import { ToastService } from '../../common/toast.service';
import { FilterComponent } from './filter/filter.component';
import { CountryService } from '../../common/country.service';
import { CommonService } from '../../common/common.service';
import { TranslationService } from 'src/app/modules/i18n';
const { getCode } = require('country-list');

@Component({
	selector: 'app-campaigns',
	templateUrl: './campaigns.component.html',
	styleUrls: ['campaigns.component.scss']
})
export class CampaignsComponent implements OnInit, OnDestroy, AfterViewInit {

	loadingSubject;
	loading$: Observable<boolean>;
	loading = false;

	lazyBounceBottom = 605;

	isLoadMore = false;
	isFiltered = false;
	isSorted = false;

	typology;
	country;
	view;

	observer;

	filterModelFromSearch: any = null;
	filterModelFromFilter: any = {};

	activeCampaignQuery: any = {
		filterModel: {},
		pageSize: 9,
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
	advs = {
		campaigns : [],
		sources: [],
	};

	changedQuery = false;

	isStickyOptionHeader = false;
	optionHeaderTop = 0;

	selectedMarkerCampaign;
	selectedMarkerCampaigns;
	selectedMarkerCampaignsStartIndex = 0;

	isClickedAdvVideo = false;

	wallets = [];
	filterOptions: any[] = [];
	get selectedFilterOptions() {
		return this.filterOptions.filter( el => el.selected);
	}
	favoriteCategories = [];
	initCategories = [];

	@ViewChild('sortCtrl', {static: true}) sortCtrl;
	@ViewChild('countryCtrl', {static: true}) countryCtrl;
	@ViewChild('typologyCtrl', {static: true}) typologyCtrl;
	@ViewChild('viewCtrl', {static: true}) viewCtrl;

	@ViewChild('map', {static: false}) map;
	@ViewChild('list', {static: false}) list;
	@ViewChild('card', {static: false}) card;
	@ViewChild('video', {static: true}) video;


	@ViewChild('filterWrapper', {static: true}) filterWrapper;
	@ViewChild('filterItemsWrapper', { static: true}) filterItemsWrapper;

	get overFiltered(): {length: number; left: number} {

		const wrapper = document.getElementById('crowdfunding_filtered_wrapper');
		const children = document.querySelectorAll('#crowdfunding_filtered_items_wrapper>div');
		let length = 0; let left = 0;
		try {
			for (let i = 0; children[i]; i++) {
				const node = children[i] as HTMLElement;
				if (node.offsetLeft + node.offsetWidth + 50 > wrapper.offsetWidth - 50) {
					length = this.selectedFilterOptions.length - (i);
					left = node.offsetLeft;
					throw '';
				}
			}
		} catch (error) {

		}

		return {length, left};
	}


	stickySubject = new Subject<any>();

	user;
	locale = 'it-IT';

	preSelectedCategory;
	searchPlaceholder;

	unsubscribe: Subscription[] = [];
	scrollcb;

	constructor(
		private campaignService: CampaignService,
		private advertisementService: AdvertisementService,
		private meta: Meta,
		private modal: NgbModal,
		private location: Location,
		private translate: TranslateService,
		private translationService: TranslationService,
		private auth: AuthService,
		private aliasService: AliasService,
		private router: Router,
		private transactionService: TransactionService,
		private walletService: WalletService,
		private splashScreenService: SplashScreenService,
		private toastService: ToastService,
		private userService: UserService,
		private countryService: CountryService,
		private cdr: ChangeDetectorRef,
    public common: CommonService) {

		if (this.router.getCurrentNavigation() && this.router.getCurrentNavigation().extras.state) {
			this.preSelectedCategory = this.router.getCurrentNavigation().extras.state.category;
		}

		this.loadingSubject = this.splashScreenService.loadingSubject;
		this.loading$ = this.loadingSubject.asObservable();
		this.activeCampaignQuery.sortModel = cloneDeep(this.activeCampaignQuery.default.sortModel);

		const routerSubscription = this.router.events.subscribe((event) => {
			if (event instanceof NavigationEnd) {
			}
		});
		this.unsubscribe.push(routerSubscription);

		let self = this;
		document.addEventListener('keydown', function(event){
			if(event.key === "Escape"){
				self.onCloseVideo();
			}
		});
	}

	getQueryParam(name, url = window.location.href) {
		name = name.replace(/[\[\]]/g, '\\$&');
		const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
				const results = regex.exec(url);
		if (!results) {return null;}
		if (!results[2]) {return '';}
		return decodeURIComponent(results[2].replace(/\+/g, ' '));
	}

	setQueryParams(typology = null, view = null, country = null) {
		typology = typology || this.getQueryParam('typology');
		view = view || this.getQueryParam('view');
		country = country || this.getQueryParam('country');

		this.typology = this.typologyCtrl.writeValue(typology);
		this.view = this.viewCtrl.writeValue(view);
		this.country = this.countryCtrl.writeValue(country);

		this.location.go(`crowdfunding?typology=${this.typology}&view=${this.view}&country=${this.country}`);

		this.activeCampaignQuery.default.filterModel.typology = {
			filterType: 'text',
			filter: this.typology
		};
		if (this.country) {
			sessionStorage.setItem('country', this.country);
			if (this.country == 'europe') {
				delete this.activeCampaignQuery.default.filterModel.country;
				this.translationService.changeLangSubject.next('en');
			} else {
				this.activeCampaignQuery.default.filterModel.country = {
					filterType: 'set',
					values: [this.country]
				};

				if (this.country == 'italy') {
					this.translationService.changeLangSubject.next('it');
				} else if (this.country == 'france') {
					this.translationService.changeLangSubject.next('fr');
				} else if (this.country == 'spain') {
					this.translationService.changeLangSubject.next('es');
				}
			}
		}

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	ngOnInit(): void {
		this.meta.updateTag({ property: 'og:title', content: this.translate.instant('OTHERS.start_title')});
		this.meta.updateTag({ property: 'og:description', content: this.translate.instant('OTHERS.start_desc')});

		this.unsubscribe.push(this.loadingSubject.subscribe( _incomingValue => {
			if (!_incomingValue && this.changedQuery) {
				this.changedQuery = false;
				setTimeout(async () => {
					this.initLoadResult();
					this.cdr.markForCheck();
				});
			}
		}));

		this.unsubscribe.push(this.translate.onLangChange.subscribe( lang => {
			this.updateByTranslate(lang.lang);
			this.loadCSR();
		}));
		this.updateByTranslate(this.translate.currentLang);

		this.unsubscribe.push(this.auth.currentUserSubject.subscribe ( user => {
			this.user = user;
			console.info('user : ', user);
			this.cdr.detectChanges();
			this.loadFavoriteCategories();
			const cty = (user && user.country) ? user.country : this.auth.userCountry;
			this.init(cty);
		}));

		this.sortCtrl.registerOnChange((param) => {
			this.onSort(param);
		});

		this.typologyCtrl.registerOnChange((param) => {
			this.onClickTypology(param.value);
		});

		this.viewCtrl.registerOnChange((param) => {
			this.onClickView(param.value);
		});

		this.countryCtrl.registerOnChange((param) => {
			this.onClickCountry(param.value);
		});

		window.addEventListener('popstate', (e) => {
			this.closeVideoView();
		});

		this.unsubscribe.push(this.stickySubject.subscribe ( param => {
			this.setStickyOptionHeader(param);
		}));

		this.unsubscribe.push(this.campaignService.search$.subscribe( param => {
			const option = this.filterOptions.find( el => el.type == 'category' && el.value == param);
			if (option) {
				option.selected = true;
				this.onFilterChanged();
			}
		}));

	}

	async init(country = 'italy') {

		await this.loadCountries();
		this.setQueryParams(null, null, country);

    try {      
      this.transactionService.create({
        type: 'home.view',
        value: -1,
        name: null,
				country: this.country == 'europe' ? null : this.country
      });
    } catch (error) {
    }		

		await this.loadWallets();
		this.loadAdvertisements();
		this.loadCampaigns(false);
		try {
			this.loadCSR();
		} catch (error) {
		}
		try {
			if (this.view != 'map') {throw {};}
			this.loadMap();
		} catch (error) {

		}
		this.observeCampaignLoad();
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
				this.countryCtrl.options = res.items.map(el => ({
						value: el.name,
						label: el.name.charAt(0).toUpperCase() + el.name.slice(1),
						hidden: true
					}));
				this.countryCtrl.options = [{
					label: 'Europe',
					value: 'europe',
					flag: 'european-union'
				}, ...this.countryCtrl.options];
			}
			this.cdr.detectChanges();

		} catch (error) {
		}
	}

	async onClickCountry(param) {

		this.auth.userCountry = param;
		this.setQueryParams(null, null, param);

		this.filterModelFromFilter = {};
		this.filterModelFromSearch = null;

		this.loadCSR();

		if (this.sortCtrl) {
			this.sortCtrl.selectedOption = this.sortCtrl.options.find(el => el.colId == 'leftDays');
			this.isSorted = false;
			this.activeCampaignQuery.sortModel = cloneDeep(this.activeCampaignQuery.default.sortModel);
		}
		this.loadAdvertisements().then( () => {
			this.initLoadResult();
		});
	}

	ngAfterViewInit() {
		setTimeout(() => {
			try {
				const optionsHeaderOffsetTop = document.getElementById('options_header').getBoundingClientRect().top;
				this.optionHeaderTop = optionsHeaderOffsetTop;

				this.scrollcb = (e) => {
					const optionsHeaderEl = document.getElementById('options_header');
					const st = KTUtil.getScrollTop();
					if (optionsHeaderEl) {
						if (st > this.optionHeaderTop) {
							if (!KTUtil.isElementHasClasses(optionsHeaderEl, 'stickyOn')) {
								KTUtil.addElementClass(optionsHeaderEl, 'stickyOn');
								KTUtil.ElementStyleUtil.set(document.getElementById('kt_header'), 'display', 'none');
							};
							this.isStickyOptionHeader = true;
						} else {
							if (KTUtil.isElementHasClasses(optionsHeaderEl, 'stickyOn')) {KTUtil.removeElementClass(optionsHeaderEl, 'stickyOn');}
							KTUtil.ElementStyleUtil.set(document.getElementById('kt_header'), 'display', 'flex');
							this.isStickyOptionHeader = false;
						}

						if (!(this.cdr as ViewRef).destroyed) {
							this.cdr.detectChanges();
						};
					}

					KTUtil.ElementStyleUtil.set(document.documentElement, '--scroll-y', `${window.scrollY}px`);
				};
				window.addEventListener('scroll', this.scrollcb);
			} catch (error) {
				console.log(error);
			}
		});
	}

	updateByTranslate(lang){
		if (lang == 'en') {
			this.locale = 'en-US';
		} else if (lang == 'it') {
			this.locale = 'it-IT';
		}
	}

	async loadWallets() {

		try {

			if (!this.user) {throw {};}

			const res = await this.walletService.getWalletCampaignsByUserId({
				userId: this.user._id,
				typology: this.typology
			});

			if (!res) {throw '';}

			this.wallets = res;
			this.cdr.detectChanges();

		} catch (error) {

			this.wallets = [];
		}
	}

	async loadCSR() {
		try {
			this.campaignService.getCSR({
				typology: this.typology,
				country: this.country
			}).then(res => {
				if (this.sortCtrl) {
					this.sortCtrl.options.forEach( opt => {
						if (opt.colId == 'roiAnnual' || opt.colId == 'holdingTime') {
							opt.hidden = this.typology == 'equity' ||  res.RE_count == 0;
						}
					});
				}
	
				let language = this.translate.currentLang; // (getCode(this.country.toLowerCase().trim()) || localStorage.getItem('language') || 'it').toLowerCase();
	
				this.filterOptions = [];
	
				if (res.status.ongoing > 0) {
					this.filterOptions.push({
						label: 'GENERAL.ONGOING',
						value: '1_ongoing',
						type: 'status'
					},);
				}
				if (res.status.comingsoon > 0) {
					this.filterOptions.push({
						label: 'GENERAL.COMINGSOON',
						value: '2_comingsoon',
						type: 'status'
					});
				}
	
				if (res.categories) {
					res.categories.forEach( el => {
						this.filterOptions.push({
							label: tag2category(el, language),
							value: el._id,
							type: 'category'
						});
					});
				}
				const defaultMinimumInvestments = [
					{
						label: 'CAMPAIGNS.FILTER.MINIMUM_INVESTMENT.LESS500',
						value: 'less500',
						type: 'minimumInvestment'
					},
					{
						label: 'CAMPAIGNS.FILTER.MINIMUM_INVESTMENT.LESS1000',
						value: 'less1000',
						type: 'minimumInvestment'
					},
					{
						label: 'CAMPAIGNS.FILTER.MINIMUM_INVESTMENT.LESS2000',
						value: 'less2000',
						type: 'minimumInvestment'
					},
					{
						label: 'CAMPAIGNS.FILTER.MINIMUM_INVESTMENT.LESS5000',
						value: 'less5000',
						type: 'minimumInvestment'
					},
					{
						label: 'CAMPAIGNS.FILTER.MINIMUM_INVESTMENT.MIN5000',
						value: 'min5000',
						type: 'minimumInvestment'
					},
					{
						label: 'CAMPAIGNS.FILTER.MINIMUM_INVESTMENT.NOT_DEFINED',
						value: 'non',
						type: 'minimumInvestment'
					}
				];
				each(res.minimumInvestments, ( value, key) => {
					if (value > 0) {
						const r = defaultMinimumInvestments.find(el => el.value == key);
						if (r) {
							this.filterOptions.push(r);
						}
					}
				});
	
				if (this.typology == 'equity') {
					const defaultPreMoneyEvaluations = [
						{
							label: 'CAMPAIGNS.FILTER.PRE_MONEY_EVALUATION.LESS1M',
							value: 'less1M',
							type: 'preMoneyEvaluation'
						},
						{
							label: 'CAMPAIGNS.FILTER.PRE_MONEY_EVALUATION.LESS3M',
							value: 'less3M',
							type: 'preMoneyEvaluation'
						},
						{
							label: 'CAMPAIGNS.FILTER.PRE_MONEY_EVALUATION.LESS5M',
							value: 'less5M',
							type: 'preMoneyEvaluation'
						},
						{
							label: 'CAMPAIGNS.FILTER.PRE_MONEY_EVALUATION.LESS10M',
							value: 'less10M',
							type: 'preMoneyEvaluation'
						},
						{
							label: 'CAMPAIGNS.FILTER.PRE_MONEY_EVALUATION.MIN10M',
							value: 'min10M',
							type: 'preMoneyEvaluation'
						},
						{
							label: 'CAMPAIGNS.FILTER.PRE_MONEY_EVALUATION.NOT_DEFINED',
							value: 'non',
							type: 'preMoneyEvaluation'
						}
					];
					each(res.preMoneyEvaluations, ( value, key) => {
						if (value > 0) {
							const r = defaultPreMoneyEvaluations.find(el => el.value == key);
							if (r) {
								this.filterOptions.push(r);
							}
						}
					});
				}
	
				// sources
	
				each(res.sources, ( el ) => {
					this.filterOptions.push({
						label: el.name,
						value: el._id,
						type: 'source'
					});
				});
	
				if (this.typology == 'lending' || this.typology == 'minibond') {
					// holding time
	
					const defaultHoldingTimes = [
						{
							label: 'CAMPAIGNS.FILTER.HOLDING_TIME.LESS6',
							value: 'less6',
							type: 'holdingTime'
						},
						{
							label: 'CAMPAIGNS.FILTER.HOLDING_TIME.LESS12',
							value: 'less112',
							type: 'holdingTime'
						},
						{
							label: 'CAMPAIGNS.FILTER.HOLDING_TIME.LESS18',
							value: 'less18',
							type: 'holdingTime'
						},
						{
							label: 'CAMPAIGNS.FILTER.HOLDING_TIME.LESS24',
							value: 'less24',
							type: 'holdingTime'
						},
						{
							label: 'CAMPAIGNS.FILTER.HOLDING_TIME.LESS36',
							value: 'less36',
							type: 'holdingTime'
						},
						{
							label: 'CAMPAIGNS.FILTER.HOLDING_TIME.MIN36',
							value: 'min36',
							type: 'holdingTime'
						},
						{
							label: 'CAMPAIGNS.FILTER.HOLDING_TIME.NOT_DEFINED',
							value: 'non',
							type: 'holdingTime'
						}
					];
					each(res.holdingTimes, ( value, key) => {
						if (value > 0) {
							const r = defaultHoldingTimes.find(el => el.value == key);
							if (r) {
								this.filterOptions.push(r);
							}
						}
					});
	
				// roi annual
	
					const defaultRoiAnnuals = [
						{
							label: 'CAMPAIGNS.FILTER.ROI_ANNUAL.LESS5',
							value: 'less5',
							type: 'roiAnnual'
						},
						{
							label: 'CAMPAIGNS.FILTER.ROI_ANNUAL.LESS10',
							value: 'less10',
							type: 'roiAnnual'
						},
						{
							label: 'CAMPAIGNS.FILTER.ROI_ANNUAL.MIN10',
							value: 'min10',
							type: 'roiAnnual'
						},
						{
							label: 'CAMPAIGNS.FILTER.ROI_ANNUAL.NOT_DEFINED',
							value: 'non',
							type: 'roiAnnual'
						}
					];
					each(res.roiAnnuals, ( value, key) => {
						if (value > 0) {
							const r = defaultRoiAnnuals.find(el => el.value == key);
							if (r) {
								this.filterOptions.push(r);
							}
						}
					});
				}
				this.initCategories = this.filterOptions.filter( el => el.type == 'category').map( el => el.value);
				this.filterOptions.forEach( el => {
					el.selected = false;
				});
	
				if (this.preSelectedCategory) {
					const option = this.filterOptions.find( el => el.value == this.preSelectedCategory && el.type == 'category');
					if (option) {
						if (option.selected) {
	
						} else {
							option.selected = true;
							this.onFilterChanged();
						}
					}
					this.preSelectedCategory = null;
				}
	
				this.searchPlaceholder = `Cerca tra ${res.status.ongoing + res.status.comingsoon} campagne di ${this.typology} crowdfunding`;

				this.cdr.detectChanges();

			}).catch(err => {
				throw {};
			});			

		} catch (error) {
			this.searchPlaceholder = ``;
		}

		if(!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}

	}

	async loadFavoriteCategories() {
		try {
			this.aliasService.getFavoriteCategories(this.user? this.user._id: null).then(res => {
				if (res) {
					this.favoriteCategories = res.map(el => el._id);
				}
				this.cdr.detectChanges();
			});
		} catch (error) {
			console.log(error);
		}
	}

	observeCampaignLoad() {
		const targetEl = document.getElementById('lazyBounce');
		const footer = document.getElementById('kt_footer');

		if (this.observer) {
			this.observer.disconnect();
			delete this.observer;
		}
		if (targetEl && footer) {
			const options = {
				root: null,
				rootMargin: '0px',
				threshold: 0
			};
			this.lazyBounceBottom =  KTUtil.getViewPort().height;
			const handleIntersect = (entries, obr) => {
				if (this.loadingSubject.value || !this.isLoadMore) {
					return;
				}
				const entry = entries[0];
				if (entry && entry.rootBounds && entry.isIntersecting == false) {
					setTimeout( async () => {
						if (this.activeCampaignQuery.totalCount > this.activeCampaignQuery.campaigns.length && this.isLoadMore) {
							this.loadCampaigns();
						}
						obr.observe(targetEl);
					}, 100);
					obr.disconnect();
				}
			};
			this.observer = new IntersectionObserver(handleIntersect, options);
			this.observer.observe(targetEl);
		}
		this.loadingSubject.next(false);
	}

	async loadCampaigns(isMore = true) {
		this.loadingSubject.next(true);
		this.isFiltered = Object.keys(this.filterModelFromFilter).length > 0 || this.filterModelFromSearch;
		try {

			if (!isMore) {
				this.activeCampaignQuery.curIndex = 0;
				this.activeCampaignQuery.startRow = 0;
				this.activeCampaignQuery.endRow = 0;
				this.isLoadMore = false;
			}
			const payload = cloneDeep(this.activeCampaignQuery);

			payload.filterModel = cloneDeep(this.activeCampaignQuery.default.filterModel);
			payload.filterModel.updatedAt = {
				filterType: 'gte',
				value: new Date().setDate(new Date().getDate() - 3),
				isDate: true
			};

			if (this.filterModelFromSearch) {
				each(this.filterModelFromSearch, ( value, key) => {
					if (value) {
						payload.filterModel[key] = value;
					}
				});
			} else {
				each(this.filterModelFromFilter, ( value, key) => {
					if (value) {
						payload.filterModel[key] = value;
					}
				});
			}

			if (this.view == 'map') {
				payload.filterModel.fullAddress = {
					filterType: 'ne',
					value: null
				};
			}
			this.campaignService.get(payload,{
				self: 'name names descriptions description systemTitle logo logoSM backgroundSM background leftDays endDate startDate videoUrl raised status investorCount minimumGoal maximumGoal follows link typology roi roiAnnual holdingTime city address lat lng fullCity fullAddress minimumInvestment preMoneyEvaluation country',
				company: 'name tags campaigns article foundedDate physicalLocation fiscalCode type originalTags',
				source: 'link name description logo'
			}).then(res => {
				if (!isMore) {
					this.activeCampaignQuery.campaigns = [];
				}
	
				if (res.countries.length) {
					this.countryCtrl.options.forEach( el => {
						if (!this.user) {
							if (el.value == 'italy' || el.value == 'france') {
								el.hidden = false;
							} else {
								el.hidden = true;
							}
						} else {
							if (res.countries.includes(el.value) || el.value == 'europe') {
								el.hidden = false;
							} else {
								el.hidden = true;
							}
						}
					});
				}
	
				res.items.forEach((item, index) => {
					item.index = this.activeCampaignQuery.campaigns.length;
					this.activeCampaignQuery.campaigns.push(campaign2htmlData(item, this.wallets, this.user));
				});
	
				this.activeCampaignQuery.startRow += res.items.length;
				this.activeCampaignQuery.endRow += res.items.length;
				this.activeCampaignQuery.totalCount = res.totalCount;
	
				if (!(this.cdr as ViewRef).destroyed){
					this.cdr.detectChanges();
				}
				this.loadingSubject.next(false);
			}).catch(err => {
				throw {};
			});
		} catch (error) {
			console.log(error);
			this.loadingSubject.next(false);
		}
	}

	ngOnDestroy(): void {
		this.unsubscribe.forEach ( u => u.unsubscribe());
		window.removeEventListener('scroll', this.scrollcb);
		KTUtil.ElementStyleUtil.set(document.getElementById('kt_body'), 'background', '#F9FBFD');
		KTUtil.ElementStyleUtil.set(document.getElementById('kt_header'), 'display', 'flex');
		// this.meta.removeTag('name=\'robots\'');
		// this.onClickCloseVideo();
	}

	async onClickLoadMore() {
		if (this.isLoadMore) {
			return;
		}
		this.isLoadMore = true;
		if (this.activeCampaignQuery.totalCount > this.activeCampaignQuery.campaigns.length) {
			this.loadCampaigns();
		}
    try {
      
      this.transactionService.create({
        type: 'home.more',
        value: -1,
        name: null,
				country: this.country == 'europe' ? null : this.country
      });
    } catch (error) {
    }

	}

	async onFilterChanged() {

		const param = {
			statuses: this.filterOptions.filter(opt => opt.type == 'status' && opt.selected).map( opt => opt.value),
			categories: this.filterOptions.filter(opt => opt.type == 'category' && opt.selected).map( opt => opt.value),
			minimumInvestments: this.filterOptions.filter(opt => opt.type == 'minimumInvestment' && opt.selected).map( opt => opt.value),
			preMoneyEvaluations: this.filterOptions.filter(opt => opt.type == 'preMoneyEvaluation' && opt.selected).map( opt => opt.value),
			sources: this.filterOptions.filter(opt => opt.type == 'source' && opt.selected).map( opt => opt.value),
			holdingTimes: this.filterOptions.filter(opt => opt.type == 'holdingTime' && opt.selected).map( opt => opt.value),
			roiAnnuals: this.filterOptions.filter(opt => opt.type == 'roiAnnual' && opt.selected).map( opt => opt.value),
			typologies: this.filterOptions.filter(opt => opt.type == 'typology' && opt.selected).map( opt => opt.value)
		};

		const isRE = this.filterOptions.find( opt => {
				if (opt.selected) {
					if ( opt.type == 'roiAnnual' || opt.type == 'holdingTime') {
						return true;
					}
				}
		}) ? true: false;


		if (param.categories.length) {
			this.filterModelFromFilter.tags = {
				or: true,
				filter: [[{ key: 'company.tags', filterType: 'set', values: param.categories}],
				[{ key: 'company', filterType: 'eq', value: null}, { key: 'tags', filterType: 'set', values: param.categories, isObject: true}]]
				// filter: [[{ key: 'company.tags', filterType: 'set', values: param.categories}]]
			};
		} else {
			this.filterModelFromFilter.tags = null;
		}

		if (isRE) {
			this.filterModelFromFilter.typology_or = {
				or: true,
				filter: [[{ key: 'typology', filterType: 'text', filter: 'real estate'}]]
			};
		} else {
			delete this.filterModelFromFilter.typology_or;
		}

		if (param.statuses && param.statuses.length) {
			this.filterModelFromFilter.status = {
				filterType: 'set',
				values: param.statuses
			};
		} else {
			this.filterModelFromFilter.status = null;
		}

		if (param.sources && param.sources.length) {
			this.filterModelFromFilter.source = {
				filterType: 'set',
				values: param.sources,
				isObject: true
			};
		} else {
			this.filterModelFromFilter.source = null;
		}

		if (param.minimumInvestments && param.minimumInvestments.length) {
			const filters = [
				{
					key: 'less500',
					filter: [{key: 'minimumInvestment',filterType: 'lte',value: 500}]
				},
				{
					key: 'less1000',
					filter: [{key: 'minimumInvestment',filterType: 'lte',value: 1000},
						{
							or: true,
							filter: [[{key: 'minimumInvestment', filterType: 'gte', value: 500}]]
						}
					]
				},
				{
					key: 'less2000',
					filter: [{key: 'minimumInvestment',filterType: 'lte',value: 2000},
						{
							or: true,
							filter: [[{key: 'minimumInvestment', filterType: 'gte', value: 1000}]]
						}
					]
				},
				{
					key: 'less5000',
					filter: [{key: 'minimumInvestment',filterType: 'lte',value: 5000},
						{
							or: true,
							filter: [[{key: 'minimumInvestment', filterType: 'gte', value: 2000}]]
						}
					]
				},
				{
					key: 'min5000',
					filter: [{key: 'minimumInvestment',filterType: 'gte',value: 5000}]
				},
				{
					key: 'non',
					filter: [{key: 'minimumInvestment', filterType: 'eq', value: null}]
				}
			];
			const orFilter = [];
			param.minimumInvestments.forEach( el => {
				const f = filters.find( c => c.key == el);
				if (f) {
					orFilter.push(f.filter);
				}
			});
			this.filterModelFromFilter.minimumInvestment = {
				or: true,
				filter: orFilter
			};
		} else {
			this.filterModelFromFilter.minimumInvestment = null;
		}

		// pre money evaluation
		if (param.preMoneyEvaluations && param.preMoneyEvaluations.length) {
			const filters = [
				{
					key: 'less1M',
					filter: [{key: 'preMoneyEvaluation',filterType: 'lte',value: 1000000}]
				},
				{
					key: 'less3M',
					filter: [{key: 'preMoneyEvaluation',filterType: 'lte',value: 3000000},
						{
							or: true,
							filter: [[{key: 'preMoneyEvaluation', filterType: 'gte', value: 1000000}]]
						}
					]
				},
				{
					key: 'less5M',
					filter: [{key: 'preMoneyEvaluation',filterType: 'lte',value: 5000000},
						{
							or: true,
							filter: [[{key: 'preMoneyEvaluation', filterType: 'gte', value: 3000000}]]
						}
					]
				},
				{
					key: 'less10M',
					filter: [{key: 'preMoneyEvaluation',filterType: 'lte',value: 10000000},
						{
							or: true,
							filter: [[{key: 'preMoneyEvaluation', filterType: 'gte', value: 5000000}]]
						}
					]
				},
				{
					key: 'min10M',
					filter: [{key: 'preMoneyEvaluation',filterType: 'gte',value: 10000000}]
				},
				{
					key: 'non',
					filter: [{key: 'preMoneyEvaluation', filterType: 'eq', value: null}]
				}
			];
			const orFilter = [];
			param.preMoneyEvaluations.forEach( el => {
				const f = filters.find( c => c.key == el);
				if (f) {
					orFilter.push(f.filter);
				}
			});
			this.filterModelFromFilter.preMoneyEvaluation = {
				or: true,
				filter: orFilter
			};
		} else {
			this.filterModelFromFilter.preMoneyEvaluation = null;
		}

		// holding time
		if (param.holdingTimes && param.holdingTimes.length) {
			const filters = [
				{
					key: 'less6',
					filter: [{key: 'holdingTime',filterType: 'lte',value: 6}]
				},
				{
					key: 'less12',
					filter: [{key: 'holdingTime',filterType: 'lte',value: 12},
						{
							or: true,
							filter: [[{key: 'holdingTime', filterType: 'gte', value: 6}]]
						}
					]
				},
				{
					key: 'less18',
					filter: [{key: 'holdingTime',filterType: 'lte',value: 18},
						{
							or: true,
							filter: [[{key: 'holdingTime', filterType: 'gte', value: 12}]]
						}
					]
				},
				{
					key: 'less24',
					filter: [{key: 'holdingTime',filterType: 'lte',value: 24},
						{
							or: true,
							filter: [[{key: 'holdingTime', filterType: 'gte', value: 18}]]
						}
					]
				},
				{
					key: 'less36',
					filter: [{key: 'holdingTime',filterType: 'lte',value: 36},
						{
							or: true,
							filter: [[{key: 'holdingTime', filterType: 'gte', value: 24}]]
						}
					]
				},
				{
					key: 'min36',
					filter: [{key: 'holdingTime',filterType: 'gte',value: 36}]
				},
				{
					key: 'non',
					filter: [{key: 'holdingTime', filterType: 'eq', value: null}]
				}
			];
			const orFilter = [];
			param.holdingTimes.forEach( el => {
				const f = filters.find( c => c.key == el);
				if (f) {
					orFilter.push(f.filter);
				}
			});
			this.filterModelFromFilter.holdingTime = {
				or: true,
				filter: orFilter
			};
		} else {
			this.filterModelFromFilter.holdingTime = null;
		}

		// roi annual
		if (param.roiAnnuals && param.roiAnnuals.length) {
			const filters = [
				{
					key: 'less5',
					filter: [{key: 'roiAnnual',filterType: 'lte',value: 5}]
				},
				{
					key: 'less10',
					filter: [{key: 'roiAnnual',filterType: 'lte',value: 10},
						{
							or: true,
							filter: [[{key: 'roiAnnual', filterType: 'gte', value: 5}]]
						}
					]
				},
				{
					key: 'min10',
					filter: [{key: 'roiAnnual',filterType: 'gte',value: 10}]
				},
				{
					key: 'non',
					filter: [{key: 'roiAnnual', filterType: 'eq', value: null}]
				}
			];
			const orFilter = [];
			param.roiAnnuals.forEach( el => {
				const f = filters.find( c => c.key == el);
				if (f) {
					orFilter.push(f.filter);
				}
			});
			this.filterModelFromFilter.roiAnnual = {
				or: true,
				filter: orFilter
			};
		} else {
			this.filterModelFromFilter.roiAnnual = null;
		}

		each(this.filterModelFromFilter, (value, key) => {
			if ( value == null) {delete this.filterModelFromFilter[key];}
		});

		this.initLoadResult();
	}

	async onSort(param) {
		const colId = param.colId;
		this.isSorted = colId != 'leftDays';
		if (colId == 'roiAnnual' || colId == 'holdingTime') {
			this.filterModelFromFilter.typology_or = {
				or: true,
				filter: [[{ key: 'typology', filterType: 'text', filter: 'real estate'}]]
			};
		} else {
			const isRE = this.filterOptions.find( opt => {
				if (opt.selected) {
					if ( opt.type == 'roiAnnual' || opt.type == 'holdingTime') {
						return true;
					}
				}
			}) ? true: false;
			if (isRE) {
				this.filterModelFromFilter.typology_or = {
					or: true,
					filter: [[{ key: 'typology', filterType: 'text', filter: 'real estate'}]]
				};
			} else {
				delete this.filterModelFromFilter.typology_or;
			}
		}
		if (this.activeCampaignQuery.sortModel[0].colId != colId) {
			this.activeCampaignQuery.sortModel[0].colId = colId;
			this.activeCampaignQuery.sortModel[0].sort = param.sort;
			if (this.loadingSubject.getValue()) {
				this.changedQuery = true;
			} else {
				this.initLoadResult();
			}
		}

	}

	async onClearSearch() {
		this.filterModelFromSearch = null;
		if (this.loadingSubject.getValue()) {
			this.changedQuery = true;
		} else {
			this.initLoadResult();
		}
	}

	async onClearFilter() {
		this.filterModelFromFilter = {};
		if (this.loadingSubject.getValue()) {
			this.changedQuery = true;
		} else {
			this.initLoadResult();
		}
	}

	async initLoadResult() {
		try {
			this.loadCampaigns(false).then(res => {
				if (this.view == 'map') {
					this.loadMap();
				} else {
				}
			});
			
			if (this.map) {
				this.map.onClickCloseMarkerSelection();
			}
		} catch (error) {
		}
	}

	setStickyOptionHeader(param: any = { sticky: true}) {
		if (param.sticky) {
			const optionsHeaderEl = document.getElementById('options_header');
			if (!KTUtil.isElementHasClasses(optionsHeaderEl, 'stickyOn')) {
				KTUtil.addElementClass(optionsHeaderEl, 'stickyOn');
			}
		} else {
			if (param.action == 'toggle') {
				if (this.optionHeaderTop) {
					const st = KTUtil.getScrollTop();
					if (st <= this.optionHeaderTop) {
						const optionsHeaderEl = document.getElementById('options_header');
						if (KTUtil.isElementHasClasses(optionsHeaderEl, 'stickyOn') ) {KTUtil.removeElementClass(optionsHeaderEl, 'stickyOn');}
					}
				}
			}
		}
	}

	async onClickFollowCampaign(param) {

		if (!this.checkUser()) {return;}

		this.loadingSubject.next(true);
		try {

			this.campaignService.follow( param._id, this.user._id, !param.follows || !param.follows.includes(this.user._id) ).then(res => {
				if (param.advId) {
					this.advs.campaigns.forEach( el => {
						if (el.advId == param.advId) {
							el.follows = res.follows;
							el.followed = res.follows.includes(this.user._id);
						}
					});
				}
				const campaign = this.activeCampaignQuery.campaigns.find( el => el._id == param._id);
				if (campaign) {
					campaign.follows = res.follows;
					campaign.followed = res.follows.includes(this.user._id);
				}
	
				if (this.view == 'map') {
					const campaign = this.map.markersOfMap.campaigns.find( el => el._id == param._id);
					if (campaign) {
						campaign.follows = res.follows;
						campaign.followed = res.follows.includes(this.user._id);
					}
				}
				this.cdr.detectChanges();
			}).catch(err => {
				throw {};
			});		

		} catch (error) {
			console.log(error);
		}
		this.cdr.detectChanges();
		this.loadingSubject.next(false);
	}

	checkUser(withEmail = true) {
		if (!this.user || this.user.isGuest) {
			this.modal.open(AuthDialog, { animation: false});
			return false;
		} else if (withEmail && !this.user.emailConfirmed) {
			const modalRef = this.modal.open(MainModalComponent, { animation: false});
			modalRef.componentInstance.modalData = {
				text: 'GENERAL.CONFIRM_YOUR_EMAIL',
                yes: 'GENERAL.SEND_EMAIL',
                cancel: 'GENERAL.CANCEL'
			};

			const subscr = modalRef.closed.subscribe ( async e => {
				if (e) {
					this.userService.sendVerifyEmail([this.user._id]).then(res => {
						if (res) {
							this.toastService.show (this.translate.instant('NOTIFICATION.GO_EMAIL_BOX'));
						}
						this.cdr.detectChanges();
					}).catch(err => {
					});					
				}
				setTimeout(() => subscr.unsubscribe(), 100);
			});
			return false;
		}

		return true;
	}

	async onClickWalletCampaign(param) {

		if (!this.checkUser()) {return;}

		try {

			if (param.wallet) {
				await this.walletService.deleteByIds([param.wallet]);
			} else {
				await this.onShowInvestAmountDialog(param);

				this.toastService.show(this.translate.instant('OTHERS.compaign_portfolio'),
					{ classname: '', delay: 6000, desc: this.translate.instant('OTHERS.go_personal_data'), action: '/account/overview/wallets' });

			}

			await this.loadWallets();

			if (param.advId) {
				this.advs.campaigns.forEach( el => {
					if (el.advId == param.advId) {
						if (el._id) {
							const wallet = this.wallets.find( el0 => el0.campaignId == el._id);
							el.wallet = wallet ? wallet._id: null;
						}
					}
				});
			}
			const campaign = this.activeCampaignQuery.campaigns.find( el => el._id == param._id);
			if (campaign) {
				const wallet = this.wallets.find( el0 => el0.campaignId == campaign._id);
				campaign.wallet = wallet ? wallet._id: null;
			}

			if (this.view == 'map') {
				const campaign = this.map.markersOfMap.campaigns.find( el => el._id == param._id);
				if (campaign) {
					const wallet = this.wallets.find( el0 => el0.campaignId == campaign._id);
					campaign.wallet = wallet ? wallet._id: null;
				}
			}

		} catch (error) {
			console.log(error);
		}
		this.cdr.detectChanges();
	}

	onShowInvestAmountDialog(campaign) {
		return new Promise( (resolve, reject) => {
			const modalRef = this.modal.open(InvestAmountDialog, { animation: false, size: 'md'});
			modalRef.componentInstance.amount = campaign.minimumInvestment || 100;
			const subscr = modalRef.closed.subscribe( async res => {
				try {
					if (!campaign) {throw {};}
					if (!res) {throw {};}

					await this.walletService.create({
						user: this.user._id,
						campaign: campaign._id,
						amountInvested: modalRef.componentInstance.investmentType == 'amountInvested' ? res: undefined,
						equityOwned: modalRef.componentInstance.investmentType == 'equityOwned' ? res: undefined,
						investedDate: new Date()
					});

				} catch (error) {
				}
				setTimeout(() => subscr.unsubscribe(), 10);
				resolve({});
			});

			const subscr1 = modalRef.dismissed.subscribe( res => {
				reject({});
				setTimeout(() => subscr1.unsubscribe(), 10);
			});
		});

	}

	async loadAdvertisements() {
		this.loadingSubject.next(true);

		try {
			this.advertisementService.get({
				filterModel: {
					deleted: {
						filterType: 'ne',
						value: true
					},
				},
				pageSize: 9,
				sortModel: [],
				startRow: 0
			}, {
				country: this.country,
				typology: this.typology,
				isActive: true,
				project: 'name names descriptions description systemTitle logo logoSM backgroundSM background leftDays endDate startDate videoUrl raised status investorCount minimumGoal maximumGoal follows link typology roi roiAnnual holdingTime city address lat lng fullCity fullAddress minimumInvestment preMoneyEvaluation country'
			}).then(res => {
				this.advs.campaigns = res.items.filter( el => el.type == 'campaign').map( (el, index) => el.typeId? {...campaign2htmlData(el.campaign, this.wallets, this.user), index, advId: el._id}: {index, advId: el._id})
			.sort( (a, b) => Math.floor(Math.random() * 2) == 1 ? 1: -1);

				const advs = res.items.filter(el => el.type == 'source');
				this.advs.sources = [];
				for (let i = 0 ; i < advs.length; i++) {
					const adv = advs[i];
					if (adv.typeId && adv.source) {
						adv.detail = adv.detail || {};
						try {
							this.campaignService.get({
								filterModel: {
									source: {
										filterType: 'eq',
										value: adv.source._id,
										isObject: true
									},
									status: {
										filterType: 'set',
										values: ['1_ongoing', '2_comingsoon']
									}
								},
								endRow: 0,
								pageSize: 3,
								sortModel: [{ colId: 'raised', sort: 'desc'}],
								startRow: 0,
							}, {
								self: 'name description systemTitle logo logoSM status',
								company: 'name',
							}).then(res1 => {
								this.advs.sources.push({
									domain: (new URL(adv.source.link)).hostname,
									link: adv.source.link,
									description: adv.source.description,
									name: adv.source.name,
									note: adv.source.note,
									_id: adv.source._id,
									advId: adv._id,
									logo: adv.source.logo,
									pic: adv.source.background,
									campaigns: res1 ? res1.items.map( el => ({
											...el,
											advId: adv._id
										})): []
								});
								this.cdr.detectChanges();
							}).catch(err => {
								
							});;
							
						} catch (error) {

						}

					} else {
						this.advs.sources.push({
							advId: adv._id,
							campaigns: []
						});
					}
				}

				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.detectChanges();
				}
			}).catch(err => {
				throw {};
			});			
		} catch (error) {
			console.log(error);
		}
		this.loadingSubject.next(false);
	}

	onClickTypology(param) {
		this.setQueryParams(param);

		this.filterModelFromFilter = {};
		this.filterModelFromSearch = null;

		this.loadCSR();

    this.transactionService.create({
      type: 'home.typology',
      value: -1,
      name: param,
			country: this.country == 'europe' ? null : this.country
    }).then();


		if (this.sortCtrl) {
			this.sortCtrl.selectedOption = this.sortCtrl.options.find(el => el.colId == 'leftDays');
			this.isSorted = false;
			this.activeCampaignQuery.sortModel = cloneDeep(this.activeCampaignQuery.default.sortModel);
		}
		this.loadAdvertisements().then( () => {
			this.initLoadResult();
		});
	}

	async onClickView(param) {

		if (!this.checkUser()) {
			this.viewCtrl.writeValue('card');
			return;
		};

		this.setQueryParams(null, param);

    try {

      if (param != 'map') throw {};
      
      this.transactionService.create({
        type: 'home.map',
        value: -1,
        name: null,
				country: this.country == 'europe' ? null : this.country
      });
    } catch (error) {
    }

    try {

      if (param != 'list') throw {};
      this.transactionService.create({
        type: 'home.list',
        value: -1,
        name: null,
				country: this.country == 'europe' ? null : this.country
      });
    } catch (error) {
    }

		this.initLoadResult();
		setTimeout(() => {
			this.observeCampaignLoad();
		},100);

		this.cdr.detectChanges();
	}

	async loadMap() {

		this.loadingSubject.next(true);
		this.selectedMarkerCampaign = null;
		try {
			const payload = cloneDeep(this.activeCampaignQuery);

			payload.filterModel = cloneDeep(this.activeCampaignQuery.default.filterModel);
			payload.filterModel.updatedAt = {
				filterType: 'gte',
				value: new Date().setDate(new Date().getDate() - 3),
				isDate: true
			};

			if (this.filterModelFromSearch) {
				each(this.filterModelFromSearch, ( value, key) => {
					if (value) {
						payload.filterModel[key] = value;
					}
				});
			} else {
				each(this.filterModelFromFilter, ( value, key) => {
					if (value) {
						payload.filterModel[key] = value;
					}
				});
			}

			payload.filterModel.fullAddress = {
				filterType: 'ne',
				value: null
			};
			this.campaignService.getLatLng(payload).then(res => {
				const campaigns = [];
				res.forEach((item) => {
					if (this.advs.campaigns.find( el0 => el0._id == item._id)) {
						item.icon = './assets/media/misc/map-marker.png';
						item.isAdv = true;
					}
					item.index = campaigns.length;
					campaigns.push(campaign2htmlData(item, this.wallets, this.user));
				});

				if (this.map) {
					this.map.setMarkers(campaigns);
					this.map.checkAdv(this.advs.campaigns);
				}

				this.activeCampaignQuery.campaigns = campaigns;

				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.detectChanges();
				}
				this.loadingSubject.next(false);

			}).catch(err => {
				throw {};
			});
		} catch (error) {
			console.log(error);
			this.loadingSubject.next(false);
		}
	}

	onClickVideo(param) {
		KTUtil.ElementStyleUtil.set(document.getElementById('video_view'), 'display', 'block');
		if (param.advId) {
			this.isClickedAdvVideo = true;
		} else {
			this.isClickedAdvVideo = false;
		}
		this.cdr.detectChanges();
		this.video.init({parent: this, campaign: param});
		history.pushState({ videoModal: true}, null, null);
		document.body.style.position = 'fixed';
		document.body.style.top = `-${window.scrollY}px`;
	}

	onCloseVideo = debounce(async () => {
		this.closeVideoView();
		try {
			if (history.state.videoModal) {
				history.back();
			}
		} catch (error) {

		}
	}, 100);

	closeVideoView() {
		let v_iframe = document.getElementById('ik_player_iframe');
		if (v_iframe) {
			v_iframe.setAttribute('src', null);
		}
		KTUtil.ElementStyleUtil.set(document.getElementById('video_view'), 'display', 'none');
		const scrollY = document.body.style.top;
		document.body.style.position = '';
		document.body.style.top = '';
		window.scrollTo(0, parseInt(scrollY || '0') * -1);
	}

	async onClickDetailCampaign(param) {

		window.open(window.origin + '/crowdfunding/' + (param.systemTitle || ''));
		try {
			if (param.advId) {
				this.advertisementService.action(param.advId, 'detail');
			}
		} catch (error) {
			console.log(error);
		}

	}

	async onClickExternalCampaign(param) {
		try {
			const url = new URL(param.link);
			url.search += (url.search && url.search.length ? '&': '') + 'utm_source=startupswallet&utm_medium=web&utm_content=home';
			window.open(url.origin + url.pathname + url.hash + url.search);
			try {
				if (param.advId) {
					this.advertisementService.action(param.advId, 'external');
				}
        this.campaignService.action(param._id, 'external');
			} catch (error) {
				console.log(error);
			}
		} catch (error) {
		}
	}

	onClickAddFilter() {

		if (!this.checkUser()) {return;}

		const modalRef = this.modal.open(FilterComponent, { animation: false, centered: true});
		modalRef.componentInstance.options = cloneDeep(this.filterOptions);
		modalRef.componentInstance.typology = this.typology;
		const subscr = modalRef.closed.subscribe ( async e => {
			if (e) {
				this.filterOptions = cloneDeep(e);
				this.onFilterChanged();
			}
			setTimeout(() => subscr.unsubscribe(), 100);
		});
	}

	onClickRemoveFilters() {
		this.selectedFilterOptions.forEach( (el, index) => {
			el.selected = false;
		});
		this.onFilterChanged();
	}

}
