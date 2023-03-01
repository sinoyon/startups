import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { sortBy} from 'lodash';
import { Router } from '@angular/router';
import { AliasService } from 'src/app/pages/common/alias.service';
import { AuthService } from 'src/app/modules/auth/_services/auth.service';
import { CampaignService } from 'src/app/pages/common/campaign.service';
import { SplashScreenService } from 'src/app/_metronic/partials';
import { ToastService } from 'src/app/pages/common/toast.service';
import { tag2category } from 'src/app/pages/common/common';
import * as e from 'express';

@Component({
  selector: 'app-account-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit, OnDestroy {
	categories: any[] = [];
	loading = false;
	comingSoonCampaigns: any[] = [];
	followedCampaigns: any[] = [];
	locale = 'it-IT';

	loadingSubject;
	loading$: Observable<boolean>;

	user;
	private subscriptions: Subscription[] = [];

	constructor(
		private translate: TranslateService,
		private aliasService: AliasService,
		private cdr: ChangeDetectorRef,
		public auth: AuthService,
		private campaignService: CampaignService,
		private router: Router,
		private splashScreenService: SplashScreenService,
		private toastService: ToastService
		) {

		this.loadingSubject = this.splashScreenService.loadingSubject;
		this.loading$ = this.loadingSubject.asObservable();
		this.user = this.auth.currentUserValue;
	}

	ngOnInit(): void {
		this.subscriptions.push(this.translate.onLangChange.subscribe( lang => {
			this.updateByTranslate(lang.lang);
		}));
		this.updateByTranslate(this.translate.currentLang);
		this.loading$ = this.loadingSubject.asObservable();

		this.init();

	}
	async init() {
		this.loadingSubject.next(true);
		try {

			const res = await this.aliasService.get({
				filterModel: {
					type: {
						filterType: 'text',
						filter: 'campaign.tag'
					},
					ignore: {
						filterType: 'ne',
						value: true
					},
					confirmed: {
						filterType: 'eq',
						value: true
					}
				},
				sortModel: [
					{ colId: 'name', sort: 'asc'}
				],
				startRow: 0,
				endRow: 0,
				pageSize: 100,
			});
			if (!res) {throw {};}
			this.categories = res.items.map( el => ({
				_id: el._id,
				label: tag2category(el),
				pic: el.pic,
				follows: el.follows || []
			})).filter(el => el.label && el.label != '');
			this.categories = sortBy(this.categories, [(o) => !o.follows.includes(this.user._id)]);

			const getActiveCategories = await this.campaignService.getActiveCategories();
			if (!getActiveCategories) {throw {};}
			getActiveCategories.forEach( el => {
				const category = this.categories.find( c => c._id == el._id);
				if (category) {
					category.isFilter = true;
				}
			});

			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		} catch (error) {
			console.log(error);
		}

		this.loadingSubject.next(false);

	}
	ngOnDestroy(): void {
	}
	updateByTranslate(lang){
		if (lang == 'en') {
			this.locale = 'en-US';
		} else if (lang == 'it') {
			this.locale = 'it-IT';
		}
	}
	getDateFromDate(param): string {
		const date = new Date(param);
		return date.toLocaleString(this.locale, {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	}
	async onClickFollowCategory(item) {
		this.loadingSubject.next(true);
		try {
			const follows = [...(item.follows || [])];
			if (follows.includes(this.user._id)) {
				const res = await this.aliasService.follow(this.user._id, false, item._id);
				if (res) {
					item.follows = res.follows;
				}
			} else {
				if (this.categories.filter( el => el.follows && el.follows.includes(this.user._id)).length >= 3) {
					this.toastService.show (this.translate.instant('GENERAL.CATEGORY_SELECTABLE_ERROR'));
					throw {};
				};
				const res = await this.aliasService.follow(this.user._id, true, item._id);
				if (res) {
					item.follows = res.follows;
				}
			}
		} catch (error) {
			console.log(error);
		}
		this.categories = sortBy(this.categories, [(o) => !o.follows.includes(this.user._id)]);
		this.cdr.detectChanges();
		this.loadingSubject.next(false);
	}
	goHome(category) {
		if (!category.isFilter) {return;}
		this.router.navigateByUrl('/crowdfunding', { state: { category: category._id} });
	}
}
