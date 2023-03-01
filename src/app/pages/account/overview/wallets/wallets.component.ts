import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewChild, ViewRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { sortBy, cloneDeep, unionWith } from 'lodash';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexLegend, ApexNonAxisChartSeries, ApexResponsive, ApexTitleSubtitle, ApexXAxis, ApexYAxis } from 'ng-apexcharts';
import { AuthService } from 'src/app/modules/auth/_services/auth.service';
import { WalletService } from 'src/app/pages/common/wallet.service';
import { CampaignSelectDialog } from 'src/app/pages/dialogs/campaign-select/campaign-select.dialog';
import { InvestAmountDialog } from 'src/app/pages/dialogs/invest-amount/invest-amount.dialog';
import { campaign2htmlData, number2string } from 'src/app/pages/common/common';
import { SplashScreenService } from 'src/app/_metronic/partials/layout/splash-screen/splash-screen.service';
import { MainModalComponent } from 'src/app/_metronic/partials/layout/modals/main-modal/main-modal.component';
import { ToastService } from 'src/app/pages/common/toast.service';


export type HistogramChartOptions = {
	series: ApexAxisChartSeries;
	chart: ApexChart;
	xaxis: ApexXAxis;
	yaxis: ApexYAxis;
	title: ApexTitleSubtitle;
	dataLabels: ApexDataLabels;
};

export type PieChartOptions = {
	series: ApexNonAxisChartSeries;
	dataLabels: ApexDataLabels;
	chart: ApexChart;
	responsive: ApexResponsive[];
	labels: any;
	title: ApexTitleSubtitle;
	legend: ApexLegend;
	yaxis: ApexYAxis;
};

@Component({
  selector: 'app-account-wallets',
  templateUrl: './wallets.component.html',
  styleUrls: ['./wallets.component.scss']
})
export class WalletsComponent implements OnInit, OnDestroy {
	loading = false;
	comingSoonCampaigns: any[] = [];
	followedCampaigns: any[] = [];
	locale = 'it-IT';

	loadingSubject;
	loading$: Observable<boolean>;

	user;
	staging = false;
	typology = 'all';

	wallets = [];
	selectedWallets = [];
  mapMarkerCount = 0;

	fieldsForList = {
		all: [
			'name',
			'typology',
			'description',
			'amountInvested',
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
			'amountInvested',
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
			'amountInvested',
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

	optionsForView: any[] = [
		{
			label: 'OTHERS.Chart',
			value: 'chart',
			icon: './assets/media/svg/chart.svg',
		},
		{
			label: 'OTHERS.Tabella',
			value: 'list',
			icon: './assets/media/svg/table.svg',
		},
		{
			label: 'OTHERS.Mappa',
			value: 'map',
			icon: './assets/media/svg/map-pin.svg',
		},
	];

	get equityWalletCount(): number {
		return this.wallets.filter(el => el && el.typology.indexOf('equity') >= 0).length;
	}
	get lendingWalletCount(): number {
		return this.wallets.filter(el => el && el.typology.indexOf('lending') >= 0).length;
	}
	get minibondWalletCount(): number {
		return this.wallets.filter(el => el && el.typology.indexOf('minibond') >= 0).length;
	}

	totalAmountInvested = '0';
	totalInvestment = '0';
	byYearChartOptions: Partial<HistogramChartOptions>;
	byCategoryChartOptions: Partial<PieChartOptions>;
	bySourceChartOptions: Partial<PieChartOptions>;

	@ViewChild('map', {static: false}) map;
	@ViewChild('typologyCtrl', {static: true}) typologyCtrl;
	@ViewChild('viewCtrl', {static: true}) viewCtrl;

	view = 'chart';

	lang: any;

	private unsubscribe: Subscription[] = [];

	constructor(
		private translate: TranslateService,
		private cdr: ChangeDetectorRef,
		public auth: AuthService,
		private walletService: WalletService,
		private modal: NgbModal,
		private splashScreenService: SplashScreenService,
		private toastService: ToastService
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
			this.generateCharts();
		}));
		this.updateByTranslate(this.translate.currentLang);
		this.loading$ = this.loadingSubject.asObservable();

		this.loadWallets();

		this.viewCtrl.registerOnChange((param) => {
			this.onClickView(param.value);
		});
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
		this.lang = lang;
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
	getDateHolding(param, dxMonth): string {
		const date = new Date(param);
		date.setMonth(date.getMonth() + dxMonth);
		return date.toLocaleString(this.locale, {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
		});
	}

