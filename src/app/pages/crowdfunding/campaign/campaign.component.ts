import { SourceService } from './../../common/source.service';
// Angular
import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewRef, ViewChild, ElementRef } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { Meta, Title } from '@angular/platform-browser';
import * as lodash from 'lodash';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { CampaignService } from '../../common/campaign.service';
import { UserService } from '../../common/user.service';
import { AliasService } from '../../common/alias.service';
import { AdvertisementService } from '../../common/advertisement.service';
import { WalletService } from '../../common/wallet.service';

import { countries } from '../../common/constant';

import { KTUtil } from '../../../_metronic/kt/index';
import { AuthService } from '../../../modules/auth/_services/auth.service';
import { campaign2htmlData, date2string, str2videoUrl, tag2category } from '../../common/common';
import { SplashScreenService } from 'src/app/_metronic/partials';
import { ToastService } from '../../common/toast.service';
import { AuthDialog } from 'src/app/modules/auth/auth.dialog';
import { MainModalComponent } from 'src/app/_metronic/partials/layout/modals/main-modal/main-modal.component';
import { InvestAmountDialog } from '../../dialogs/invest-amount/invest-amount.dialog';
import { debounce } from 'lodash';
import { CommonService } from '../../common/common.service';
import { Platform } from '@angular/cdk/platform';


@Component({
	selector: 'app-campaign',
	templateUrl: './campaign.component.html',
	styleUrls: ['./campaign.component.scss']
})
export class CampaignComponent implements OnInit, OnDestroy {

	loadingSubject = new BehaviorSubject<boolean>(true);
	loading$: Observable<boolean>;
	loading = false;
	campaign: any;
	locale = 'it-IT';
	user;
	favoriteCategories = [];
	advs = {
		campaigns : [],
		sources: []
	};
	hasSameCategoryCampaigns = true;
	hasHousePictures = true;
	isFullDescription = false;
	sameCategoryCampaignQuery: any = {
		filterModel: {
			status: {
				values: ['1_ongoing', '2_comingsoon'],
				filterType: 'set'
			},
			disabled: {
				filterType: 'ne',
				value: true
			},
			deleted: {
				filterType: 'ne',
				value: true
			}
		},
		endRow: 9,
		pageSize: 9,
		sortModel: [{ colId: 'status', sort: 'asc'}, { colId: 'leftDays', sort: 'asc'}, { colId: 'description', sort: 'desc'}],
		startRow: 0,
		totalCount: 0,
		campaigns: []
	};
	latestCampaignQuery: any = {
		filterModel: {
			status: {
				values: ['1_ongoing', '2_comingsoon'],
				filterType: 'set'
			},
			disabled: {
				filterType: 'ne',
				value: true
			},
			deleted: {
				filterType: 'ne',
				value: true
			}
		},
		endRow: 9,
		pageSize: 9,
		sortModel: [{ colId: 'status', sort: 'asc'}, { colId: 'leftDays', sort: 'asc'}, { colId: 'description', sort: 'desc'}],
		startRow: 0,
		totalCount: 0,
		campaigns: []
	};

	wallets = [];

  expanded = true;
  expandedAdv = false;

	showShare: boolean = false;
	shareUrl: any;

	@ViewChild('sameCategoryCampaignsSlider', {static: true}) sameCategoryCampaignsSlider;

	@ViewChild('map', {static: false}) map;
	@ViewChild('video', {static: true}) video;

	isClickedAdvVideo = false;

	unsubscribe: Subscription[] = [];

	isMobile = false;

	sources: any[] = [];
	categories: any[] = [];

