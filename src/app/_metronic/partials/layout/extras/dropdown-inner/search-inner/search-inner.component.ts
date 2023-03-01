import { AuthDialog } from 'src/app/modules/auth/auth.dialog';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
// Angular
import { Component, Output, EventEmitter, ViewChild, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, HostBinding, Input, HostListener, Renderer2, forwardRef, ViewRef } from '@angular/core';
import { BehaviorSubject, fromEvent, Observable } from 'rxjs';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { AliasService } from 'src/app/pages/common/alias.service';
import { CampaignService } from 'src/app/pages/common/campaign.service';
import { TransactionService } from 'src/app/pages/common/transaction.service';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { tag2category } from 'src/app/pages/common/common';
import { Platform } from '@angular/cdk/platform';
import { AuthService } from 'src/app/modules/auth';

@Component({
	selector: 'app-search-inner',
	templateUrl: './search-inner.component.html',
	styleUrls: ['./search-inner.component.scss'],
	providers: [
		{
		  provide: NG_VALUE_ACCESSOR,
		  useExisting: forwardRef(() => SearchInnerComponent),
		  multi: true,
		}
	]
})
export class SearchInnerComponent implements OnInit, OnDestroy {

	categoryQuery: any = {
		sortModel: [
			{ colId: 'name', sort: 'asc'}
		],
		startRow: 0,
		endRow: 0,
		pageSize: 100,
		totalCount: 0,
		result: []
	};
	campaignQuery: any = {
		sortModel: [{ colId: 'name', sort: 'asc'}],
		startRow: 0,
		endRow: 0,
		pageSize: 100,
		totalCount: 0,
		result: []
	};

	loadingSubject = new BehaviorSubject<boolean>(false);
	loading$: Observable<boolean>;
	locale = 'it-IT';

	lastSearchWord;

	initCategories = [];

	filteredCategories = [];

	@HostBinding('class')
	class = `menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg menu-state-primary fw-bold py-4 fs-6 w-100vw w-sm-275px`;
	@HostBinding('attr.data-kt-menu') dataKtMenu = 'true';
	@HostBinding('attr.id') id = 'search_inner_dropdown';


	@ViewChild('searchInput', {static: true}) searchInput: ElementRef;


	user$: Observable<any>;
	_user: any;

	constructor(
		private aliasService: AliasService,
		private campaignService: CampaignService,
		private router: Router,
		private transactionService: TransactionService,
		public platform: Platform,
		private auth: AuthService,
		private modal: NgbModal
		) {

		this.loading$ = this.loadingSubject.asObservable();

		if (!platform.ANDROID && !platform.IOS) {
			this.class = `menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg menu-state-primary fw-bold py-4 fs-6 w-100vw w-sm-275px desktop-search`;
		} else {
			this.class = `menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg menu-state-primary fw-bold py-4 fs-6 w-100vw w-sm-275px`;
		}

		this.user$ = this.auth.currentUserSubject.asObservable();
		this.user$.subscribe(user => {
			this._user = user;
		});
	}

	ngOnInit(): void {

		fromEvent(this.searchInput.nativeElement, 'keyup').pipe(
			map((event: any) => event.target.value)
			// , filter(res => res.length > 2)
			, debounceTime(1000)
			, distinctUntilChanged()
		  ).subscribe((text: string) => {
			this.setQuery(text);
			this.search().then();
		});
		this.searchInput.nativeElement.focus();
	}
	ngOnDestroy(): void {

	}
	setQuery(keyword) {
		var country = 'italy';
		if (sessionStorage.getItem('country')) {
			country = sessionStorage.getItem('country');
		}

		if (!keyword || keyword.trim() == '') {
			this.categoryQuery.filterModel = null;
			this.campaignQuery.filterModel = null;
		} else {
			this.categoryQuery.filterModel = {
				categories: {
					or: true,
					filter: [[{ key: 'names.value', filterType: 'text', filter: keyword}], [{ key: 'synonyms.value', filterType: 'text', filter: keyword}]]
				},
				ignore: {
					filterType: 'ne',
					value: true
				},
				confirmed: {
					filterType: 'eq',
					value: true
				}
			};
			this.campaignQuery.filterModel = {
				name: {
					or: true,
					filter: [
						[{ key: 'name', filterType: 'text', filter: keyword}],
						[{ key: 'description', filterType: 'text', filter: keyword}],
						[{ key: 'source.name', filterType: 'text', filter: keyword}]
					]
				},
				status: this._user && !this._user.isGuest ? null : {
					filterType: 'set',
					values: ['1_ongoing', '2_comingsoon', '3_funded', '4_closed', '5_extra', '6_refunded']
				},
				disabled: {
					filterType: 'ne',
					value: true
				},
				deleted: {
					filterType: 'ne',
					value: true
				},
				country: {
					filterType: 'set',
					values: [country]
				}
			};

			if (country == 'europe') {
				delete this.campaignQuery.filterModel.country;
			}
		}
	}

