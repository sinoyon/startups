// Angular
import { Component, Output, EventEmitter, ViewChild, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, HostBinding, Input, HostListener, Renderer2, forwardRef, ViewRef, AfterViewInit } from '@angular/core';
import { KTUtil } from '../../../_metronic/kt/index';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CampaignService } from 'src/app/pages/common/campaign.service';
import { TransactionService } from 'src/app/pages/common/transaction.service';
import { each } from 'lodash';
import { Platform } from '@angular/cdk/platform';

@Component({
	selector: 'app-crowdfunding-list',
	templateUrl: './list.component.html',
	styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit, OnDestroy, AfterViewInit{

	@Input() campaigns = [];
	@Input() typology;
	@Input() advIds = [];
	@Input() fixHeader = true;
	@Input() editable = false;
	@Input() deletable = false;
	@Input() followable = true;
	@Input() walletable = true;
	listHeaderTop;

	@Input() fields = {
		equity: [
			'name',
			'typology',
			'description',
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
	@Input() row = {
		equity: {
			width: 0,
		},
		lending: {
			width: 0
		}
	};

	scrollLeft = 0;
	columns = {
		name: {
			width: 200,
			label: 'CAMPAIGNS.LIST.NAME'
		},
		typology: {
			width: 150,
			label: 'GENERAL.TYPOLOGY'
		},
		goal: {
			width: 150,
			label: 'CAMPAIGNS.LIST.OBJECT_MIN_MAX'
		},
		minimumGoal: {
			width: 150,
			label: 'CAMPAIGNS.LIST.OBJETC',
			preUnit: '€ '
		},
		amountInvested: {
			width: 150,
			label: 'CAMPAIGNS.LIST.INVESTOR',
			preUnit: '€ '
		},
		minimumInvestment: {
			width: 100,
			label: 'CAMPAIGNS.LIST.INV_MINIUM',
			preUnit: '€ '
		},
		roiAnnual: {
			width: 100,
			label: 'CAMPAIGNS.LIST.ROI_ANNUAL',
			unit: ' %'
		},
		holdingTime: {
			width: 120,
			label: 'CAMPAIGNS.LIST.INVEST_DURATION',
			unit: ' mesi'
		},
		duration:{
			width: 130,
			label: 'CAMPAIGNS.LIST.COMPAIGN_DURATION'
		},
		source: {
			width: 150,
			label: 'CAMPAIGNS.LIST.PLATFORM'
		},
		raised: {
			width: 150,
			label: 'CAMPAIGNS.LIST.CAPITAL_INCESTED',
			preUnit: '€ '
		},
		investorCount: {
			width: 130,
			label: 'CAMPAIGNS.LIST.NUMBER_INVESTORS'
		},
		status: {
			width: 150,
			label: 'CAMPAIGNS.LIST.STATE'
		},
		description: {
			width: 300,
			label: 'CAMPAIGNS.LIST.DESCRIPTION'
		},
		preMoneyEvaluation: {
			width: 150,
			label: 'CAMPAIGNS.LIST.COMPANY_EVAL',
			preUnit: '€ '
		},
		categories: {
			width: 200,
			label: 'GENERAL.CATEGORIES'
		},
		action: {
			label: '',
			width: 80
		}
	};

	scrollcb;

	isMobile = false;

	@Output('followClick') followClickEvent = new EventEmitter<any>();
	@Output('walletClick') walletClickEvent = new EventEmitter<any>();
	@Output('editClick') editClickEvent = new EventEmitter<any>();
	@Output('deleteClick') deleteClickEvent = new EventEmitter<any>();

	constructor(
		private cdr: ChangeDetectorRef,
		private elRef: ElementRef,
		private campaignService: CampaignService,
		private platform: Platform
		) {
			this.isMobile = this.platform.ANDROID || this.platform.IOS;
	}

	ngOnInit(): void {
		each(this.row, (value, key) => {
			value.width = this.fields[key].reduce((carry, item) => carry + this.columns[item].width, 0);
		});
	}
	ngOnDestroy(): void {
		window.removeEventListener('scroll', this.scrollcb);
	}

	ngAfterViewInit() {

		setTimeout(() => {
			try {
				const listHeaderOffsetTop = document.getElementById('list_header').getBoundingClientRect().top;
				const listHeaderTop = listHeaderOffsetTop;
				let ticking = false;
				const self = this;
				this.scrollcb = (e) => {
					const st = KTUtil.getScrollTop();
					this.scrollLeft = document.getElementById('crowdfunding_list').scrollLeft;
					if (!ticking) {
						window.requestAnimationFrame(function() {
							const listHeaderEl = document.getElementById('list_header');
							if (st + 50 > listHeaderTop && self.fixHeader) {
								KTUtil.ElementStyleUtil.set(listHeaderEl, 'position', 'fixed');
								KTUtil.ElementStyleUtil.set(listHeaderEl, 'top', '60px');
								KTUtil.ElementStyleUtil.set(listHeaderEl, 'left', -self.scrollLeft + 'px' );
							} else {
								KTUtil.ElementStyleUtil.set(listHeaderEl, 'position', 'relative');
								KTUtil.ElementStyleUtil.set(listHeaderEl, 'top', '0');
								KTUtil.ElementStyleUtil.set(listHeaderEl, 'left', '0' );
							}
							ticking = false;
						});
						ticking = true;
					}
					self.cdr.detectChanges();
				};
				window.addEventListener('scroll', this.scrollcb);
				document.getElementById('crowdfunding_list').addEventListener('scroll', this.scrollcb);
			} catch (error) {
				console.log(error);
			}
		});
	}
	onClickReadmoreDescription(param) {
	}

	async go(param, internal = false, except = null, evt = null) {
		if (except && evt && evt.target.closest(except)) {
			return;
		}
		if (internal) {
			// window.open(window.origin + '/crowdfunding/' + (param.systemTitle || ''));
		} else {
			try {
				const url = new URL(param.link);
				url.search += 'utm_source=startupswallet&utm_medium=web&utm_content=home';
				window.open(url.href);
				try {
					await this.campaignService.action(param._id, 'external');
				} catch (error) {
					console.log(error);
				}
			} catch (error) {
			}
		}

	}


  async onClick(e = null, param, except = null) {
		if (e && except && e.target.closest(except)) {
			return;
		}
		try {
				const url = new URL(param.link);
				url.search += 'utm_source=startupswallet&utm_medium=web&utm_content=home';
				window.open(url.href);
				try {
					await this.campaignService.action(param._id, 'external');
				} catch (error) {
					console.log(error);
				}
			} catch (error) {
			}
	}

	onDblClick(e = null, param, except = null) {
		if (e && except && e.target.closest(except)) {
			return;
		}
		window.open(window.origin + '/crowdfunding/' + (param.systemTitle || ''));
	}
}