	constructor(
		private activatedRoute: ActivatedRoute,
		private campaignService: CampaignService,
		private router: Router,
		private meta: Meta,
		private titleService: Title,
		private auth: AuthService,
		private translate: TranslateService,
		private aliasService: AliasService,
		private walletService: WalletService,
		private advertisementService: AdvertisementService,
		private splashScreenService: SplashScreenService,
		private modal: NgbModal,
		private toastService: ToastService,
		private userService: UserService,
		private cdr: ChangeDetectorRef,
    public common: CommonService,
		private platform: Platform,
		private sourceService: SourceService
		) {

		this.loading$ = this.loadingSubject.asObservable();

		this.shareUrl =  window.origin + this.router.url;

		this.isMobile = this.platform.ANDROID || this.platform.IOS;

	}

	async ngOnInit() {

		this.initSlider();

		this.loadingSubject = this.splashScreenService.loadingSubject;
		this.unsubscribe.push(this.auth.currentUserSubject.subscribe ( user => {
			this.user = user;
			if (this.user) {
				this.aliasService.getFavoriteCategories(this.user._id).then (res => {
					this.favoriteCategories = res.map(el => el._id);
				});
			}
		}));
		this.unsubscribe.push(this.translate.onLangChange.subscribe( lang => {
			this.updateByTranslate(lang.lang);
		}));
		this.updateByTranslate(this.translate.currentLang);

		this.unsubscribe.push(this.activatedRoute.params.subscribe(params => {
			const systemTitle = params.systemTitle;
			if (systemTitle && systemTitle != '') {
				this.loadCampaignFromService(systemTitle);
			} else {
				this.loadingSubject.next(false);
			}
		}));

		this.unsubscribe.push(this.common.categoriesSubject.subscribe(cates => {
			this.categories = cates.filter(el => el.involvedCampaigns > 0);
			this.cdr.detectChanges();
		}));

		window.addEventListener('popstate', (e) => {
			this.closeVideoView();
		});

		let payload = {
			filterModel: {
				"configs.involvedCampaignCountries": {
					filterType: 'set',
					values: [sessionStorage.getItem('country') || 'italy']
				},
				disabled: {
					filterType: 'ne',
					value: true
				},
				type: {
					filterType: 'eq',
					value: 'root'
				}
			}
		}

		const res = await this.sourceService.getWithPagination(payload);
		if (res) {
			this.sources = res.items.map(ele => ({
				id: ele._id,
				name: ele.name.charAt(0).toUpperCase() + ele.name.slice(1),
				link: ele.link,
				logo: ele.logo
			}));
		};
	}
	
