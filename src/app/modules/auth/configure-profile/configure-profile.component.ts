// Angular
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation, ViewRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../_services/auth.service';
import { AliasService } from '../../../pages/common/alias.service';
import {tag2category} from '../../../pages/common/common';
import { ToastService } from 'src/app/pages/common/toast.service';
import { SplashScreenService } from 'src/app/_metronic/partials';

enum ErrorStates {
	NotSubmitted,
	HasError,
	HasTokenError,
	NoError,
}
@Component({
	selector: 'app-auth-configure-profile',
	templateUrl: './configure-profile.component.html',
	styleUrls: ['./configure-profile.component.scss']
})
export class ConfigureProfileComponent implements OnInit, OnDestroy {

	loadingSubject = new BehaviorSubject<boolean>(true);
	loading$: Observable<boolean>;

	followView = true;
	categories: any[] = [];
	user;
	errorState: ErrorStates = ErrorStates.NotSubmitted;
  	errorStates = ErrorStates;
	private unsubscribe: Subscription[] = [];


	constructor(
		private cdr: ChangeDetectorRef,
		private auth: AuthService,
		private translate: TranslateService,
		private aliasService: AliasService,
		private toastService: ToastService,
		private splashScreenService: SplashScreenService,
		private router: Router,
	) {
    this.loadingSubject = this.splashScreenService.loadingSubject;
		this.loading$ = this.loadingSubject.asObservable();
		this.unsubscribe.push(this.auth.currentUserSubject.subscribe ( user => {
			this.user = user;
			this.loadCategories();
		}));
	}

	ngOnInit(): void {

	}

	async loadCategories() {
    this.loadingSubject.next(true);
		try {
			const {items} = await this.aliasService.get({
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
			this.categories = items.map( el => ({
				_id: el._id,
				label: tag2category(el),
				follows: el.follows || []
			})).filter( el => el.label != '');
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}

		} catch (error) {

		}
    this.loadingSubject.next(false);
	}

	ngOnDestroy(): void {
	}
	submitFollow() {
		this.router.navigateByUrl('/').then(() => window.location.reload());
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
		this.cdr.detectChanges();
		this.loadingSubject.next(false);
	}
}
