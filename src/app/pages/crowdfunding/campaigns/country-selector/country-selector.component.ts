// Angular
import { Component, OnInit, OnDestroy, ChangeDetectorRef, Input, HostListener, ElementRef, EventEmitter, Output } from '@angular/core';
import { CountryService } from 'src/app/pages/common/country.service';

@Component({
	selector: 'app-crowdfunding-country-selector',
	templateUrl: './country-selector.component.html',
})
export class CountrySelectorComponent implements OnInit, OnDestroy {

	options: any[] = [
		{
			label: 'Europe',
			value: 'europe'
		},
		{
			label: 'Italy',
			value: 'italy'
		}
	];
	selectedOption: any;
	opened = false;

	@Input() user;
  @Output('checkUser') checkUserEvent = new EventEmitter<any>();

	constructor(
		private elRef: ElementRef,
		private cdr: ChangeDetectorRef) {
	}

	ngOnInit(): void {
		
	}
	ngOnDestroy(): void {

	}

	optionSelect(option: any, event: MouseEvent) {
		event.stopPropagation();
    // if (this.user) {
			this.selectedOption = option;
		  this.onChange(option);
		// } else {
		// 	this.checkUserEvent.emit();
		// }

		this.opened = false;
		this.cdr.detectChanges();
	}
	toggleOpen(event: MouseEvent) {
		// if (this.user && this.user.isAdmin) {
			this.opened = !this.opened;
		// }
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
		// if (this.user && this.user.isAdmin) {
			this.selectedOption = this.options.find( el => el.value == param) || this.options.find( el => el.value == 'italy') || this.options.find( el => el.value == 'europe');
		// } else {
		// 	this.selectedOption = this.options.find( el => el.value == 'italy');
		// }
		return this.selectedOption.value;
	}
}
