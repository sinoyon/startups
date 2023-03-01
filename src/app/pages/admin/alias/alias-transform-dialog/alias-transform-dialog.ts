// Angular
import { Component, OnInit, ViewChild, ChangeDetectionStrategy, OnDestroy, ViewRef, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription, BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { union } from 'lodash';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AliasService } from 'src/app/pages/common/alias.service';

@Component({
	selector: 'app-alias-transform-dialog',
	templateUrl: './alias-transform-dialog.html',
	styleUrls: ['./alias-transform-dialog.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AliasTransformDialog implements OnInit, OnDestroy {

	locale = 'it-IT';
	loadingSubject = new BehaviorSubject<boolean>(true);
	loading$: Observable<boolean>;

	selectableLanguages = [];
	aliasIds = [];
  fromLanguage;

	@ViewChild('languageSelector', {static: true}) languageSelector;

	private unsubscribe: Subscription[] = [];

	constructor(
			private cdr: ChangeDetectorRef,
			private translate: TranslateService,
			public modal: NgbActiveModal,
			private aliasService: AliasService
		) {

		this.loading$ = this.loadingSubject.asObservable();
	}

	ngOnInit() {
		this.unsubscribe.push(this.translate.onLangChange.subscribe( lang => {
			this.updateByTranslate(lang.lang);
		}));
		this.updateByTranslate(this.translate.currentLang);
	}

	ngOnDestroy() {
		this.unsubscribe.forEach(el => el.unsubscribe());
	}

	init(aliasIds, fromLanguage) {
		this.aliasIds = aliasIds;
    this.fromLanguage = fromLanguage;
    this.languageSelector.options = [
      { label: 'Italian', value: 'it'},
      { label: 'Spain', value: 'es'},
      { label: 'France', value: 'fr'},
      { label: 'Germany', value: 'de'},
      { label: 'English', value: 'en'}
    ].filter( el => el.value != fromLanguage);


		this.loadingSubject.next(false);
	}

	async onClickYes() {
		this.loadingSubject.next(true);
		try {

      if (!this.languageSelector.value || !this.fromLanguage) throw {};
      await this.aliasService.transform(this.aliasIds, this.fromLanguage, this.languageSelector.value);
			this.modal.close();
		} catch (error) {

		}
		this.loadingSubject.next(false);
	}
	updateByTranslate(lang){
		if (lang == 'en') {
			this.locale = 'en-US';
		} else if (lang == 'it') {
			this.locale = 'it-IT';
		}
	}
}