	ngOnDestroy(): void {
		this.campaignService.generateTags({});
		this.unsubscribe.forEach ( u => u.unsubscribe());
	}
	updateByTranslate(lang){
		if (lang == 'en') {
			this.locale = 'en-US';
		} else if (lang == 'it') {
			this.locale = 'it-IT';
		}
	}
	async loadCampaignFromService(systemTitle) {
		this.loadingSubject.next(true);
		try {
      await this.loadWallets();
			const res = await this.campaignService.getBySystemTitle(systemTitle);
			if (!res) {throw {};}
			await this.loadCampaign({...res, id: res._id}, true);
		} catch (error) {
			this.goBack('');
		}
		this.loadingSubject.next(false);
	}
	async loadCampaign(_campaign, fromService: boolean = false) {

		this.campaignService.action(_campaign._id, 'detail');
		this.campaign = campaign2htmlData(_campaign, this.wallets, this.user);

		console.log('campaign ==: ', this.campaign);

    if (_campaign.typology == 'company equity' || _campaign.typology == 'real estate equity') {
			this.loadAdvertisements('equity');
		} else if (_campaign.typology == 'company lending' || _campaign.typology == 'real estate lending') {
			this.loadAdvertisements('lending');
		} else if (_campaign.typology == 'minibond') {
			this.loadAdvertisements('minibond');
		}

		this.sameCategoryCampaignQuery.filterModel.tags = { key: 'company.tags', filterType: 'set', values: this.campaign.tags.map(el => el._id) };
		this.sameCategoryCampaignQuery.filterModel._id = {
			filterType: 'ne',
			value: _campaign._id,
			isObject: true
		};
    if (this.campaign.country) {
      this.sameCategoryCampaignQuery.filterModel.country = {filterType: 'eq', value: this.campaign.country};
    }

		await this.loadCampaigns();

		await this.sameCategoryCampaignsSlider.init(true);

		let title = `${this.campaign.name} | ${this.translate.instant('OTHERS.compaign_equity_title')}`;

		if (_campaign.typology == 'company equity') {
			this.campaign.crowdfundingTypologyTooltip = this.translate.instant('OTHERS.company_equity_tooltip');
			var ogTitle = `Investi nella campagna di equity crowdfunding ${_campaign.name} della piattaforma ${_campaign.source.name}`;
			var ogDescription = `Investi nella campagna di equity crowdfunding ${_campaign.name} della piattaforma crowdfunding ${_campaign.source.name}, ${_campaign.description || ''}, ${(_campaign.company || {}).name || ''}, ${(_campaign.company || {}).physicalLocation || ''}, ${((_campaign.company || {}).originalTags || []).join(' ')}`;
		} else if (_campaign.typology == 'company lending') {
			title = `${this.campaign.name} | ${this.translate.instant('OTHERS.compaign_lending_title')}`;
			this.campaign.crowdfundingTypologyTooltip = this.translate.instant('OTHERS.company_lending_tooltip');
			var ogTitle = `Effettua un prestito a ${_campaign.name} tramite la piattaforma di lending crowdfunding ${_campaign.source.name}`;
			var ogDescription = `Effettua un prestito a ${_campaign.name} tramite la piattaforma di lending crowdfunding ${_campaign.source.name}, ${_campaign.description || ''}, ${(_campaign.company || {}).name || ''}, ${(_campaign.company || {}).physicalLocation || ''}, ${((_campaign.company || {}).originalTags || []).join(' ')}`;
		} else if (_campaign.typology == 'real estate equity') {
			this.campaign.crowdfundingTypologyTooltip = this.translate.instant('OTHERS.real_estate_equity');
			var ogTitle = `Investi nella piattaforma real estate crowdfunding per l'immobile ${_campaign.fullAddress || ''}`;
			var ogDescription = `Investi nella piattaforme real estate equity crowdfunding sulla piattaforma ${_campaign.source.name} per l'immobile ${_campaign.fullAddress || ''}, ${_campaign.description || ''}`;
		} else if (_campaign.typology == 'real estate lending') {
			title = `${this.campaign.name} | ${this.translate.instant('OTHERS.compaign_lending_title')}`;
			this.campaign.crowdfundingTypologyTooltip = this.translate.instant('OTHERS.real_estate_lending');
			var ogTitle = `Effettua un prestito tramite la piattaforma real estate crowdfunding ${_campaign.source.name} per l'immobile ${_campaign.fullAddress || ''}`;
			var ogDescription = `Effettua un prestito tramite la piattaforma real estate crowdfunding ${_campaign.source.name} per l'immobile ${_campaign.fullAddress || ''}, ${_campaign.description || ''}`;
		} else if (_campaign.typology == 'minibond') {
			this.campaign.crowdfundingTypologyTooltip = this.translate.instant('OTHERS.minibond');
			var ogTitle = `Effettua un prestito tramite la piattaforma di minibond crowdfunding ${_campaign.source.name} a ${_campaign.name}`;
			var ogDescription = `Effettua un prestito tramite la piattaforma di minibond crowdfunding ${_campaign.source.name} a ${_campaign.name}, ${_campaign.description || ''}`;
		}

		if (this.translate.currentLang == 'fr') {

			if (_campaign.typology == 'company equity') {
				ogTitle = `Investir dans la campagne de financement participatif (equity crowdfunding) ${_campaign.name} de la plate-forme ${_campaign.source.name}`;
				ogDescription = `Investir dans la campagne de financement participatif (equity crowdfunding) ${_campaign.name} de la plateforme de crowdfunding ${_campaign.source.name}, ${_campaign.description || ''}, ${(_campaign.company || {}).name || ''}, ${(_campaign.company || {}).physicalLocation || ''}, ${((_campaign.company || {}).originalTags || []).join(' ')}`;
			} else if (_campaign.typology == 'company lending') {
				ogTitle = `Faire un prêt à ${_campaign.name} via la plateforme de crowdfunding de prêt ${_campaign.source.name}`;
				ogDescription = `Faire un prêt à ${_campaign.name} via la plateforme de crowdfunding de prêt ${_campaign.source.name}, ${_campaign.description || ''}, ${(_campaign.company || {}).name || ''}, ${(_campaign.company || {}).physicalLocation || ''}, ${((_campaign.company || {}).originalTags || []).join(' ')}`;
			} else if (_campaign.typology == 'real estate equity') {
				ogTitle = `Investir dans la plateforme de crowdfunding immobilier pour l'immobilier ${_campaign.fullAddress || ''}`;
				ogDescription = `Investir dans une plateforme d'equity crowdfunding pour l'immobilier ${_campaign.source.name} pour le projet ${_campaign.fullAddress || ''}, ${_campaign.description || ''}`;
			} else if (_campaign.typology == 'real estate lending') {
				ogTitle = `Effectuer un prêt via la plateforme de crowdfunding immobilier ${_campaign.source.name} pour le projet ${_campaign.fullAddress || ''}`;
				ogDescription = `Effectuer un prêt via la plateforme de crowdfunding immobilier ${_campaign.source.name} pour le projet ${_campaign.fullAddress || ''}, ${_campaign.description || ''}`;
			} else if (_campaign.typology == 'minibond') {
				ogTitle = `Faire un prêt via la plateforme de crowdfunding minibond ${_campaign.source.name} à ${_campaign.name}`;
				ogDescription = `Faire un prêt via la plateforme de crowdfunding minibond ${_campaign.source.name} à ${_campaign.name}, ${_campaign.description || ''}`;
			}

		} else if (this.translate.currentLang == 'es') {

			if (_campaign.typology == 'company equity') {
				ogTitle = `Invierta en la campaña de equity crowdfunding ${_campaign.name} de la plataforma ${_campaign.source.name}`;
				ogDescription = `Invierta en la campaña de equity crowdfunding ${_campaign.name} de la plataforma crowdfunding ${_campaign.source.name}, ${_campaign.description || ''}, ${(_campaign.company || {}).name || ''}, ${(_campaign.company || {}).physicalLocation || ''}, ${((_campaign.company || {}).originalTags || []).join(' ')}`;
			} else if (_campaign.typology == 'company lending') {
				ogTitle = `Hacer un préstamo a ${_campaign.name} a través de la plataforma de lending crowdfunding ${_campaign.source.name}`;
				ogDescription = `Hacer un préstamo a ${_campaign.name} a través de la plataforma de lending crowdfunding ${_campaign.source.name}, ${_campaign.description || ''}, ${(_campaign.company || {}).name || ''}, ${(_campaign.company || {}).physicalLocation || ''}, ${((_campaign.company || {}).originalTags || []).join(' ')}`;
			} else if (_campaign.typology == 'real estate equity') {
				ogTitle = `Invierte en la plataforma real estate crowdfunding por la propiedad ${_campaign.fullAddress || ''}`;
				ogDescription = `Invierte en la plataforma real estate equity crowdfunding en la plataforma ${_campaign.source.name} por la propiedad ${_campaign.fullAddress || ''}, ${_campaign.description || ''}`;
			} else if (_campaign.typology == 'real estate lending') {
				ogTitle = `Hacer un préstamo a través de la plataforma real estate crowdfunding ${_campaign.source.name} por la propiedad ${_campaign.fullAddress || ''}`;
				ogDescription = `Hacer un préstamo a través de la plataforma real estate crowdfunding ${_campaign.source.name} por la propiedad ${_campaign.fullAddress || ''}, ${_campaign.description || ''}`;
			} else if (_campaign.typology == 'minibond') {
				ogTitle = `Hacer un préstamo a través de la plataforma de minibond crowdfunding ${_campaign.source.name} a ${_campaign.name}`;
				ogDescription = `Hacer un préstamo a través de la plataforma de minibond crowdfunding ${_campaign.source.name} a ${_campaign.name}, ${_campaign.description || ''}`;
			}

		} else if (this.translate.currentLang == 'en') {
			
			if (_campaign.typology == 'company equity') {
				ogTitle = `Invest in equity crowdfunding campaign ${_campaign.name} of the platform ${_campaign.source.name}`;
				ogDescription = `Invest in equity crowdfunding campaign ${_campaign.name} of the crowdfunding platform ${_campaign.source.name}, ${_campaign.description || ''}, ${(_campaign.company || {}).name || ''}, ${(_campaign.company || {}).physicalLocation || ''}, ${((_campaign.company || {}).originalTags || []).join(' ')}`;
			} else if (_campaign.typology == 'company lending') {
				ogTitle = `Make a loan to ${_campaign.name} via the lending crowdfunding platform ${_campaign.source.name}`;
				ogDescription = `Make a loan to ${_campaign.name} via the lending crowdfunding platform ${_campaign.source.name}, ${_campaign.description || ''}, ${(_campaign.company || {}).name || ''}, ${(_campaign.company || {}).physicalLocation || ''}, ${((_campaign.company || {}).originalTags || []).join(' ')}`;
			} else if (_campaign.typology == 'real estate equity') {
				ogTitle = `Invest in real estate crowdfunding platform for real estate ${_campaign.fullAddress || ''}`;
				ogDescription = `Invest in real estate equity crowdfunding real estate platforms on the platform ${_campaign.source.name} for the property ${_campaign.fullAddress || ''}, ${_campaign.description || ''}`;
			} else if (_campaign.typology == 'real estate lending') {
				ogTitle = `Make a loan through the real estate crowdfunding platform ${_campaign.source.name} for the property ${_campaign.fullAddress || ''}`;
				ogDescription = `Make a loan through the real estate crowdfunding platform ${_campaign.source.name} for the property ${_campaign.fullAddress || ''}, ${_campaign.description || ''}`;
			} else if (_campaign.typology == 'minibond') {
				ogTitle = `Make a loan through the minibond crowdfunding platform ${_campaign.source.name} a ${_campaign.name}`;
				ogDescription = `Make a loan through the minibond crowdfunding platform ${_campaign.source.name} a ${_campaign.name}, ${_campaign.description || ''}`;
			}
		}

		this.titleService.setTitle(title);

		this.campaignService.generateTags({
			title,
			description: this.campaign.description,
			slug: this.campaign.systemTitle,
			image: this.campaign.background,
			ogTitle,
			ogDescription
		});

		if (fromService) {
			if (!(this.cdr as ViewRef).destroyed){
				this.cdr.detectChanges();
			}
		}

		if (this.map) {
			this.map.setMarkers([this.campaign]);
		}

		this.hasHousePictures = this.campaign.pictures && this.campaign.pictures.length;


	}
	goBack(id) {
		this.loadingSubject.next(false);
		const url = `/crowdfunding`;
		this.router.navigateByUrl(url);
	}
	async loadCampaigns(isSameCategory = true, isMore = true) {
		this.loadingSubject.next(true);

		const query = isSameCategory ? this.sameCategoryCampaignQuery : this.latestCampaignQuery;
		try {

			if (!isMore) {
				query.startRow = 0;
				query.endRow = 0;
			}
			const payload = lodash.cloneDeep(query);
			const res = await this.campaignService.get(payload, {
				company: 'name tags campaigns',
				source: 'name'
			});

			if (!isMore) {
				query.campaigns = [];
			}
			res.items.forEach(item => {
				query.campaigns.push({...campaign2htmlData(item, this.wallets, this.user), index: query.campaigns.length, followed: this.user && item.follows && item.follows.includes(this.user._id)});
			});
			query.startRow += res.items.length;
			query.endRow += res.items.length;
			query.totalCount = res.totalCount;
			if (!(this.cdr as ViewRef).destroyed){
				this.cdr.detectChanges();
			}

		} catch (error) {
		}

		this.loadingSubject.next(false);
	}
	async loadAdvertisements(typology) {
		this.loadingSubject.next(true);
		try {
			const res = await this.advertisementService.get({
				filterModel: {
					deleted: {
						filterType: 'ne',
						value: true
					}
				},
				pageSize: 9,
				sortModel: [],
				startRow: 0
			}, {
				typology,
        country: this.campaign.country,
				project: 'name description systemTitle logo logoSM backgroundSM background leftDays endDate startDate videoUrl raised status investorCount minimumGoal maximumGoal follows link typology roi roiAnnual holdingTime city address lat lng fullCity fullAddress minimumInvestment preMoneyEvaluation'
			});
			if (!res) {throw {};}

			this.advs.campaigns = res.items.filter( el => el.type == 'campaign').map( (el, index) => el.typeId? {...campaign2htmlData(el.campaign, this.wallets, this.user), index, advId: el._id}: {index, advId: el._id})
			.sort( (a, b) => Math.floor(Math.random() * 2) == 1 ? 1: -1);

			const advs = res.items.filter(el => el.type == 'source');
			this.advs.sources = [];
			for (let i = 0 ; i < advs.length; i++) {
				const adv = advs[i];
				if (adv.typeId && adv.source) {
					adv.detail = adv.detail || {};
					try {
						const res1 = await this.campaignService.get({
							filterModel: {
								'source.name': {
									filterType: 'eq',
									value: adv.source.name
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
						});
						console.log('res1 == ', res1);
						this.advs.sources.push({
							domain: (new URL(adv.source.link)).hostname,
							link: adv.source.link,
							description: adv.source.description,
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
		} catch (error) {
			console.log(error);
		}
		this.loadingSubject.next(false);
	}
	tag2category(param) {
		return tag2category(param);
	}

	async onClickFollowCampaign(param) {

		if (!this.checkUser()) {return;}

		this.loadingSubject.next(true);
		if (param) {
			const res = await this.campaignService.follow( param._id, this.user._id, !param.follows || !param.follows.includes(this.user._id) );
			if (!res) {throw {};}
			if (param.advId) {
				this.advs.campaigns.forEach( el => {
					if (el.advId == param.advId) {
						el.follows = res.follows;
						el.followed = res.follows.includes(this.user._id);
					}
				});
			}
			const campaign = this.sameCategoryCampaignQuery.campaigns.find( el => el._id == param._id);
			if (campaign) {
				campaign.follows = res.follows;
				campaign.followed = res.follows.includes(this.user._id);
			}
		} else {
			try {
				const res = await this.campaignService.follow( this.campaign._id, this.user._id, !this.campaign.follows || !this.campaign.follows.includes(this.user._id) );
				if (!res) {throw {};}
				this.campaign.follows = res.follows;
				this.campaign.followed = res.follows.includes(this.user._id);
			} catch (error) {
				console.log(error);
			}
		}
		this.cdr.detectChanges();
		this.loadingSubject.next(false);
	}
	async onClickWalletCampaign(param) {

		if (!this.checkUser()) {return;}

		try {

			if (param.wallet) {
				await this.walletService.deleteByIds([param.wallet]);
			} else {
				await this.onShowInvestAmountDialog(param._id);

				this.toastService.show(this.translate.instant('OTHERS.compaign_portfolio'),
					{ classname: '', delay: 6000, desc: this.translate.instant('OTHERS.go_personal_data'), action: '/account/overview/wallets' });
			}

			await this.loadWallets();
      const wallet = this.wallets.find( el => el.campaignId == this.campaign._id);
      this.campaign.wallet = wallet ? wallet._id: null;

		} catch (error) {
			console.log(error);
		}
		this.cdr.detectChanges();
	}
	onShowInvestAmountDialog(campaignId) {
		return new Promise( (resolve, reject) => {
			const modalRef = this.modal.open(InvestAmountDialog, { animation: false, size: 'sm'});
			const subscr = modalRef.closed.subscribe( async res => {
				try {
					if (!campaignId) {throw {};}
					if (!res) {throw {};}

					await this.walletService.create({
						user: this.user._id,
						campaign: campaignId,
						amountInvested: res,
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
	async onClickFollowCategory(categoryId) {

		if (!this.checkUser()) {return;}

		this.loadingSubject.next(true);
		if (categoryId) {
			if (!this.favoriteCategories.includes(categoryId)) {
				if (this.favoriteCategories.length >= 3) {
					this.toastService.show(this.translate.instant('GENERAL.CATEGORY_SELECTABLE_ERROR'),
					{ classname: '', delay: 6000, desc: this.translate.instant('GENERAL.CATEGORIES'), action: 'account/overview/categories' });
				} else {
					try {
						const res = await this.aliasService.follow(this.user._id, true, categoryId);
						if (res) {
							this.favoriteCategories.push(categoryId);
						}
					} catch (error) {
					}
					this.cdr.detectChanges();
				}
			} else {
				try {
					const res = await this.aliasService.follow(this.user._id, false, categoryId);
					if (res) {
						this.favoriteCategories = this.favoriteCategories.filter( c => c != categoryId);
					}
				} catch (error) {
				}
				this.cdr.detectChanges();
			}
		}
		this.loadingSubject.next(false);
	}
	async loadWallets() {

		try {
			if (!this.user) {throw {};}

			this.wallets = await this.walletService.getWalletCampaignsByUserId({
				userId: this.user._id
			});


		} catch (error) {
			this.wallets = [];
		}

	}

	initSlider() {

		const self = this;

		const getPrevSlide = async slider => {
			let result;
			const data = slider.slideData[0];
			if (data) {
				let curIndex = self.sameCategoryCampaignQuery.campaigns.indexOf(data);
				if (curIndex > 0) {
					curIndex--;
					try {
						while(curIndex >= 0) {
							if (self.sameCategoryCampaignQuery.campaigns[curIndex]) {
								result = self.sameCategoryCampaignQuery.campaigns[curIndex];
								throw {};
							}
							curIndex--;
						}
					} catch (error) {
					}
				}
			}
			return result;
		};
		const getNextSlide = async slider => {
			let result;
			if (slider.slideData.length) {
				let curIndex = self.sameCategoryCampaignQuery.campaigns.indexOf(slider.slideData[slider.slideData.length - 1]);
				if (curIndex >= 0) {
					curIndex++;
					try {
						while(curIndex < self.sameCategoryCampaignQuery.totalCount) {
							if (curIndex >= self.sameCategoryCampaignQuery.campaigns.length) {
								await self.loadCampaigns();
							}
							if (curIndex >= self.sameCategoryCampaignQuery.campaigns.length) {
								throw {};
							}
							if (self.sameCategoryCampaignQuery.campaigns[curIndex]) {

								result = self.sameCategoryCampaignQuery.campaigns[curIndex];
								throw {};
							}
							curIndex++;
						}
					} catch (error) {

					}
				}
			} else {
				result = self.sameCategoryCampaignQuery.campaigns[0];
			}
			return result;
		};

		const initSlide = async param => {
			param.prevSlides = 0;
			param.nextSlides = 0;
			param.slideData = [];
			let count = param.length * 2;
			for (var i = 0 ; i < count; i++ ) {
				try {
					const data = await getNextSlide(param);
					if (data) {
						param.slideData.push(data);
					}
				} catch (error) {
				}
			}
			param.nextSlides = Math.max((param.slideData.length - param.length), 0);
			count = param.slideData.length == 0? param.length * 2: param.length;
			for (var i = 0 ; i < count; i++ ) {
				try {
					const data = await getPrevSlide(param);
					if (data) {
						param.slideData.unshift(data);
						param.prevSlides++;
					}
				} catch (error) {

				}
			}
			if (param.slideData.length <= param.length) {
				param.nextSlides = 0;
				param.prevSlides = 0;
			}
		};

		const prevSlide = async param => { // prev
			param.prevSlides = 0;
			try {
				for (let i = 0 ; i < param.length; i++) {
					const data = await getPrevSlide(param);
					if (data) {
						param.slideData.unshift(data);
						param.prevSlides++;
					}
				}

			} catch (error) {
			}
		};

		const nextSlide = async param => { // next
			param.nextSlides = 0;
			try {
				for (let i = 0 ; i < param.length; i++) {

					const data = await getNextSlide(param);
					if (data) {
						param.slideData.push(data);
						param.nextSlides++;
					}
				}
			} catch (error) {
			}
		};

		this.sameCategoryCampaignsSlider.registerOnChange( initSlide, prevSlide, nextSlide);

	}

	date2string(param) {
		return date2string(param, this.locale, 'day');
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
					const res  = await this.userService.sendVerifyEmail([this.user._id]);
					if (res) {
						this.toastService.show (this.translate.instant('NOTIFICATION.GO_EMAIL_BOX'));
					}
				}
				setTimeout(() => subscr.unsubscribe(), 100);
			});
			return false;
		}

		return true;
	}
	async onClickDetailCampaign(param) {

		window.open(window.origin + '/crowdfunding/' + (param.systemTitle || ''));

		try {
			if (param.advId) {
				await this.advertisementService.action(param.advId, 'detail');
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
					await this.advertisementService.action(param.advId, 'external');
				}
        await this.campaignService.action(param._id, 'external');
			} catch (error) {
				console.log(error);
			}
		} catch (error) {
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
		KTUtil.ElementStyleUtil.set(document.getElementById('video_view'), 'display', 'none');
		const scrollY = document.body.style.top;
		document.body.style.position = '';
		document.body.style.top = '';
		window.scrollTo(0, parseInt(scrollY || '0') * -1);
	}

	async onClickMainVideo(){
		const frameContainer = document.querySelector('#main_campaign_video #video-container .frame-container');
		if (frameContainer && str2videoUrl(this.campaign.videoUrl)) {
			const videoFrame = document.createElement('iframe');
			videoFrame.allow = 'autoplay';
			videoFrame.setAttribute('allowfullscreen', '');
			videoFrame.src = str2videoUrl(this.campaign.videoUrl);
			videoFrame.style.zIndex = '2';
			frameContainer.innerHTML = '';
			frameContainer.appendChild(videoFrame);
			if (!(this.cdr as ViewRef).destroyed){
				this.cdr.detectChanges();
			}

			try {
				await this.campaignService.action(this.campaign._id, 'video', 'detail');
			} catch (error) {
				console.log(error);
			}
		}
	}
  onExpandCard(param) {
    this.expanded = param;
    this.expandedAdv = param;
  }

	/**
	 * 
	 */
	showSourceDetail(source) {
		sessionStorage.setItem('source_id', source?._id);
		window.open(window.origin + `/crowdfunding/source/${source?.name}`);
	}

	/**
	 * 
	 */
	showCategory(category) {
    window.open(window.origin + '/crowdfunding/category/' + (category.name || ''));
  }
}
