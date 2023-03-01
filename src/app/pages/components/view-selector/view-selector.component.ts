// Angular
import { Component, OnInit, OnDestroy, ChangeDetectorRef, Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthDialog } from 'src/app/modules/auth/auth.dialog';

@Component({
	selector: 'app-crowdfunding-view-selector',
	templateUrl: './view-selector.component.html',
})
export class ViewSelectorComponent implements OnInit, OnDestroy {

	@Input() options: any[] = [
		{
			label: 'OTHERS.Mappa',
			value: 'map',
			icon: './assets/media/svg/map-pin.svg',
		},
		{
			label: 'OTHERS.Tabella',
			value: 'list',
			icon: './assets/media/svg/table.svg',
		},
		{
			label: 'OTHERS.Cards',
			value: 'card',
			icon: './assets/media/svg/card.svg',
		},
		// {
		// 	label: 'Pitch TV',
		// 	value: 'video',
		// 	icon: './assets/media/svg/play.svg',
		// 	icon_white: './assets/media/svg/play-white.svg'
		// },
	];
	selectedOption: any;
	opened = false;

	@Input() user;

	constructor(
		private modal: NgbModal,
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

	registerOnChange(fn) {
		this.onChange = fn;
	}
	writeValue(param) {
		if (this.user && this.user.emailConfirmed) {
			this.selectedOption = this.options.find( el => el.value == param) || this.options.find( el => el.value == 'card');
		} else {
			this.selectedOption = this.options.find( el => el.value == 'card');
		}
		return this.selectedOption.value;
	}
}
