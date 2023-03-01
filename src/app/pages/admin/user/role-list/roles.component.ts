import { ChangeDetectorRef, Component, OnInit, ViewChild, ViewRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { cloneDeep } from 'lodash';
import { LpTableComponent } from 'src/app/pages/common/lp-table/lp-table.component';
import { ToastService } from 'src/app/pages/common/toast.service';
import { UserService } from 'src/app/pages/common/user.service';
import { LayoutService } from 'src/app/_metronic/layout';
import { KTUtil } from 'src/app/_metronic/kt';
import { QueryResultsModel } from 'src/app/pages/common/models/query-results.model';
import { MainModalComponent } from 'src/app/_metronic/partials/layout/modals/main-modal/main-modal.component';
import { PermissionsDetailDialog } from '../user-list/permissions-detail/permissions-detail.dialog';

@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss']
})
export class RolesComponent implements OnInit {

  locale = 'it-IT';

	loadingSubject = new BehaviorSubject<boolean>(true);
	loading$: Observable<boolean>;

	columnDefs: any[] = [];
	isEmptyTable = false;
	keptPage = -1;

	@ViewChild('tableCtrl', {static: true}) tableCtrl: LpTableComponent;

	private unsubscribe: Subscription[] = [];

	constructor(
				   private cdr: ChangeDetectorRef,
				   private router: Router,
				   private translate: TranslateService,
				   private toastService: ToastService,
				   private modal: NgbModal,
				   private layoutService: LayoutService,
				   private userService: UserService) { }

	ngOnInit() {
		this.loading$ = this.loadingSubject.asObservable();

		this.unsubscribe.push(this.layoutService.createOnToolbarSubject.subscribe( param => {
			this.router.navigate(['/admin/user-management/roles/add']);
		}));
		this.layoutService.createVisibleOnToolbar$.next(true);

		this.unsubscribe.push(this.translate.onLangChange.subscribe( lang => {
			this.updateByTranslate(lang.lang);
		}));
		this.updateByTranslate(this.translate.currentLang);
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
		this.tableCtrl.selectionPreviewColumns = [{field: 'description'}];
		const columnDefs: any[] = [
			{ headerName: this.translate.instant('Description') , filter: 'agTextColumnFilter', field: 'description',  minWidth: 200, editable: false},
      { headerName: this.translate.instant('Permissions') , filter: false, field: 'permission', editable: false,
				cellRenderer: param => {
					if (param.data && param.data.permissions) {
						const contentHtml = `<span>${param.data.permissions.length + ' permissions assigned'}</span>`;
						const actionBtnHtml =  param.data.permissions && param.data.permissions.length ? `<span id="theAction" class="action ml-2"><i class='la la-eye'></i></span>` : null;
						setTimeout( () => {
							const actionButton = param.eGridCell.querySelector('#theAction');
							if (actionButton) {
								actionButton.addEventListener('click', () => {
									this.onShowPermissions(param.data);
								});
							}
						}, 0);

						return contentHtml + (actionBtnHtml || '');
					}
				},
        cellClass:isMobile? 'custom-cell': 'last-column-cell custom-cell'
			},
			{
				action: 'EDIT',	width: 42, fixed: true, pinned:isMobile? null: 'right', editable: false, sortable: false,
				cellRenderer:  param => '<i class="la la-pen"></i>'
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
		let result: QueryResultsModel;
		try {
			const res = await this.userService.getRoles(payload);
      if (!res) {throw {};}
			result = new QueryResultsModel(res.items, res.totalCount);
		} catch (error) {
			console.log(error);
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
		if (param.type == 'DELETE') {
			this.onDeleteByIds(selectedIds);
		} else if (param.type == 'EDIT') {
      this.router.navigate(['/admin/user-management/roles/edit/' + selectedIds[0]]);
    }
	}
	onDeleteByIds(ids) {
		const _description = 'Are you sure to permanently delete these roles?';
		const _waitDescription = 'Roles are deleting...';
		const _success = `Roles have been deleted`;

		const modalRef = this.modal.open(MainModalComponent, { animation: false});
		modalRef.componentInstance.modalData = {
			text: _description,
			yes: 'GENERAL.YES',
		};

		const subscr = modalRef.componentInstance.confirmSubject.subscribe ( async e => {
			const res  = await this.userService.deleteRolesByIds(ids);
			if (res) {
				this.toastService.show(this.translate.instant(_success));
				this.keptPage = Math.max (0, this.tableCtrl.gridApi.paginationGetCurrentPage() - Math.floor(ids.length / this.tableCtrl.gridApi.paginationGetPageSize()));
				this.tableCtrl.onDeSelectAllButton();
				this.tableCtrl.willRefreshTable.next('DATA');
			}
			modalRef.close();
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
  onShowPermissions(data) {
		const modalRef = this.modal.open(PermissionsDetailDialog, { animation: false, backdrop : 'static',
    size: 'xl',
		keyboard : false});
    modalRef.componentInstance.role = data;
	}
}
