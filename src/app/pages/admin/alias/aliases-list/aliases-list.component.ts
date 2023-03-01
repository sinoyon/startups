import { KTUtil } from 'src/app/_metronic/kt';
// Angular
import { Component, OnInit, ViewChild, ChangeDetectionStrategy, OnDestroy, ViewRef, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription, BehaviorSubject } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';
import { cloneDeep, union } from 'lodash';

import {each} from 'lodash';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LpTableComponent } from 'src/app/pages/common/lp-table/lp-table.component';
import { ToastService } from 'src/app/pages/common/toast.service';
import { AliasService } from 'src/app/pages/common/alias.service';
import { QueryResultsModel } from 'src/app/pages/common/models/query-results.model';
import { MainModalComponent } from 'src/app/_metronic/partials/layout/modals/main-modal/main-modal.component';
import { AliasMergeDialog } from '../alias-merge-dialog/alias-merge-dialog';
import { AliasInvolvedDialog } from './alias-involved/alias-involved.dialog';
import { LayoutService } from 'src/app/_metronic/layout';
import { CountryService } from 'src/app/pages/common/country.service';
import { AuthService } from 'src/app/modules/auth';
import { AliasTransformDialog } from '../alias-transform-dialog/alias-transform-dialog';

@Component({
	selector: 'app-aliases-list',
	templateUrl: './aliases-list.component.html',
	styleUrls: ['./aliases-list.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AliasesListComponent implements OnInit, OnDestroy {

	locale = 'it-IT';

	loadingSubject = new BehaviorSubject<boolean>(true);
	loading$: Observable<boolean>;

	columnDefs: any[] = [];
	isEmptyTable = false;
	keptPage = -1;
	@ViewChild('languageSelector', {static: true}) languageSelector;

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
		},
		{
			value: 'others',
			label: 'Others',
		},
	];

	tabs: any[] = [
		{
			title: 'All',
			state: 'all',
			filter : {

			}
		},
		{
			title: 'Unconfirmed',
			state: 'unconfirmed',
			filter : {
				confirmed: {
					filterType: 'ne',
					value: true
				}
			},
			count: 0
		},
		{
			title: 'Duplicated',
			state: 'duplicate',
			duplicate: true,
			filter: {},
			count: 0
		}
	];

	activeTab;

	extraActions: any[] = [{
		type: 'CONFIRM',
		icon: 'la la-check-circle',
		text: 'Confirm',
		onlyIcon: true,
		},
		{
			type: 'MERGE',
			text: 'Merge'
		},
    {
			type: 'TRANSFORM',
			text: 'Change language'
		}
	];
	writable = {
		typologies: [],
		countries: [],
		allowed: false,
    admin: false
	};

	@ViewChild('tableCtrl', {static: true}) tableCtrl: LpTableComponent;

	private unsubscribe: Subscription[] = [];

	constructor(
				   private activatedRoute: ActivatedRoute,
				   private cdr: ChangeDetectorRef,
				   private router: Router,
				   private translate: TranslateService,
				   private modal: NgbModal,
				   private layoutService: LayoutService,
				   private countryService: CountryService,
				   private auth: AuthService,
				   private toastService: ToastService,
				   private aliasService: AliasService) { }

	ngOnInit() {
		this.writable = this.auth.hasPermission('alias', 'writable');

		this.loading$ = this.loadingSubject.asObservable();

		this.unsubscribe.push(this.translate.onLangChange.subscribe( lang => {
			this.updateByTranslate(lang.lang);
		}));
		this.updateByTranslate(this.translate.currentLang);

		this.languageSelector.registerOnChange( (value) => {
			this.tableCtrl.willRefreshTable.next('DATA');
		});

		this.unsubscribe.push(this.layoutService.createOnToolbarSubject.subscribe( param => {
			this.router.navigate(['/admin/aliases/add']);
		}));
		this.layoutService.createVisibleOnToolbar$.next(true);

		this.init();
	}

	async init() {
		try {
			// const pr = this.auth.hasPermission('advertisement', 'readable');
			// if (!pr.allowed) {
			// 	this.toastService.show('You dont have permision for this page');
			// 	this.router.navigateByUrl('/');
			// 	return;
			// }

			await this.loadState();
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
			{ headerName: this.translate.instant('Name') ,filter: 'agTextColumnFilter', field: 'names.value', editable: false, pinned: 'left', minWidth: 200,
				cellRenderer: (param) => {
					if (param.data) {
						if (param.data.ignore) {
							return `<span
							class="badge badge-secondary text-uppercase">ignore</span>`;
						} else {
							const name = param.data.names.find( el => el.country == this.languageSelector.value);
							if (name) {
								return name.value;
							} else {
								return param.data.names[0].value;
							}
						}
					}
				}
			},
			{ headerName: this.translate.instant('Type') ,filter: 'agTextColumnFilter', field: 'type', editable: false,  minWidth: 100, sortable: false,
				cellRenderer: param => {
					if (param.data && param.data.type) {
						const mainType = param.data.type.split('.')[0];
						const subType = param.data.type.split('.')[1];
						let statusClass;
						switch (subType) {
							case 'type':
								statusClass = 'badge badge-success rounded-0 text-uppercase';
								break;
							case 'typology':
								statusClass = 'badge badge-light-primary rounded-0 text-uppercase';
								break;
							case 'tag':
								statusClass = 'badge badge-secondary rounded-0 text-uppercase';
								break;
							default:
								break;
						}
						return `<span
								class="${statusClass}">${mainType} ${subType}</span>`;
					}
				},
				floatingFilterComponent: 'dropdownFloatingFilter',
				suppressMenu: true,
				floatingFilterComponentParams: {
					suppressFilterButton: true,
					options: [
						{
							label: 'Campaign tag',
							value: 'campaign.tag',
							selected: true
						},
						{
							label: 'Company type',
							value: 'company.type',
							selected: false
						}
					]
				}
			},
			{ headerName: this.translate.instant('Number of Values'), sortable: false, field: 'values', editable: false,
				cellRenderer: (param) => {
					if (param.data) {
						if (this.activeTab && this.activeTab.duplicate) {
							if (param.data.duplicatedSynonyms.length > 0) {
								return param.data.duplicatedSynonyms.length;
							}
						} else {
							if (param.data.synonyms.length > 0) {
								return param.data.synonyms.length;
							}
						}
					}
				}
			},
			{ headerName: this.translate.instant('Number of Involved'), hide: (this.activeTab && this.activeTab.duplicate), sortable: false, field: 'countInvolved', editable: false,
				cellRenderer: (param) => {
					if (param.data) {
						if (param.data) {
							let count = 0;
							if (param.data.type == 'campaign.tag') {
								count = param.data.involvedCampaignCount;
							} else if (param.data.type == 'company.type') {
								count = param.data.involvedCompanyCount;
							}
							if (count == 0) {return;}
							const actionButtonHtml = `<span id="theAction" class="action"><i class='la la-eye'></i></span>`;
							const countHtml = `<span>
								${count}</span>`;

							setTimeout( () => {
								const actionButton = param.eGridCell.querySelector('#theAction');
								if (actionButton) {
									actionButton.addEventListener('click', () => {
										this.onShowInvolved(param.data);
									});
								}
							}, 0);

							return countHtml + actionButtonHtml;
						}
					}
				}
			},
			{ headerName: this.translate.instant('Synonyms'), filter: 'agTextColumnFilter', field: 'synonyms.value', editable: false,
				cellRenderer: (param) => {
					if (param.data) {
						const synonyms = param.data.synonyms.filter( el => el.language == this.languageSelector.value);
						if (synonyms.length) {
							return synonyms.sort().map(el => {
								if (this.activeTab.duplicate) {
									if (param.data.duplicatedSynonyms && param.data.duplicatedSynonyms.includes(el.value)) {
										return `<span
										class="badge badge-warning text-dark">${el.value}</span>`;
									}
								} else {
									return `<span
									class="badge badge-light-primary">${el.value}</span>`;
								}
							}).filter(el => el).join(' ');
						}
					}
				},
				cellClass: 'last-column-cell custom-cell'
			},
			{
				action: 'ENTER_IN',	width: 42, fixed: true, pinned: isMobile? null: 'right', editable: false, sortable: false,
				cellRenderer:  param => {
					if (param.data) {
						return `<a target="_blank" href="${window.location.origin + '/crowdfunding/category/' + (param.data.names.find( el => el.country == this.languageSelector.value) || param.data.names[0]).value}"><i class="fa fa-link" style="color: blue"></i></a>`;
					}
				}
			},
			{
				action: 'EDIT',	width: 42, fixed: true, pinned: 'right', editable: false, sortable: false,
				cellRenderer:  param => '<i class="la la-pen"></i>'
			}
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
		if (!this.activeTab || this.activeTab.count == 0) {
			param.cb([], 0);
			this.loadingSubject.next(false);
			return;
		}
		const payload = cloneDeep(param.payload);
		const isFiltered = Object.keys(payload.filterModel).length > 0;
		Object.keys(payload.filterModel).forEach( el => {
			const field = el.replace(/_\d/, '');
			if (field != el){
				payload.filterModel[field] = { ...payload.filterModel[el]};
				delete payload.filterModel[el];
			}
		});
    Object.keys(payload.filterModel).forEach( el => {
			if (payload.filterModel[el].filterType == 'text' && payload.filterModel[el].type == 'equals') {
        payload.filterModel[el].filterType = 'set';
        payload.filterModel[el].values = payload.filterModel[el].filter.split(',').map( el => el.trim()).filter( el => el != '');
      }
		});

		if (Object.keys(payload.filterModel).find( key => key == 'name')) {
			payload.filterModel['names.value'] = payload.filterModel.name;
			delete payload.filterModel.name;
		}

		payload.filterModel = {
			...payload.filterModel,
			...this.activeTab.filter
		};
		payload.filterModel['synonyms.language'] = {
			filterType: 'text',
			filter: this.languageSelector.value
		};
		payload.duplicate = this.activeTab.duplicate;

		let result: QueryResultsModel;
		try {
			const res = this.activeTab.duplicate ? await this.aliasService.getDuplicated(payload, null, true) :
			await this.aliasService.get(payload, null, true);
			if (!res) {throw {};}
			result = new QueryResultsModel(res.items.map( el => {
				el.name = (el.names[0] || {}).value;
				return el;
			}), res.totalCount);
		} catch (error) {
		}
		if (result) {
			this.isEmptyTable = !isFiltered && result.totalCount == 0;
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

	onAction(param) {

		if (!this.checkPermission()) {return;}

		const ids = param.payload;
		let selectedIds = ids;
		if (ids.length > 1) {
			selectedIds = this.tableCtrl.originSelectedRowIds;
		}
		const node = this.tableCtrl.gridApi.getRowNode(ids[0]);
		if (ids.length == 1) {
			if (node) {
				node.setSelected(this.tableCtrl.originSelectedRowIds.includes(ids[0]));
			}
		}
		if (param.type == 'EDIT') {
			this.router.navigate(['/admin/aliases/edit', ids[0]], { relativeTo: this.activatedRoute });
		} else if (param.type == 'ENABLE') {
			if (node) {
				this.aliasService.update({
					_id: ids[0],
					disabled: !node.data.disabled
				}).then( res => {
					this.tableCtrl.willRefreshTable.next('DATA');
				});
			}
		} else if (param.type == 'DELETE') {
			this.onDeleteByIds(selectedIds);
		} else if (param.type == 'MERGE') {
			this.mergeByIds(selectedIds);
		} else if (param.type == 'CONFIRM') {
			this.confirmByIds(selectedIds);
		} else if (param.type == 'TRANSFORM') {
      this.transformByIds(selectedIds);
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
	async onDeleteByIds(ids) {
		const _description = 'Are you sure to permanently delete these aliases?';
		const _waitDescription = 'Aliases are deleting...';
		const _success = `Aliases have been deleted`;

		const modalRef = this.modal.open(MainModalComponent, { animation: false});
		modalRef.componentInstance.modalData = {
			text: _description,
			yes: 'GENERAL.YES'
		};

		const subscr = modalRef.closed.subscribe ( async e => {
			if (e) {
				const res  = await this.aliasService.deleteByIds(ids);
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
	async mergeByIds(ids) {

		const aliases = ids.map( id => {
			const data = this.tableCtrl.originSelectedRows.find(r => r.id == id);
			if (data) {
				return data;
			} else {
				return null;
			}
		}).filter( el => el);
		if (union(aliases.map ( el => el.type)).length != 1 ) {
			this.toastService.show(this.translate.instant('Different types of alias not allowed to merge'));
			return;
		}
		const modalRef = this.modal.open(AliasMergeDialog, { animation: false});
		modalRef.componentInstance.selectedLang = this.languageSelector.value;
		modalRef.componentInstance.init(aliases, this.languageSelector.value);
		const subscr = modalRef.closed.subscribe( async res => {
			this.keptPage = Math.max (0, this.tableCtrl.gridApi.paginationGetCurrentPage() - Math.floor(ids.length / this.tableCtrl.gridApi.paginationGetPageSize()));
			this.tableCtrl.onDeSelectAllButton();
			await this.loadState();
			this.tableCtrl.willRefreshTable.next('DATA');
			setTimeout(() => subscr.unsubscribe(), 100);
		});
	}
	async confirmByIds(ids) {
		const _description = 'Are you sure to confirm these aliases?';
		const _waitDescription = 'Aliases are confirming...';
		const _success = 'Aliases have been confirmed';

		const modalRef = this.modal.open(MainModalComponent, { animation: false});
		modalRef.componentInstance.modalData = {
			text: _description,
			yes: 'GENERAL.YES'
		};

		const subscr = modalRef.closed.subscribe ( async e => {
			if (e) {
				const res  = await this.aliasService.confirmByIds(ids);
				if (res) {
					this.toastService.show(this.translate.instant(_success));
					this.keptPage = Math.max (0, this.tableCtrl.gridApi.paginationGetCurrentPage() - Math.floor(ids.length / this.tableCtrl.gridApi.paginationGetPageSize()));
					this.tableCtrl.onDeSelectAllButton();
					this.loadState();
					this.tableCtrl.willRefreshTable.next('DATA');
				}
			}

			setTimeout(() => subscr.unsubscribe(), 100);
		});
	}

	onClickTab(item) {
		this.activeTab = item;
		this.extraActions.find(el => el.type == 'CONFIRM').disabled = this.activeTab.state != 'unconfirmed';
		if (!(this.cdr as ViewRef).destroyed){
			this.cdr.detectChanges();
		}
		this.defineColumns();
		this.tableCtrl.onDeSelectAllButton();
		this.tableCtrl.willRefreshTable.next('DATA');
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

	async loadState() {
		this.loadingSubject.next(true);
		try {
			const res = await this.aliasService.getCountByState();
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
	async onShowInvolved(param) {
		const modalRef = this.modal.open(AliasInvolvedDialog, { animation: false, size: 'xl'});
		modalRef.componentInstance.alias = param;
	}
	checkPermission() {
		try {
      if (this.writable.admin) {return true;}
			if (!this.writable.allowed) {throw {};}
			return true;
		} catch (error) {

		}
		this.toastService.show('You dont have permission for this action!');
		return false;
	}
  async transformByIds(ids) {

    if (!this.languageSelector.value) {
      this.toastService.show('Please select language');
      return;
    }
		const modalRef = this.modal.open(AliasTransformDialog, { animation: false});
		modalRef.componentInstance.init(ids, this.languageSelector.value);
		const subscr = modalRef.closed.subscribe( async res => {
			this.keptPage = Math.max (0, this.tableCtrl.gridApi.paginationGetCurrentPage() - Math.floor(ids.length / this.tableCtrl.gridApi.paginationGetPageSize()));
			this.tableCtrl.onDeSelectAllButton();
			await this.loadState();
			this.tableCtrl.willRefreshTable.next('DATA');
			setTimeout(() => subscr.unsubscribe(), 100);
		});
	}
}