	async loadWallets() {
		this.loadingSubject.next(true);
		try {
			const res  = await this.walletService.get({
				filterModel: {
					user: {
						filterType: 'set',
						values: this.user ? [this.user._id]: [],
						isObject: true
					}
				},
				sortModel: [{ colId: 'createdAt', sort: 'asc'}],
				startRow: 0,
				endRow: 0,
				pageSize: 500,
			});

			if (!res) {throw {};}

			this.wallets = res.items.map( el => {
				const result = {...el, ...campaign2htmlData(el.campaign, [], this.user), campaign: undefined, walletId: el._id};
				try {
					if (result.typology.indexOf('lending') >= 0) {
					} else {
						if (result.amountInvested && (result.preMoneyEvaluation || result.raised)) {
							result.equityInvested = (result.amountInvested * 100 / (result.preMoneyEvaluation + result.raised));
							result.equityInvested = Math.round((result.equityInvested + Number.EPSILON) * 10000) / 10000;
						} else {
							result.equityInvested = result.equityOwned;
						}
					}
				} catch (error) {

				}
				return result;
			});

			this.optionsForTypology.forEach( el => {
				if (el.value == 'all') {
					el.count = this.wallets.length;
				} else {
					el.count = this.wallets.filter(ell => ell.typology.indexOf(el.value) >= 0).length;
				}
			});

			this.onClickTypology();


		} catch (error) {
			console.log(error);
		}

		this.cdr.detectChanges();

		this.loadingSubject.next(false);

	}

	generateCharts() {
		const dataBYear = this.selectedWallets.reduce( (carry, item) => {
			if (item && (item.endDate || item.startDate)) {
				const year = new Date(item.endDate || item.startDate).getFullYear();
				const itr = carry.find(el => el.year == year);
				const value = item.amountInvested ||
				(item.equityOwned /100 * (item.preMoneyEvaluation + (item.raisedDaily[0] || {}).value));
				if (value) {
					if (itr) {
						itr.value += value;
					} else {
						carry.push({
							year,
							value
						});
					}
				}
			}
			return carry;
		}, []).sort( (a, b) => parseInt(a.year) - parseInt(b.year));

		this.byYearChartOptions = {
			series: [
			  {
					name: '',
					data: dataBYear.map(el => Math.round((el.value + Number.EPSILON)))
			  }
			],
			chart: {
			  height: 350,
			  type: 'histogram',
			  toolbar: {
					show: false
			  }
			},
			title: {
			  text: 'By year'
			},
			xaxis: {
			  categories: dataBYear.map(el => el.year)
			},
			yaxis: {
				decimalsInFloat: 0,
				labels: {
					formatter: (value) => number2string(value) + ' €',
				}
			},
			dataLabels: {
				formatter: (val, opts) => number2string(val) + ' €'
			}
		};

		const dataByCategory = this.selectedWallets.reduce( (carry, item) => {
			const value = item.amountInvested ||
			(item.equityOwned /100 * (item.preMoneyEvaluation + (item.raisedDaily[0] || {}).value));
			if (value) {
				const tags: any[] = unionWith( item.company ? (item.company.tags || [] ) : (item.tags || []), (a, b) => a._id == b._id);
				if (tags.length > 0) {
					const itr = carry.find( el => el._id == tags[0]._id);
					if (itr) {
						itr.value += value;
					} else {
						carry.push({
							_id: tags[0]._id,
							value,
							label: (tags[0].names as Array<any>).find(itt => itt.language == this.lang) ? (tags[0].names as Array<any>).find(itt => itt.language == this.lang).value : tags[0].names[0].value
						});
					}
				}
			}
			return carry;
		}, []);

		this.byCategoryChartOptions = {
			title: {
				text: 'By categories'
			},
			series: dataByCategory.map(el => el.value),
			chart: {
				height: 550,
				type: 'pie'
			},
			yaxis: {
				decimalsInFloat: 0,
				labels: {
						formatter: (value) => number2string(value) + ' €',
				}
			},
			legend: {
				position: 'bottom',
				horizontalAlign: 'left',
				floating: false
			},
			labels: dataByCategory.map(el => el.label),
			// responsive: [
			// 	{
			// 	breakpoint: 480,
			// 	options: {
			// 		chart: {
			// 		width: 200
			// 		},
			// 		legend: {
			// 		position: 'bottom'
			// 		}
			// 	}
			// 	}
			// ]
		};

		const dataBySource = this.selectedWallets.reduce( (carry, item) => {
			const value = item.amountInvested ||
			(item.equityOwned /100 * (item.preMoneyEvaluation + (item.raisedDaily[0] || {}).value));
			if (value) {
				const itr = carry.find( el => el.label == item.source.name);
				if (itr) {
					itr.value += value;
				} else {
					carry.push({
						value,
						label: item.source.name
					});
				}
			}
			return carry;
		}, []);

		this.bySourceChartOptions = {
			title: {
				text: 'By source'
			},
			series: dataBySource.map(el => el.value),
			chart: {
				height: 550,
				type: 'pie'
			},
			legend: {
				position: 'bottom',
				horizontalAlign: 'left',
				floating: false
			},
			labels: dataBySource.map(el => el.label),
			// responsive: [
			// 	{
			// 	breakpoint: 480,
			// 	options: {
			// 		chart: {
			// 		width: 200
			// 		},
			// 		legend: {
			// 		position: 'bottom'
			// 		}
			// 	}
			// 	}
			// ],
			yaxis: {
				decimalsInFloat: 0,
				labels: {
					formatter: (value) => number2string(value) + ' €',
				}
			},
		};
	}
	async go(param) {
		window.open(window.origin + '/crowdfunding/' + (param.systemTitle || ''));
	}

