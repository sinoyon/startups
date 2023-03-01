// Angular
import { Component, OnInit, ViewChild, ChangeDetectionStrategy, OnDestroy, ViewRef, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription, BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { union, unionWith } from 'lodash';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AliasService } from 'src/app/pages/common/alias.service';

@Component({
	selector: 'app-alias-move-dialog',
	templateUrl: './alias-move-dialog.html',
	styleUrls: ['./alias-move-dialog.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AliasMoveDialog implements OnInit, OnDestroy {

	locale = 'it-IT';
	loadingSubject = new BehaviorSubject<boolean>(true);
	loading$: Observable<boolean>;

	type;
	fromId;
	selectableCategories = [];
	synonyms = [];

	@ViewChild('categorySelector', {static: false}) categorySelector;

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
	}

	ngOnDestroy() {
		this.unsubscribe.forEach(el => el.unsubscribe());
	}

	init(synonyms, id, type) {
		this.synonyms = synonyms;
		this.fromId = id;
		this.type = type;
		this.loadingSubject.next(false);
	}

	async onClickYes() {
		this.loadingSubject.next(true);
		try {

			if (!this.categorySelector.value) {throw {};}

			const alias = await this.aliasService.getById(this.categorySelector.value);
			await this.aliasService.update({
				_id: alias._id,
				synonyms: unionWith(alias.synonyms, this.synonyms, (a, b) => a.country == b.country && a.value == b.value)
			});
			this.modal.close();
		} catch (error) {
			console.log(error);
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
						values: [this.fromId],
						isObject: true
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
