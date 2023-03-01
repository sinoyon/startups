// Angular
import { Component, OnInit, OnDestroy, ChangeDetectorRef, Input, HostListener, ElementRef, ViewChild } from '@angular/core';
import { TranslationService } from 'src/app/modules/i18n';
import { LayoutService } from '../../..';

const LOCALIZATION_LOCAL_STORAGE_KEY = 'language';

@Component({
	selector: 'app-language-selector',
	templateUrl: './language-selector.component.html',
})
export class LanguageSelectorComponent implements OnInit, OnDestroy {

	options = [
        { label: 'OTHERS.Italian', value: 'it', country: 'italy'},
        { label: 'OTHERS.Spanish', value: 'es', country: 'spain'},
        { label: 'OTHERS.Franch', value: 'fr', country: 'france'},
        // { label: 'OTHERS.Germany', value: 'de', country: 'german'},
        { label: 'OTHERS.English', value: 'en', country: 'england'}
	];
	selectedOption: any;
	opened = false;

	constructor(
		private elRef: ElementRef,
		private cdr: ChangeDetectorRef,
		private translationService: TranslationService
		) {
			this.translationService.changeLangSubject.subscribe(lang => {
				if (lang) {
					this.selectedOption = this.options.find( el => el.value == lang);
					if (this.selectedOption) {
						this.onChange(this.selectedOption);
					}

					this.cdr.detectChanges();
				}
			});
	}

	ngOnInit(): void {
		this.selectedOption = this.options.find( el => el.value == localStorage.getItem(LOCALIZATION_LOCAL_STORAGE_KEY));
		if (!this.selectedOption) {
			this.selectedOption = this.options[0];
			localStorage.setItem(LOCALIZATION_LOCAL_STORAGE_KEY, this.selectedOption.value);
		}
	}
	ngOnDestroy(): void {

	}

	optionSelect(option: any, event: MouseEvent) {
		event.stopPropagation();
		this.selectedOption = option;
		// this.onChange(option);
		this.opened = false;
		// this.cdr.detectChanges();
		localStorage.setItem(LOCALIZATION_LOCAL_STORAGE_KEY, this.selectedOption.value);
		// window.location.reload();
		this.translationService.changeLangSubject.next(this.selectedOption.value);
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
		this.selectedOption = this.options.find( el => el.value == param) || this.options.find( el => el.value == 'it');
		return this.selectedOption.value;
	}
}
