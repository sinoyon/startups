// Angular
import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener, ElementRef, Output, EventEmitter, Input } from '@angular/core';
import { TransactionService } from 'src/app/pages/common/transaction.service';

@Component({
	selector: 'app-crowdfunding-sort-selector',
	templateUrl: './sort-selector.component.html',
})
export class SortSelectorComponent implements OnInit, OnDestroy {

	options: any[] = [
		{
			label: 'GENERAL.PRIORITY',
			colId: 'leftDays',
			sort: 'asc',
			iconClass: 'fa fa-calendar-alt',
		},
		{
			label: 'GENERAL.MOST_FUNDED',
			colId: 'raised',
			sort: 'desc',
			iconClass: 'fa fa-euro-sign',
		},
		{
			label: 'GENERAL.WITH_MOST_INVESTORS',
			colId: 'investorCount',
			sort: 'desc',
			iconClass: 'fa fa-users',
		},
		{
			label: 'GENERAL.WITH_MOST_ROIANNUAL',
			colId: 'roiAnnual',
			sort: 'desc',
			iconClass: 'fa fa-euro-sign',
		},
		{
			label: 'GENERAL.HOLDING_TIME',
			colId: 'holdingTime',
			sort: 'desc',
			iconClass: 'fa fa-hourglass-half',
		},

	];
	selectedOption: any;
	opened = false;

	@Input() user;
	@Output('checkUser') checkUserEvent = new EventEmitter<any>();

	constructor(
		private transactionService: TransactionService,
		private elRef: ElementRef,
		private cdr: ChangeDetectorRef) {
	}

	ngOnInit(): void {
		this.selectedOption = this.options.find(el => el.colId == 'leftDays');
	}
	ngOnDestroy(): void {

	}

	optionSelect(option: any, event: MouseEvent) {
		event.stopPropagation();
		if (this.user || option.colId == 'leftDays') {
			this.selectedOption = option;
			this.saveTransaction(option);
			this.onChange(option);
		} else {
			this.checkUserEvent.emit();
		}
		this.opened = false;
		this.cdr.detectChanges();
	}
	toggleOpen(event: MouseEvent) {
		this.opened = !this.opened;
	}
	onChange: any = (param) => {
	};

	@HostListener('document:mousedown', ['$event'])
	onClick($event: MouseEvent) {
		if (!this.elRef.nativeElement.contains($event.target)) {
			this.opened = false;
		}
	}

	registerOnChange(fn) {
		this.onChange = fn;
	}
	writeValue(param) {
	}

	async saveTransaction(option) {
		if (!option) {return;}

		var country = 'italy';
		if (sessionStorage.getItem('country')) {
			country = sessionStorage.getItem('country');
		}
		if (country == 'europe') {
			country = null;
		}

		const type = 'home.sort.' + option.colId;

		if (!type) {return;}

    try {

      await
      this.transactionService.create({
        type: type,
        value: -1,
        name: null,
				country: country
      });
    } catch (error) {
    }
	}
}