	onClickTypology(param = null) {
		if (param) {
			this.typology = param;
		}

		this.selectedWallets = this.wallets.filter( el => this.typology == 'all' || el.typology.indexOf(this.typology) >= 0);

    this.mapMarkerCount = this.selectedWallets.filter( el => el.fullAddress).length;


		const totalAmountInvested = this.selectedWallets.reduce( (carry ,item) => {
			if (item.amountInvested) {
				carry+= item.amountInvested;
			} else if (item.equityOwned && (item.raisedDaily.length || item.preMoneyEvaluation)) {
				carry += item.equityOwned / 100 * (item.preMoneyEvaluation + item.raisedDaily[item.raisedDaily.length - 1].value);
			}
			return carry;
		},0 );
		this.totalAmountInvested = number2string(Math.round((totalAmountInvested + Number.EPSILON) * 100) / 100);
		this.totalInvestment = number2string(this.selectedWallets.length);

		this.generateCharts();

		if (this.view == 'map') {
			setTimeout(() => {
				if (this.map) {
					this.map.setMarkers(this.selectedWallets.filter(el => !el.hidden));
				}
			});
		}
		this.cdr.detectChanges();
	}
	onClickAdd() {
		const modalRef = this.modal.open(CampaignSelectDialog, { animation: false, size: 'xl', centered: true});
		modalRef.componentInstance.staging = this.staging;
		modalRef.componentInstance.filter = {
			_id: {
				filterType: 'set_r',
				values: this.wallets.map( el => el._id),
				isObject: true
			}
		};
		const subscr = modalRef.closed.subscribe( async res => {

			if (res) {
				setTimeout(() => {
					this.onShowInvestAmountDialog(res);
				});
			}
			setTimeout(() => subscr.unsubscribe(), 10);
		});
	}
	onShowInvestAmountDialog(param) {
		const modalRef = this.modal.open(InvestAmountDialog, { animation: false, size: 'md', centered: true});
		modalRef.componentInstance.amount = param[0].minimumInvestment || 100;
		const subscr = modalRef.closed.subscribe( async res => {
			try {
				if (!this.user) {throw {};}
				if (!param || param.length == 0) {throw {};}
				if (!res) {throw {};}

				await this.walletService.create({
					user: this.user._id,
					campaign: param[0]._id,
					amountInvested: modalRef.componentInstance.investmentType == 'amountInvested' ? res: undefined,
					equityOwned: modalRef.componentInstance.investmentType == 'equityOwned' ? res: undefined,
					investedDate: new Date()
				});
				this.loadWallets();
			} catch (error) {
			}
			setTimeout(() => subscr.unsubscribe(), 10);
		});
	}
	async onClickDelete(wallet) {
		const _description = 'USER.PROFILE.WALLET_CAMPAIGNS.REMOVE_COMPAIGN_WALLET';
		const _waitDescription = 'USER.PROFILE.WALLET_CAMPAIGNS.WALLET_DELETING';
		const _success = 'USER.PROFILE.WALLET_CAMPAIGNS.REMOVED_WALLET';

		const modalRef = this.modal.open(MainModalComponent, { animation: false});
		modalRef.componentInstance.modalData = {
			text: _description,
			yes: 'GENERAL.YES',
		};

		const subscr = modalRef.closed.subscribe ( async e => {
			if (e) {
				const res  = await this.walletService.deleteByIds([wallet.walletId]);
				if (res) {
					this.toastService.show(this.translate.instant(_success));
					this.loadWallets();
				}
			}
			setTimeout(() => subscr.unsubscribe(), 100);
		});

	}

	async onClickView(param) {
		this.view = param;
		if (param == 'map') {
			setTimeout(() => {
				if (this.map) {
					this.map.setMarkers(this.selectedWallets);
				}
			});
		}
		this.cdr.detectChanges();
	}

	onUpdateInvest(param) {
		const modalRef = this.modal.open(InvestAmountDialog, { animation: false, size: 'sm'});
		modalRef.componentInstance.amount = param.amountInvested;
		const subscr = modalRef.closed.subscribe( async res => {
			try {
				if (!res) {throw {};}
				await this.walletService.update({
					_id: param.walletId,
					amountInvested: modalRef.componentInstance.investmentType == 'amountInvested' ? res: undefined,
					equityOwned: modalRef.componentInstance.investmentType == 'equityOwned' ? res: undefined
				});
				this.loadWallets();
			} catch (error) {
			}
			setTimeout(() => subscr.unsubscribe(), 10);
		});
	}
}
