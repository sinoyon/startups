// Angular
import { Component, Output, EventEmitter, ViewChild, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, ViewRef, Input, forwardRef, Renderer2, HostBinding, HostListener } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TransactionService } from 'src/app/pages/common/transaction.service';
import { KTUtil } from 'src/app/_metronic/kt';


@Component({
	selector: 'app-crowdfunding-filter',
	templateUrl: './filter.component.html',
	styleUrls: ['./filter.component.scss'],
	providers: [
		{
		  provide: NG_VALUE_ACCESSOR,
		  useExisting: forwardRef(() => FilterComponent),
		  multi: true,
		}
	]
})
export class FilterComponent implements OnInit, OnDestroy {

	openedScope;
	options: any[] = [];
	favoriteCategories = [];
	typology = 'equity';

	scopes: any = [
		{
			typology: 'equity',
			items: [
				{ scopeType: 'checkbox', type: 'status', checkbox: true},
				{ scopeType: 'selectbox', label: 'GENERAL.CATEGORIES', type: 'category'},
				{ scopeType: 'selectbox', label: 'GENERAL.MINIMUM_INVESTMENT', type: 'minimumInvestment'},
				{ scopeType: 'selectbox', label: 'GENERAL.PRE_MONEY_EVALUATION', type: 'preMoneyEvaluation'},
				{ scopeType: 'selectbox', label: 'GENERAL.SOURCE', type: 'source'},
			]
		},
		{
			typology: 'lending',
			items: [
				{ scopeType: 'checkbox', type: 'status', checkbox: true},
				{ scopeType: 'selectbox', label: 'GENERAL.CATEGORIES', type: 'category'},
				{ scopeType: 'selectbox', label: 'CAMPAIGNS.LIST.ROI_ANNUAL', type: 'roiAnnual'},
				{ scopeType: 'selectbox', label: 'GENERAL.HOLDING_TIME', type: 'holdingTime'},
				{ scopeType: 'selectbox', label: 'GENERAL.MINIMUM_INVESTMENT', type: 'minimumInvestment'},
				{ scopeType: 'selectbox', label: 'GENERAL.SOURCE', type: 'source'},
			]
		}
	];

	constructor(private transactionService: TransactionService,
		public modal: NgbActiveModal) {
	}

	ngOnInit(): void {
	}
	ngOnDestroy(): void {

	}

	optionSelect(option: any, event , close = false) {
		event.stopPropagation();
		if (option.selected) {
			this.saveTransaction(option);
		}
	}

	async saveTransaction(option) {
		let type; const n_value = -1; let typeId;

		var country = 'italy';
		if (sessionStorage.getItem('country')) {
			country = sessionStorage.getItem('country');
		}
		if (country == 'europe') {
			country = null;
		}

    try {
      if ([
        'source',
        'category',
      ].includes(option.type)) {
        await this.transactionService.create({
          type: option.type,
          value: -1,
          ref: option.value,
					country: country
        });
      } else if ([
        'minimumInvestment',
        'holdingTime',
        'roiAnnual',
        'typology',
        'preMoneyEvaluation'
      ].includes(option.type)) {
        await
        this.transactionService.create({
          type: 'home.filter.' + option.type,
          value: -1,
          name: option.value,
					country: country
        });
      }

    } catch (error) {

    }
	}

	toggleOpen(param) {
		if (this.openedScope && this.openedScope == param) {
			this.openedScope = null;
		} else {
			this.openedScope = param;
		}
	}

	@HostListener('document:mousedown', ['$event'])
	onClick($event) {
		if (!$event.target.closest('#crowdfunding_filter div[data-opended=true]')) {
			this.openedScope = null;
		}
	}

	clear(type = null) {
		this.options.forEach( el => {
			if (type) {
				if (type == el.type) {
					el.selected = false;
				}
			} else {
				el.selected = false;
			}
		});
	}
	select(type) {
		this.options.forEach( el => {
			if (type == el.type) {
				el.selected = true;
			}
		});
	}
}
