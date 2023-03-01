import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewChild, ViewRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { AuthService } from 'src/app/modules/auth';
import { CampaignService } from 'src/app/pages/common/campaign.service';
import { campaign2htmlData, date2string } from 'src/app/pages/common/common';
import { InvestAmountDialog } from 'src/app/pages/dialogs/invest-amount/invest-amount.dialog';
import { SplashScreenService } from 'src/app/_metronic/partials';
import { WalletService } from 'src/app/pages/common/wallet.service';
import { ToastService } from 'src/app/pages/common/toast.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-account-campaigns',
  templateUrl: './campaigns.component.html',
  styleUrls: ['./campaigns.component.scss']
})
export class CampaignsComponent implements OnInit, OnDestroy {
	loading = false;
	comingSoonCampaigns: any[] = [];
	followedCampaigns: any[] = [];
	campaigns: any[] = [];
	locale = 'it-IT';

	loadingSubject;
	loading$: Observable<boolean>;

	user;
	staging = false;
	typology = 'all';
  wallets = [];
	private unsubscribe: Subscription[] = [];

	get equityCampaignCount(): number {
		return this.followedCampaigns.filter(el => el.typology.indexOf('equity') >= 0).length;
	}
	get lendingCampaignCount(): number {
		return this.followedCampaigns.filter(el => el.typology.indexOf('lending') >= 0).length;
	}
	get minibondCampaignCount(): number {
		return this.followedCampaigns.filter(el => el.typology.indexOf('minibond') >= 0).length;
	}

	fieldsForList = {
		all: [
			'name',
			'typology',
			'description',
			// 'amountInvested',
			'minimumInvestment',
			'preMoneyEvaluation',
			'raised',
			'goal',
			'source',
			'categories',
			'investorCount',
			'duration',
			'status',
			'action'
		],
		equity: [
			'name',
			'typology',
			'description',
			// 'amountInvested',
			'minimumInvestment',
			'preMoneyEvaluation',
			'raised',
			'goal',
			'source',
			'categories',
			'investorCount',
			'duration',
			'status',
			'action'
		],
		lending: [
			'name',
			'typology',
			'description',
			// 'amountInvested',
			'minimumGoal',
			'minimumInvestment',
			'roiAnnual',
			'holdingTime',
			'duration',
			'source',
			'raised',
			'investorCount',
			'status',
			'action'
		]
	};
	rowForList = {
		equity: {
			width: 0,
		},
		lending: {
			width: 0
		},
		all: {
			width: 0
		}
	};
	optionsForTypology: any[] = [
		{
			label: 'OTHERS.all',
			value: 'all'
		},
		{
			label: 'OTHERS.Equity',
			value: 'equity'
		},
		{
			label: 'OTHERS.Lending',
			value: 'lending'
		},
	];

	@ViewChild('typologyCtrl', {static: true}) typologyCtrl;
	@ViewChild('listCtrl', {static: true}) listCtrl;

	constructor(
		private translate: TranslateService,
		private cdr: ChangeDetectorRef,
		public auth: AuthService,
		private campaignService: CampaignService,
		private splashScreenService: SplashScreenService,
    private walletService: WalletService,
    private toastService: ToastService,
    private modal: NgbModal
		) {

		this.loadingSubject = this.splashScreenService.loadingSubject;
      this.loading$ = this.loadingSubject.asObservable();
      this.user = this.auth.currentUserValue;
	}

	ngOnInit(): void {
		this.unsubscribe.push(this.auth.currentUserSubject.subscribe ( user => {
			this.user = user;
			this.staging = this.user && this.user.isAdmin;
		}));
		this.unsubscribe.push(this.translate.onLangChange.subscribe( lang => {
			this.updateByTranslate(lang.lang);
		}));
		this.updateByTranslate(this.translate.currentLang);
		this.loading$ = this.loadingSubject.asObservable();

		this.loadCampaigns();

		this.typologyCtrl.registerOnChange((param) => {
			this.onClickTypology(param.value);
		});
	}
	ngOnDestroy(): void {
		this.unsubscribe.forEach ( u => u.unsubscribe());
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
				userId: this.user._id
			});

			if (!res) {throw '';}

			this.wallets = res;

		} catch (error) {

			this.wallets = [];
		}
	}
	async loadCampaigns() {
		this.loadingSubject.next(true);
		try {
			const filterModel: any = {
				follows: {
					filterType: 'set',
					values: this.user ? [this.user._id]: [],
					isObject: true
				},
				// status: {
				// 	values: ['1_ongoing', '2_comingsoon'],
				// 	filterType: 'set'
				// },
				disabled: {
					filterType: 'ne',
					value: true
				},
				deleted: {
					filterType: 'ne',
					value: true
				}
			};

      await this.loadWallets();

			const res  = await this.campaignService.get({
				filterModel,
				sortModel: [{ colId: 'status', sort: 'asc'}, { colId: 'leftDays', sort: 'asc'}, { colId: 'description', sort: 'desc'}],
				startRow: 0,
				endRow: 0,
				pageSize: 100,
			}, {
			source: 'name link logo description'});

			if (!res) {throw {};}

			this.followedCampaigns = res.items.map( el => ({
					...campaign2htmlData(el, this.wallets, this.user),
				}));
			this.campaigns = this.followedCampaigns.filter( el => this.typology == 'all' || el.typology.indexOf(this.typology) >= 0);
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}

			this.optionsForTypology.forEach( el => {
				if (el.value == 'all') {
					el.count = this.followedCampaigns.length;
				} else {
					el.count = this.followedCampaigns.filter(ell => ell.typology.indexOf(el.value) >= 0).length;
				}
			});

		} catch (error) {
			console.log(error);
		}
		this.loadingSubject.next(false);
	}
	async onClickFollowCampaign(item) {
		this.loadingSubject.next(true);
		try {
			const follows = [...(item.follows || [])];
			if (follows.includes(this.user._id)) {
				await this.campaignService.follow( item._id, this.user._id, false );
				this.loadCampaigns();
			}

		} catch (error) {
			console.log(error);
		}
		this.cdr.detectChanges();
		this.loadingSubject.next(false);
	}

  async onClickWalletCampaign(param) {

		try {

			if (param.wallet) {
				await this.walletService.deleteByIds([param.wallet]);
			} else {
				await this.onShowInvestAmountDialog(param);

				this.toastService.show(this.translate.instant('OTHERS.compaign_portfolio'),
					{ classname: '', delay: 6000, desc: this.translate.instant('OTHERS.go_personal_data'), action: '/account/overview/wallets' });

			}

			await this.loadCampaigns();

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

	async go(param) {
		window.open(window.origin + '/crowdfunding/' + (param.systemTitle || ''));
	}

	onClickTypology(param) {
		this.typology = param;
		this.loadCampaigns();
	}

	getDateHolding(param, dxMonth): string {
		const date = new Date(param);
		date.setMonth(date.getMonth() + dxMonth);
		return date.toLocaleString(this.locale, {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
		});
	}
}