	async search() {

		this.loadingSubject.next(true);
		try {
			if (!this.categoryQuery.filterModel || !this.campaignQuery.filterModel) {
				this.categoryQuery.result = [];
				this.campaignQuery.result = [];
				throw '';
			}
			this.categoryQuery.startRow = 0;
			this.categoryQuery.endRow = 0;
			this.categoryQuery.result = [];
			let res = await this.aliasService.get(this.categoryQuery);
			const regex = new RegExp(this.searchInput.nativeElement.value, 'gi');
			res.items.forEach(item => {
				const name = item.names[0].value;
				const synonyms = item.synonyms.filter( el => el.value.match(regex)).map( el => el.value)[0];
				this.categoryQuery.result.push({
					label: tag2category(item),
					value: item._id,
					synonyms: synonyms!='' ? synonyms: null,
					type: 'category'
				});
			});
			this.categoryQuery.totalCount = res.totalCount;

			this.campaignQuery.startRow = 0;
			this.campaignQuery.endRow = 0;
			this.campaignQuery.result = [];

      this.campaignQuery.filterModel.updatedAt = {
				filterType: 'gte',
				value: new Date().setDate(new Date().getDate() - 3),
				isDate: true
			};

			res = await this.campaignService.get(this.campaignQuery);
			res.items.sort((a,b) => {
				if (a.status > b.status) return 1;
				else if (a.status < b.status) return -1;
				else return 0;
			});
			res.items.forEach(item => {
				this.campaignQuery.result.push({
					name: item.name,
					typology: (item.typology as string).split(' ').pop(),
					source: new URL(item.source.link).host,
					systemTitle: item.systemTitle,
					description: item.description && item.description.match(regex) ? item.description: null,
					id: item._id,
					status: ['3_funded','4_closed','6_refunded'].findIndex(ste => ste == item.status) > -1 ? 'closed' : 'open'
				});
			});
			this.campaignQuery.totalCount = res.totalCount;

		} catch (error) {

		}
		this.loadingSubject.next(false);
	}

	async clear() {
		if (this.searchInput.nativeElement.value) {
			this.saveTransaction();
		}
		this.searchInput.nativeElement.value = '';
		this.searchInput.nativeElement.focus();
	}


	checkUser() {
    this.modal.open(AuthDialog, { animation: false});
	}

	optionSelect(option: any, event, type ) {
		event.stopPropagation();
		if (option) {
			this.saveTransaction();
		}
		if (type == 'campaign') {
			window.open(window.origin + '/crowdfunding/' + (option.systemTitle || ''));
		} else if (type == 'category') {
			if (this.router.url.split(/[?#]/)[0] == '/crowdfunding') {
				this.campaignService.search$.next(option.value);
			} else {
				this.router.navigateByUrl('/crowdfunding', { state: { category: option.value} });
			}
		}
		this.searchInput.nativeElement.focus();
	}

	async saveTransaction() {
		const searchWord = (this.searchInput.nativeElement.value || '').toLowerCase();
		if (this.lastSearchWord != searchWord) {

			var country = 'italy';
			if (sessionStorage.getItem('country')) {
				country = sessionStorage.getItem('country');
			}
			if (country == 'europe') {
				country = null;
			}

      try {
        await
        this.transactionService.create({
          type: 'home.search',
          value: -1,
          name: searchWord,
					country: country
        });
        this.lastSearchWord = searchWord;
      } catch (error) {

      }
		}
	}
}
