// Angular
import { Component, OnInit, ViewChild, ChangeDetectionStrategy, OnDestroy, ViewRef, ChangeDetectorRef, NgModuleRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription, BehaviorSubject } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';
import { cloneDeep, each, concat, intersection, sortBy, intersectionWith } from 'lodash';


import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LpTableComponent } from '../../common/lp-table/lp-table.component';
import { AdvertisementService } from '../../common/advertisement.service';
import { ToastService } from '../../common/toast.service';
import { KTUtil } from 'src/app/_metronic/kt';
import { QueryResultsModel } from '../../common/models/query-results.model';
import { MainModalComponent } from 'src/app/_metronic/partials/layout/modals/main-modal/main-modal.component';
import { AdvertisementCreateDialog } from './advertisement-create-dialog/advertisement-create.dialog';
import { LayoutService } from 'src/app/_metronic/layout';
import { AuthService } from 'src/app/modules/auth';
import { DatePickerDialog } from '../../dialogs/date-picker/date-picker.dialog';
import * as moment from 'moment';
@Component({
	selector: 'app-advertisements-list',
	templateUrl: './advertisement.component.html',
	styleUrls: ['./advertisement.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdvertisementComponent implements OnInit, OnDestroy {

	locale = 'it-IT';

	loadingSubject = new BehaviorSubject<boolean>(true);
	loading$: Observable<boolean>;

	columnDefs: any[] = [];
	isEmptyTable = false;
	keptPage = -1;

	@ViewChild('countrySelector', {static: true}) countrySelector;

	tabs: any[] = [
		{
			title: 'Equity',
			state: 'equity',
			count: 0,
		},
		{
			title: 'Lending',
			state: 'lending',
			count: 0
		},
		{
			title: 'ADV',
			state: 'adv',
			count: 0
		}
	];

	activeTab;

	_countries = [
		{value: 'italy', label: 'Italy'},
		{value: 'france', label: 'France'},
		{value: 'spain', label: 'Spain'},
		{value: 'german', label: 'German'}
	];
	countries = [];
	writable = {
		typologies: [],
		countries: [],
		allowed: false,
    admin: false
	};

	multiSelectSettings = {
		singleSelection: false,
		idField: 'key',
		textField: 'title',
		selectAllText: 'Select All',
		enableCheckAll: true,
		unSelectAllText: 'UnSelect All',
		itemsShowLimit: 3,
		allowSearchFilter: false
	};

	selectedCountries = [];

	@ViewChild('tableCtrl', {static: true}) tableCtrl: LpTableComponent;

	private unsubscribe: Subscription[] = [];

	constructor(
		private activatedRoute: ActivatedRoute,
		private cdr: ChangeDetectorRef,
		private router: Router,
		private translate: TranslateService,
		private modal: NgbModal,
		private toastService: ToastService,
		private advertisementService: AdvertisementService,
		private auth: AuthService,
		private layoutService: LayoutService) {

		this.activeTab = this.tabs[0];
	}

	ngOnInit() {

		const user = this.auth.currentUserValue;
		// this._countries = user.countries.map( el => ({
		// 		value: el,
		// 		label: el.charAt(0).toUpperCase() + el.slice(1)
		// 	}));

		this.writable = this.auth.hasPermission('advertisement', 'writable');

		this.loading$ = this.loadingSubject.asObservable();

		this.unsubscribe.push(this.translate.onLangChange.subscribe( lang => {
			this.updateByTranslate(lang.lang);
		}));
		this.updateByTranslate(this.translate.currentLang);

		this.unsubscribe.push(this.layoutService.createOnToolbarSubject.subscribe( param => {
			this.onCreateAdvertisement();
		}));
		this.layoutService.createVisibleOnToolbar$.next(true);

		this.init();
	}

	async init() {
		try {
			const pr = this.auth.hasPermission('advertisement', 'readable');
			if (!pr.allowed) {
				this.toastService.show('You dont have permision for this page');
				this.router.navigateByUrl('/');
				return;
			}
			this.countries = this._countries.filter(el => pr.countries.includes(el.value));

      this.cdr.detectChanges();

			if (this.countries.length) {
				this.countrySelector.writeValue((this.countries.find(el => el.value == 'italy') || this.countries[0]).value);
			}
			await this.loadState();

			this.countrySelector.registerOnChange( (value) => {
				this.loadState().then( () => {
					this.tableCtrl.willRefreshTable.next('DATA');
				});
			});

			this.defineColumns();
			this.tableCtrl.willRefreshTable.next('DATA');
		} catch (error) {

		}
	}

	ngOnDestroy() {
		this.unsubscribe.forEach(el => el.unsubscribe());
		this.layoutService.createVisibleOnToolbar$.next(false);
	}
	updateByTranslate(lang){
		if (lang == 'en') {
			this.locale = 'en-US';
		} else if (lang == 'it') {
			this.locale = 'it-IT';
		}
		this.defineColumns();
	}

	defineColumns() {
		const isMobile = KTUtil.isMobileDevice();
		this.tableCtrl.selectionPreviewColumns = [{field: 'name'}];
		const columnDefs: any[] = [
			{ headerName: this.translate.instant('Type'), field: 'type',editable: false,sortable: false,
				cellRenderer: (param) => {
					console.log('param = ', param)
					if (param.data) {
						let contentHtml;
						switch (param.data.type) {
							case 'campaign':
								contentHtml = `<span class="badge badge-primary rounded-0 text-uppercase">Campaign</span>`;
								break;
							case 'source':
								contentHtml = `<span class="badge badge-success rounded-0 text-uppercase">Source</span>`;
								break;
							case null:
								contentHtml = `<span class="badge badge-warning rounded-0 text-uppercase">Advertisement</span>`;
						}
						return contentHtml;
					}
				}
			},
			{ headerName: this.translate.instant('Name') , field: 'typeId', editable: false, minWidth: 200,sortable: false,
				cellRenderer: (param) => {
					if (param.data && param.data.typeId) {
						if (param.data.type == 'campaign') {
							return param.data.campaign.name;
						} else if (param.data.type == 'source') {
							return param.data.source.name;
						}
					} else if (param.data && !param.data.typeId) {
						return `<span class="badge badge-brand rounded-0 text-uppercase">Advertisement</span>`;
					}
				}
			},
			{ headerName: this.translate.instant('Platform') , field: 'typeId', editable: false, minWidth: 200,sortable: false,
				cellRenderer: (param) => {
					if (param.data && param.data.typeId) {
						if (param.data.type == 'campaign') {
							return `<span class="rounded-0 text-capitalize">${param.data.campaign.sourceName}</span>`;
						} else if (param.data.type == 'source') {
							return `<span class="rounded-0 text-capitalize">${param.data.source.name}</span>`;
						}
					} else if (param.data && !param.data.typeId) {
						return `<span class="rounded-0 text-capitalize"></span>`;
					}
				}
			},
			{ headerName: this.translate.instant('Start adv date') ,filter: 'agDateColumnFilter', field: 'startDate', editable: false.valueOf,
				cellRenderer: param => {
					if (param.data && param.data.activeDuration && param.data.activeDuration.length) {
						const ad = param.data.activeDuration[param.data.activeDuration.length - 1];
						return `<span>
							${this.getDateTimeFromDate(ad.startDate)}</span>`;
					}
				}
			},
			{ headerName: this.translate.instant('End adv contract') ,filter: 'agDateColumnFilter', field: 'endDate', editable: false,
				cellRenderer: param => {
					if (param.data) {
						setTimeout( () => {
							const theButton = param.eGridCell.querySelector('#theEditButton');
							if (theButton) {
								theButton.addEventListener('click', () => {
									this.onEdit(param.data._id);
								});
							}
						}, 0);
						if (param.data.activeDuration && param.data.activeDuration.length) {
							const ad = param.data.activeDuration[param.data.activeDuration.length - 1];
							if (ad.endDate) {
								return `<span class="${moment(ad.endDate).isAfter(moment()) ? '': 'badge badge-danger'}">
								${this.getDateTimeFromDate(ad.endDate)}</span>
								<span id="theEditButton" class="action" ><i class='la la-pen'></i></span>`;
							}
						}
						return `<span id="theEditButton" class="action" ><i class='la la-pen'></i></span>`;
					}
				},
				cellClass: !isMobile? 'last-column-cell custom-cell': 'custom-cell'
			},
      {
				action: 'ENTER',	width: 42, fixed: true, pinned: 'right', editable: false, sortable: false,
				cellRenderer:  param => {
          if (param.data && param.data.typeId) {
						if (param.data.type == 'campaign') {
							return `<i class="fa fa-link" style="${param.data.campaign.link? '': 'opacity: 0.4; cursor: not-allowed'}"></i>`;
						} else if (param.data.type == 'source') {
							return `<i class="fa fa-link" style="${param.data.source.link? '': 'opacity: 0.4; cursor: not-allowed'}"></i>`;
						}
					} else if (param.data && !param.data.typeId) {
						return `<span class="badge badge-brand rounded-0 text-uppercase">Advertisement</span>`;
					}
				}
			},
		];
		this.columnDefs = columnDefs;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
		this.tableCtrl.willRefreshTable.next('COLUMNS');
		this.tableCtrl.willRefreshTable.next('ROWS');
	}

	async onPaginationChanged(param) {
		this.loadingSubject.next(true);
		if (this.activeTab.count == 0) {
			this.activeTab.campaign_count = 0;
			this.activeTab.source_count = 0;
			this.activeTab.campaigns = [];
			this.activeTab.sources = [];
			this.isEmptyTable = true;
			param.cb([], 0);
			this.loadingSubject.next(false);
			return;
		}
		let result: QueryResultsModel;
		const payload = cloneDeep(param.payload);
		const params: any = {};
		try {

			payload.filterModel.deleted = {
				filterType: 'ne',
				value: true
			};
			payload.filterModel.typeId = {
				filterType: 'ne',
				value: null
			};
			if (this.activeTab.state == 'equity') {
				params.typology = 'equity';
			} else if (this.activeTab.state == 'lending') {
				params.typology = 'lending';
			} else if (this.activeTab.state == 'adv') {
				payload.filterModel.typeId = {
					filterType: 'eq',
					value: null
				};
			}

			if (payload.sortModel && !payload.sortModel.find( e => e.colId && e.colId.indexOf('type') >= 0)) {
				payload.sortModel.push({ colId: 'type', sort: 'asc'});
			}

			params.country = this.countrySelector.value;

			const res = await this.advertisementService.get(payload, params);
			if (!res) {throw {};}

			this.activeTab.campaign_count = res.items.filter( el => el.type == 'campaign').length;
			this.activeTab.source_count = res.items.filter( el => el.type == 'source').length;
			this.activeTab.campaigns =  res.items.filter( el => el.type == 'campaign' && el.campaign).map( el => el.campaign._id);
			this.activeTab.sources = res.items.filter( el => el.type == 'source' && el.source).map(el => el.source._id);
			result = new QueryResultsModel(res.items,
			res.totalCount);
		} catch (error) {
		}
		if (result) {
			this.isEmptyTable = result.totalCount == 0;
			param.cb(result.items, result.totalCount);
		} else {
			param.cb([], 0);
		}
		this.loadingSubject.next(false);
		if (this.keptPage > 0 ){
			setTimeout(() => {
				this.tableCtrl.gridApi.paginationGoToPage(this.keptPage);
				this.keptPage = -1;
			}, 0);
		}
	}

	async loadState() {
		this.loadingSubject.next(true);
		try {
			const res = await this.advertisementService.getCountByState({country: this.countrySelector.value});
			if (!res) {throw {};}

			each( res, (value, key) => {
				const tab = this.tabs.find( el => el.state == key);
				if (tab) {
					tab.count = value;
				}
			});
			if (!this.activeTab || this.activeTab.count == 0) {
				this.activeTab = this.tabs[0];
			}
			if (!(this.cdr as ViewRef).destroyed){
				this.cdr.detectChanges();
			}
		} catch (error) {
			console.log(error);
		}
		this.loadingSubject.next(false);
	}

	onAction(param) {

		const ids = param.payload;

		if (!this.checkPermission(ids)) {return;}

		let selectedIds = ids;
		if (ids.length > 1) {
			selectedIds = this.tableCtrl.originSelectedRowIds;
		}
		if (param.type == 'DELETE') {
			this.onDeleteByIds(selectedIds);
		} else if (param.type == 'REPEAT') {
		 	this.onRepeat(ids[0]);
		} else if (param.type == 'ENTER') {
			const node = this.tableCtrl.gridApi.getRowNode(ids[0]);
      if (node.data && node.data.typeId) {
        if (node.data.type == 'campaign' && node.data.campaign.link) {
          window.open(node.data.campaign.link);
        } else if (node.data.type == 'source') {
          window.open(node.data.source.link);
        }
      }
		}
	}
	addCommas(nStr) {
		if (nStr == null) {
			return '';
		}
		nStr += '';
		const comma = /,/g;
		nStr = nStr.replace(comma,'');
		const x = nStr.split('.');
		let x1 = x[0];
		const x2 = x.length > 1 ? '.' + x[1] : '';
		const rgx = /(\d+)(\d{3})/;
		while (rgx.test(x1)) {
		  x1 = x1.replace(rgx, '$1' + ',' + '$2');
		}
		return (x1 + x2).replace(/,/g, ';').replace(/\./g, ',').replace(/;/g, '.');
	}
	async onRepeat(id) {

		const node = this.tableCtrl.gridApi.getRowNode(id);
		if (!node) {return;}

		const isRepeat = node.data.repeat;
		const res  = await this.advertisementService.update({_id: id, repeat: !isRepeat });
		if (res) {
			this.tableCtrl.onDeSelectAllButton();
			this.tableCtrl.willRefreshTable.next('DATA');
		}
	}
	async onDeleteByIds(ids) {
		const _description = 'Are you sure to delete these advertisements?';
		const _success = `Advertisements have been deleted`;

		const modalRef = this.modal.open(MainModalComponent, { animation: false});
		modalRef.componentInstance.modalData = {
			text: _description,
			yes: 'GENERAL.YES'
		};

		const subscr = modalRef.closed.subscribe ( async e => {
			if (e) {
				const res  = await this.advertisementService.deleteByIds(ids);
				if (res) {
					this.toastService.show(this.translate.instant(_success));
					this.keptPage = Math.max (0, this.tableCtrl.gridApi.paginationGetCurrentPage() - Math.floor(ids.length / this.tableCtrl.gridApi.paginationGetPageSize()));
					this.tableCtrl.onDeSelectAllButton();
					await this.loadState();
					this.tableCtrl.willRefreshTable.next('DATA');
				}
			}
			setTimeout(() => subscr.unsubscribe(), 100);
		});
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
	onCreateAdvertisement(){
		try {
			if (this.activeTab.state == 'adv'){
				if (this.activeTab.campaign_count > 0 && this.activeTab.source_count > 0) {
					throw '';
				}
				var modalRef = this.modal.open(AdvertisementCreateDialog, { animation: false, size: 'xl'});
				modalRef.componentInstance.types.forEach( el => {
					if (el.type == 'campaign' && el.adv) {
						el.hidden = this.activeTab.campaign_count > 0;
					} else if (el.type == 'source' && el.adv) {
						el.hidden = this.activeTab.source_count > 0;
					} else {
						el.hidden = true;
					}
				});
			} else {
				if (this.activeTab.campaign_count >= 9 && this.activeTab.source_count > 0) {
					throw '';
				}
				var modalRef = this.modal.open(AdvertisementCreateDialog, { animation: false, size: 'xl'});
				modalRef.componentInstance.types.forEach( el => {
					if (el.type == 'campaign' && !el.adv) {
						el.hidden = this.activeTab.campaign_count >= 9;
					} else if (el.type == 'source' && !el.adv) {
						el.hidden = this.activeTab.source_count > 0;
					} else {
						el.hidden = true;
					}
				});

			}
			if (this.activeTab.state == 'equity') {
				modalRef.componentInstance.typologies = ['company equity', 'real estate equity'];
			} else if (this.activeTab.state == 'lending') {
				modalRef.componentInstance.typologies = ['company lending', 'real estate lending'];
			} if (this.activeTab.state == 'minibond') {
				modalRef.componentInstance.typologies = ['minibond'];
			}
			modalRef.componentInstance.countries = [this.countrySelector.value];
			modalRef.componentInstance.exceptedCampaigns = this.activeTab.campaigns || [];
			modalRef.componentInstance.exceptedSources = this.activeTab.sources || [];

			modalRef.componentInstance.excepted = this.activeTab;

			const subscr = modalRef.closed.subscribe( async res => {
				try {
					this.loadState().then( () => {
						this.tableCtrl.willRefreshTable.next('DATA');
					});
				} catch (error) {

				}
				setTimeout(() => subscr.unsubscribe(), 100);
			});
		} catch (error) {

		}

	}

	async onDecreaseSequence(param) {
		this.loadingSubject.next(true);
		try {

			await this.advertisementService.decreaseOrder(param._id);
			this.tableCtrl.willRefreshTable.next('DATA');
		} catch (error) {

		}
		this.loadingSubject.next(false);
	}
	onClickTab(item) {
		this.activeTab = item;
		if (!(this.cdr as ViewRef).destroyed){
			this.cdr.detectChanges();
		}
		this.tableCtrl.onDeSelectAllButton();
		this.tableCtrl.willRefreshTable.next('DATA');
	}
	checkPermission(ids) {
		const selected = ids.map( id => {
			const node = this.tableCtrl.gridApi.getRowNode(id);
			if (node) {return node.data;}
			return this.tableCtrl.originSelectedRows.find(el => el._id == id);
		}).filter( el => el);
		try {
			if (selected.length == 0) {throw {};}
      if (this.writable.admin) {return true;}
			if (!this.writable.allowed) {throw {};}

			return true;
		} catch (error) {

		}
		this.toastService.show('You dont have permission for this action!');
		return false;
	}
	onEdit(id) {

		if (!this.checkPermission([id])) {return;}

		const node = this.tableCtrl.gridApi.getRowNode(id);
		if (!node) {return;}
		if (!node.data.activeDuration || node.data.activeDuration.length == 0) {return;}
		const activeDuration = node.data.activeDuration;

		const modalRef = this.modal.open(DatePickerDialog, { animation: false, size: 'md', centered: true});
		modalRef.componentInstance.minDate = new Date(activeDuration[activeDuration.length - 1].startDate);

		const subscr = modalRef.closed.subscribe( async res => {
			try {
				if (!res) {throw '';}

				activeDuration[activeDuration.length - 1].endDate = res;
				await this.advertisementService.update({
					_id: id,
					activeDuration
				});
				this.keptPage = Math.max (0, this.tableCtrl.gridApi.paginationGetCurrentPage() - Math.floor(1 / this.tableCtrl.gridApi.paginationGetPageSize()));
				this.tableCtrl.onDeSelectAllButton();
				await this.loadState();
				this.tableCtrl.willRefreshTable.next('DATA');
			} catch (error) {
			}
			setTimeout(() => subscr.unsubscribe(), 10);
		});
	}
}
