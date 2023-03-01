// Angular
import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef, Inject, ViewChild, ViewRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, BehaviorSubject, Subject } from 'rxjs';
import { CompanyService } from 'src/app/pages/common/company.service';

@Component({
	selector: 'app-company-search-dialog',
	templateUrl: './company-search-dialog.html',
	styleUrls: ['./company-search-dialog.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanySearchDialog implements OnInit, OnDestroy {

	confirmSubject = new Subject<any>();
	locale = 'it-IT';
	loadingSubject = new BehaviorSubject<boolean>(false);
	loading$: Observable<boolean>;
	keyword = '';
	fiscalCode = '';
	searchResult = [];
	availableKeys = [];
	searchedCompany;
	from;
	keys = ['name', 'physicalLocation', 'fiscalCode', 'subscribedCapitalRange', 'type', 'contactDate' ];
	tabs: any[] = [
		{key: 'fromSite', title: 'From site'},
		{key: 'fromExist', title: 'From exist companies'}
	];
	activeTab;

	campaign: any = {};

	selectableCompanies = [];

	@ViewChild('companySelector', {static: false}) companySelector;


	private unsubscribe: Subscription[] = [];

	constructor(
			private cdr: ChangeDetectorRef,
			private companyService: CompanyService,
			private translate: TranslateService,
			public modal: NgbActiveModal) {

		this.loading$ = this.loadingSubject.asObservable();
		this.activeTab = this.tabs[0];
	}

	ngOnInit() {
		this.unsubscribe.push(this.translate.onLangChange.subscribe( lang => {
			this.updateByTranslate(lang.lang);
		}));
		this.updateByTranslate(this.translate.currentLang);

		setTimeout(() => {
			if (this.companySelector) {
				this.companySelector.registerOnChange( (value) => {
					this.searchedCompany = this.companySelector.selectedOption;
					this.from = 'exist';
					this.searchResult = [];
					['name', 'physicalLocation', 'fiscalCode', 'subscribedCapitalRange', 'type' ].forEach( key => {
						if (this.searchedCompany[key]) {
							this.searchResult.push({key, value: this.searchedCompany[key]});
						}
					});
				});
			}
		}, 1000);

	}


	ngOnDestroy() {
		this.unsubscribe.forEach(el => el.unsubscribe());
	}
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
	onNoClick() {
		this.modal.dismiss();
	}
	async onYesClick() {
		this.loadingSubject.next(true);
		try {
			if (this.searchedCompany) {
				const res = await this.companyService.saveWithCampaign(this.searchedCompany,this.campaign ? [this.campaign._id]: []);
				if (res) {
					this.modal.close(res);
					throw {};
				}
				this.modal.dismiss();
			}
		} catch (error) {
			console.log(error);
		}
		this.loadingSubject.next(false);
	}
	async onSearchCompany(isKeyword) {
		if (this.companySelector) {
			this.companySelector.selectedOption = null;
		}
		this.from = isKeyword == true ? 'keyword' : 'fiscal';
		if (this.loadingSubject.getValue()) {
			return;
		}
		this.loadingSubject.next(true);

		const payload: any = {
			campaignId: this.campaign._id,
			country: this.campaign.country,
			func: this.campaign.typology == 'company equity' && this.campaign.country == 'italy' ? 'startup.registroimprese.it': null
		};
		if (isKeyword) {
			payload.keyword = this.keyword;
		} else {
			payload.fiscalCode = this.fiscalCode.replace('IT', '');
		}

		try {
			this.searchResult = [];
			this.searchedCompany = null;
			this.searchedCompany = await this.companyService.search(payload);
			['name', 'physicalLocation', 'fiscalCode', 'subscribedCapitalRange', 'type' ].forEach( key => {
				if (this.searchedCompany[key]) {
					this.searchResult.push({key, value: this.searchedCompany[key]});
				}
			});
			this.availableKeys = this.searchedCompany.availableKeys;
		} catch (error) {
			this.searchResult = [{ key: 'Error', value: 'Not found'}];
		}
		this.loadingSubject.next(false);
	}
	searchCompaniesCb = async (keyword) => {
		try {
			const payload = {
				filterModel: {
					name: {
						or: true,
						filter: [[
							{
								key: 'fiscalCode',
								filterType: 'text',
								filter: keyword
							}
						],[{
							key: 'name',
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
			const res = await this.companyService.get(payload);
			this.selectableCompanies = res.items.map ( item => ({
					label: item.name,
					value: item._id,
					...item
				}));
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		} catch (error) {
			console.log(error);
		}
	};
	onCreate() {
		this.modal.dismiss();
		const link = window.location.origin + '/admin/companies/add?campaignId=' + this.campaign._id;
		window.open(link);
	}
}
