// Angular
import { Component, OnInit, ViewChild, ChangeDetectionStrategy, OnDestroy, ViewRef, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription, BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { union } from 'lodash';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AliasService } from 'src/app/pages/common/alias.service';
import { lang } from 'moment';

@Component({
	selector: 'app-alias-merge-dialog',
	templateUrl: './alias-merge-dialog.html',
	styleUrls: ['./alias-merge-dialog.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AliasMergeDialog implements OnInit, OnDestroy {

	locale = 'it-IT';
	loadingSubject = new BehaviorSubject<boolean>(true);
	loading$: Observable<boolean>;

	isMergeToCategory = true;
	names = [];
	values = [];
	type;
	selectableCategories = [];
	aliases = [];
  language;
	selectedLang;

	@ViewChild('mainAliasSelector', {static: false}) mainAliasSelector;
	@ViewChild('categorySelector', {static: false}) categorySelector;
	@ViewChild('languageSelector') languageSelector;

	languages = [
		{
			value: 'it',
			label: 'Italian',
		},
		{
			value: 'es',
			label: 'Spanish',
		},
		{
			value: 'de',
			label: 'Germany',
		},
		{
			value: 'fr',
			label: 'French',
		},
		{
			value: 'en',
			label: 'English',
		}
	];

	private unsubscribe: Subscription[] = [];

	constructor(
			private activatedRoute: ActivatedRoute,
			private cdr: ChangeDetectorRef,
			private router: Router,
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

		if (this.languageSelector) {
			this.languageSelector.registerOnChange( (value) => {
				this.init(this.aliases, value);
			});
		}
	}

	ngOnDestroy() {
		this.unsubscribe.forEach(el => el.unsubscribe());
	}

	init(aliases, language) {
		this.aliases = aliases;
    this.language = language;
		this.isMergeToCategory = this.aliases.length == 1;
		this.values = this.aliases.reduce( ( re, cur) => union( re, cur.synonyms.map( el => el.value)), []);
		this.names = this.aliases.map (el => ({
				label: el.ignore ? 'ignore aliases': el.names[0].value,
				value: el.id
			}));
		this.type = this.aliases[0].type;
		setTimeout(() => {
			const selectedAlias = aliases.find( el => el.ignore || (!el.ignore && el.synonyms && el.synonyms.length > 1));
			if (this.mainAliasSelector && selectedAlias) {
				this.mainAliasSelector.writeValue(selectedAlias._id);
			}
		}, 1000);

		this.loadingSubject.next(false);
	}

	async onClickYes() {
		this.loadingSubject.next(true);
		try {
			await this.aliasService.merge(union(this.aliases.map( el => el.id), this.isMergeToCategory ?[this.categorySelector.value]: []), this.isMergeToCategory? this.categorySelector.value: this.mainAliasSelector.value, null);
			this.modal.close();
		} catch (error) {

		}
		this.loadingSubject.next(false);
	}
	searchCategoriesCb = async (keyword) => {
		try {
			const payload = {
				filterModel: {
					synonyms: {
						filterType: 'size_gt',
						value: 1
					},
					type: {
						filterType: 'text',
						filter:  this.type
					},
					_id: {
						filterType: 'set_r',
						values: this.aliases.map( el => el.id)
					},
					name: {
						or: true,
						filter: [[{
							key: 'names.value',
							filterType: 'text',
							filter: keyword
						}], [{
							key: 'synonyms.value',
							filterType: 'text',
							filter: keyword
						}]]
					},
          'synonyms.language': {
            filterType: 'text',
            filter: this.language
					}
				},
				sortModel: [
					{ colId: 'name', sort: 'asc'}
				],
				startRow: 0,
				endRow: 0,
				pageSize: 30,
				totalCount: 0,
				result: []
			};
			const res = await this.aliasService.get(payload);
			if (!res) {throw {};}
			this.selectableCategories = res.items.map ( item => ({
					label: item.ignore? 'ignore aliases' : item.names[0].value,
					value: item._id,
					synonyms: item.synonyms
				}));
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		} catch (error) {
			console.log(error);
		}
	};
	updateByTranslate(lang){
		if (lang == 'en') {
			this.locale = 'en-US';
		} else if (lang == 'it') {
			this.locale = 'it-IT';
		}
	}


	getDateTimeFromDate(param): string {
		const date = new Date(param);
		return date.toLocaleString(this.locale, {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		}).replace(', ', ', h:');

	}
}
