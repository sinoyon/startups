// Angular
import { Component, OnInit, OnDestroy, ChangeDetectorRef, Input, ElementRef, HostListener } from '@angular/core';

@Component({
	selector: 'app-crowdfunding-typology-selector',
	templateUrl: './typology-selector.component.html',
})
export class TypologySelectorComponent implements OnInit, OnDestroy {

	@Input() options: any[] = [
		{
			label: 'OTHERS.Equity',
			value: 'equity'
		},
		{
			label: 'OTHERS.Lending',
			value: 'lending'
		},
	];
	selectedOption: any;
	opened = false;

	constructor(
		private elRef: ElementRef,
		private cdr: ChangeDetectorRef) {
	}

	ngOnInit(): void {
		this.selectedOption = this.options[0];
	}
	ngOnDestroy(): void {

	}

	optionSelect(option: any, event: MouseEvent) {
		event.stopPropagation();
		this.selectedOption = option;
		this.onChange(option);
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
		this.selectedOption = this.options.find( el => el.value == param) || this.options[0];
		return this.selectedOption.value;
	}
}
