import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef, ViewRef, ViewChild, NgModule } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, BehaviorSubject, Subscription, config, of } from 'rxjs';
import { cloneDeep, each, isEqualWith, union } from 'lodash';
import { catchError, switchMap } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SourceService } from 'src/app/pages/common/source.service';
import { ToastService } from 'src/app/pages/common/toast.service';
import { MainModalComponent } from 'src/app/_metronic/partials/layout/modals/main-modal/main-modal.component';


@Component({
	selector: 'app-source-edit',
	templateUrl: './source-edit.component.html',
	styleUrls: ['./source-edit.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourceEditComponent implements OnInit, OnDestroy {
	// Public properties
	source: any;
	previous: any;
	loadingSubject = new BehaviorSubject<boolean>(true);
	loading$: Observable<boolean>;
	activeTab;
	tabs: any[] = [
		{ key: 'main', title: 'Main Information', tooltip: 'Back to main source information' }
	];

	activeConfig;

	defaultConfigIndex = null;

	currentSocial;
	currentSocialIndex = -1;

	countries = [
		{
			label: 'Italy',
			value: 'italy'
		},
		{
			label: 'Spain',
			value: 'spain'
		},
		{
			label: 'France',
			value: 'france'
		}
	];


	@ViewChild('configCtrl', { static: false }) configCtrl;
	@ViewChild('countrySelector', { static: false }) countrySelector;

	private unsubscribe: Subscription[] = [];

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private sourceService: SourceService,
		private toastService: ToastService,
		private modal: NgbModal,
		private cdr: ChangeDetectorRef) {


		this.loading$ = this.loadingSubject.asObservable();
	}

	/**
	 * @ Lifecycle sequences => https://angular.io/guide/lifecycle-hooks
	 */
	
	/**
	 * On init
	 */
	ngOnInit() {

		this.defaultConfigIndex = parseInt((this.route.snapshot.queryParams.config || -1)) + 1;
		this.activeTab = this.tabs[0];
		this.loadSource();
	}


	loadSource() {
		const sb = this.route.paramMap.pipe(
			switchMap(async params => {
				// get id from URL
				const id = params.get('id');
				if (id) {
					try {
						const source = await this.sourceService.getById(id);
						if (!source) { throw {}; }
						return source;
					} catch (error) {
						console.log(error);
					}
					return undefined;
				} else {
					return {
						// loadMainConfig: { method: 'get'},
						// loadDetailConfig: { method: 'get', url:'{permalink}'},
						// campaignStatusConfigs: [],
						// campaignFieldConfig: {},
						// campaignFieldDynamicConfigs: {},
						// involvedCampaignStatuses: [],
						// involvedCampaignTypologies: [],
						// involvedCampaignCountries: [],
						configs: [],
						socials: [],
						type: 'root',
						country: 'italy'
					};
				}
			}),
			catchError((errorMessage) => of(undefined)),
		).subscribe((res: any) => {
			if (!res) {
				this.router.navigate(['/admin/sources'], { relativeTo: this.route });
			}

			this.source = res;

			this.previous = cloneDeep(res);

			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}

			this.initSource();

		});
		this.unsubscribe.push(sb);
	}
	ngOnDestroy() {
		this.unsubscribe.forEach(el => el.unsubscribe());
	}
	async initSource() {
		if (!this.source.type) {
			this.source.type = 'campaign';
		}

		this.tabs = this.tabs.slice(0, 1);
		this.activeTab = this.tabs[0];

		this.source.configs.forEach((el, index) => {
			this.tabs.push({
				key: index,
				title: `Config (${index})`
			});
		});

		if (this.countrySelector) {
			if (this.source.country) {
				this.countrySelector.writeValue(this.source.country);
			}
		}

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}

		if (this.defaultConfigIndex > 0) {
			this.onClickTab(this.tabs[this.defaultConfigIndex]);
		}

		this.loadingSubject.next(false);
	}

	compareWithOldSource() {
		function customizer(objValue, othValue) {
			if (objValue && othValue && typeof objValue == typeof othValue && typeof objValue == 'object') {
				delete objValue.result;
				delete objValue.mainUrl;
				delete objValue.mainContent;
				delete objValue.detailUrl;
				delete objValue.detailContent;
				delete objValue.statusMatched;
				delete objValue.typologyMatched;
				delete objValue.matchedCount;
				delete objValue.linkUrl;
				delete objValue.linkContent;

				delete othValue.result;
				delete othValue.mainUrl;
				delete othValue.mainContent;
				delete othValue.detailUrl;
				delete othValue.detailContent;
				delete othValue.statusMatched;
				delete othValue.typologyMatched;
				delete othValue.matchedCount;
				delete othValue.linkUrl;
				delete othValue.linkContent;
			}
			return undefined;
		}
		return isEqualWith(this.source, this.previous, customizer);
	}
	save(redirect = false) {
		if (this.source._id) {
			this.edit(redirect);
		} else {
			this.create();
		}
	}
	async edit(redirect) {
		if (this.source.configs && this.source.configs.length && this.source.configs.reduce((carry, item) => union(carry, item.involvedCampaignCountries || []), []).length == 0) {
			this.toastService.show('Please select involved campaign countries');
			return;
		}
		this.loadingSubject.next(true);
		
		if (this.activeTab?.key==='main') {
			this.source.country = this.countrySelector?.selectedOption?.value || null;
		}
		
		const res = await this.sourceService.update(this.source);
		if (res) {
			this.previous = cloneDeep(this.source);
			this.toastService.show('Source configs are saved successfully');
			if (redirect) { this.router.navigate(['/admin/sources']); }
		} else {

		}
		this.loadingSubject.next(false);
	}

	async create() {
		if (this.source.configs && this.source.configs.length && this.source.configs.reduce((carry, item) => union(carry, item.involvedCampaignCountries || []), []).length == 0) {
			this.toastService.show('Please select involved campaign countries');
			return;
		}
		const res = await this.sourceService.create(this.source);
		if (res) {
			this.router.navigate(['/admin/sources/edit/' + res['_id']]);
		} else {

		}
	}

	onClickAdd() {

		this.source.configs.push({
			loadMainConfig: { method: 'get' },
			loadDetailConfig: { method: 'get', url: '{permalink}' },
			campaignStatusConfigs: [],
			campaignFieldConfig: {},
			campaignFieldDynamicConfigs: {},
			involvedCampaignStatuses: [],
			involvedCampaignTypologies: [],
			involvedCampaignCountries: [],
			involvedCampaignLanguages: []
		});

		this.tabs.push({
			key: this.source.configs.length - 1,
			title: `Config (${this.source.configs.length - 1})`
		});

		this.onClickTab(this.tabs[this.tabs.length - 1]);
	}

	onClickRemove(param) {

		const modalRef = this.modal.open(MainModalComponent, { animation: false });
		modalRef.componentInstance.modalData = {
			text: 'Are you sure to delete this config?',
			yes: 'Yes',
			cancel: 'No'
		};
		const subscr2 = modalRef.closed.subscribe(res => {
			if (res) {
				this.source.configs.splice(param.key, 1);
				this.tabs = this.tabs.slice(0, 1);
				this.activeTab = this.tabs[0];
				this.source.configs.forEach((el, index) => {
					this.tabs.push({
						key: index,
						title: `Config (${index})`
					});
				});
				this.onClickTab(this.tabs[0]);
				this.cdr.detectChanges();
			}
			setTimeout(() => subscr2.unsubscribe(), 100);
		});
	}

	onClickTab(param) {
		if (!param) { return; }
		this.activeTab = param;
		if (this.activeTab.key == 'main') {

		} else {
			if (this.source && this.activeTab.key < this.source.configs.length) {
				this.activeConfig = this.source.configs[this.activeTab.key];
				this.cdr.detectChanges();
				if (this.configCtrl) {
					this.configCtrl.init(!this.activeTab.loaded);
					this.activeTab.loaded = true;
				}
			}
		}
	}

	async backgroundInputChanged(event) {
		this.loadingSubject.next(true);
		try {
			if (event.target.files && event.target.files[0]) {
				var fileExtention = event.target.files[0].name.substring(event.target.files[0].name.lastIndexOf('.') + 1);
				const formData = new FormData();
				formData.append('file', event.target.files[0], this.source._id + `/${new Date().getTime()}_background.${fileExtention}`);
				const res = await this.sourceService.uploadPicture(formData);
				if (res) {
					this.source.background = res.result;
					this.cdr.detectChanges();
				}
			}
		} catch (error) {

		}
		this.loadingSubject.next(false);
	}

	async logoInputChanged(event) {
		this.loadingSubject.next(true);
		try {
			if (event.target.files && event.target.files[0]) {
				var fileExtention = event.target.files[0].name.substring(event.target.files[0].name.lastIndexOf('.') + 1);
				const formData = new FormData();
				formData.append('file', event.target.files[0], this.source._id + `/${new Date().getTime()}_logo.${fileExtention}`);
				const res = await this.sourceService.uploadPicture(formData);
				if (res) {
					this.source.logo = res.result;
					this.cdr.detectChanges();
				}
			}
		} catch (error) {

		}
		this.loadingSubject.next(false);
	}
	async smallLogoInputChanged(event) {
		this.loadingSubject.next(true);
		try {
			if (event.target.files && event.target.files[0]) {
				var fileExtention = event.target.files[0].name.substring(event.target.files[0].name.lastIndexOf('.') + 1);
				const formData = new FormData();
				formData.append('file', event.target.files[0], this.source._id + `/${new Date().getTime()}_logo.${fileExtention}`);
				const res = await this.sourceService.uploadPicture(formData);
				if (res) {
					this.source.smallLogo = res.result;
					this.cdr.detectChanges();
				}
			}
		} catch (error) {

		}
		this.loadingSubject.next(false);
	}

	onClickDuplicate(param) {

		const modalRef = this.modal.open(MainModalComponent, { animation: false });
		modalRef.componentInstance.modalData = {
			text: 'Are you sure to duplicate this config?',
			yes: 'Yes',
			cancel: 'No'
		};
		const subscr2 = modalRef.closed.subscribe(res => {
			if (res) {
				this.source.configs.push(cloneDeep(this.source.configs[param.key]));
				this.tabs.push({
					key: this.source.configs.length - 1,
					title: `Config (${this.source.configs.length - 1})`
				});
				this.onClickTab(this.tabs[this.tabs.length - 1]);
				this.cdr.detectChanges();
			}
			setTimeout(() => subscr2.unsubscribe(), 100);
		});
	}


	/**
	 * 
	 */
	onAddSocial() {
		if (this.currentSocial && this.currentSocial.trim() != '') {
			if (this.currentSocialIndex == -1) {
				this.source.socials.push(this.currentSocial);
				this.currentSocial = '';
				this.currentSocialIndex = -1;
			} else if (this.currentSocialIndex >= 0 && this.source.socials.length >= this.currentSocialIndex + 1) {
				this.source.socials[this.currentSocialIndex] = this.currentSocial;
				this.currentSocialIndex = -1;
				this.currentSocial = '';
			}

		}
	}
	onUpdateSocial() {
		if (this.currentSocial && this.currentSocial.trim() != '') {
			if (this.currentSocialIndex >= 0 && this.source.socials.length >= this.currentSocialIndex + 1) {
				this.source.socials[this.currentSocialIndex] = this.currentSocial;
				this.currentSocialIndex = -1;
				this.currentSocial = '';
			}
		}
	}

	onCancelSocial() {
		this.currentSocialIndex = -1;
		this.currentSocial = '';
	}

	onEditSocial(value, index) {
		if (this.currentSocialIndex >= 0) {
			return;
		}
		this.currentSocial = value;
		this.currentSocialIndex = index;
	}
	onDeleteSocial(value, index) {
		if (this.currentSocialIndex >= 0) {
			return;
		}
		this.source.socials.splice(index, 1);
	}
}
