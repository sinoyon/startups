import { ChangeDetectorRef, Component, OnInit, ViewChild, ViewRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { cloneDeep, each } from 'lodash';
import { LpTableComponent } from 'src/app/pages/common/lp-table/lp-table.component';
import { UserService } from 'src/app/pages/common/user.service';
import { KTUtil } from 'src/app/_metronic/kt';
import { QueryResultsModel } from 'src/app/pages/common/models/query-results.model';
import { MainModalComponent } from 'src/app/_metronic/partials/layout/modals/main-modal/main-modal.component';
import { ToastService } from 'src/app/pages/common/toast.service';
import { AliasService } from 'src/app/pages/common/alias.service';
import { AddCommentDialog } from './add-comment-dialog/add-comment.dialog';
import { AuthService } from 'src/app/modules/auth';

@Component({
	selector: 'app-users',
	templateUrl: './users.component.html',
	styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {

	locale = 'it-IT';

	loadingSubject = new BehaviorSubject<boolean>(true);
	loading$: Observable<boolean>;

	columnDefs: any[] = [];
	isEmptyTable = false;
	keptPage = -1;

	tabs: any[] = [
		{
			title: 'All',
			state: 'all',
			filter: {
				inValid: {
					filterType: 'ne',
					value: true
				}
			},
			count: 0
		},
		{
			title: 'Valid',
			state: 'valid',
			filter: {
				inValid: {
					filterType: 'ne',
					value: true
				},
				emailConfirmed: {
					filterType: 'eq',
					value: true
				},
				deleted: {
					filterType: 'ne',
					value: 'yes'
				}
			},
			count: 0
		},
		{
			title: 'Bad',
			state: 'bad',
			filter: {
				inValid: {
					filterType: 'eq',
					value: true
				}
			},
			count: 0
		},
		{
			title: 'No confirmed',
			state: 'no_confirmed',
			filter: {
				emailConfirmed: {
					filterType: 'ne',
					value: true
				},
				deleted: {
					filterType: 'ne',
					value: 'yes'
				}
			},
			count: 0
		},
		{
			title: 'Deleted',
			state: 'deleted',
			filter: {
				deleted: {
					filterType: 'eq',
					value: 'yes'
				}
			},
			count: 0
		}
	];

	activeTab;
	user;

	@ViewChild('tableCtrl', { static: true }) tableCtrl: LpTableComponent;

	extraActions: any[] = [{
		type: 'COPY_EMAIL',
		icon: 'la la-copy',
		text: 'Copy email',
	}
	];

	private unsubscribe: Subscription[] = [];

	constructor(
		private cdr: ChangeDetectorRef,
		private auth: AuthService,
		private router: Router,
		private translate: TranslateService,
		private modal: NgbModal,
		private toastService: ToastService,
		private userService: UserService) { }

	ngOnInit() {
		this.loading$ = this.loadingSubject.asObservable();

		this.unsubscribe.push(this.translate.onLangChange.subscribe(lang => {
			this.updateByTranslate(lang.lang);
		}));
		this.updateByTranslate(this.translate.currentLang);

		this.loadState().then(() => {
			this.tableCtrl.willRefreshTable.next('DATA');
		});

		this.unsubscribe.push(this.auth.currentUserSubject.subscribe(user => {
			this.user = user;
			this.cdr.detectChanges();
		}));
	}

	ngOnDestroy() {
		this.unsubscribe.forEach(el => el.unsubscribe());
	}
	updateByTranslate(lang) {
		if (lang == 'en') {
			this.locale = 'en-US';
		} else if (lang == 'it') {
			this.locale = 'it-IT';
		}
		this.defineColumns();
	}

	defineColumns() {
		const isMobile = KTUtil.isMobileDevice();
		this.tableCtrl.selectionPreviewColumns = [{ field: 'name' }];
		const columnDefs: any[] = [
			{ headerName: this.translate.instant('AUTH.INPUT.FIRSTNAME'), filter: 'agTextColumnFilter', field: 'firstName', minWidth: 200 },
			{ headerName: this.translate.instant('AUTH.INPUT.LASTNAME'), filter: 'agTextColumnFilter', field: 'lastName', minWidth: 200, },
			{
				headerName: this.translate.instant('Email'), filter: 'agTextColumnFilter', field: 'email', editable: false, minWidth: 200,
				cellRenderer: (param) => {
					if (param && param.data) {
						if (param.data.emailConfirmed) {
							return `<span class="badge badge-success">${param.data.email}</span>`;
						} else {
							return param.data.email;
						}
					}
				}
			},
			{
				headerName: this.translate.instant('Country'), filter: 'agTextColumnFilter', field: 'country',
				cellRenderer: param => {
					if (param.data && param.data.country) {
						const country = param.data.country as string;
						return country.charAt(0).toUpperCase() + country.substring(1);
					}
				},
				floatingFilterComponent: 'dropdownFloatingFilter',
				suppressMenu: true,
				floatingFilterComponentParams: {
					suppressFilterButton: true,
					options: [
						{
							label: 'Italy',
							value: 'italy'
						},
						{
							label: 'France',
							value: 'france'
						}
					]
				},
			},
			{
				headerName: this.translate.instant('Registered Date'), filter: 'agDateColumnFilter', field: 'createdAt',
				cellRenderer: param => {
					if (param.data) {
						return this.getDateTimeFromDate(param.data.createdAt);
					}
				}
			},
			{
				headerName: this.translate.instant('Net Status'), field: 'connected', editable: true,
				cellRenderer: param => {
					if (param.data && param.data.connected) {
						return 'Online';
					}
				}
			},
			{
				headerName: this.translate.instant('Comments'), field: 'comments.content', editable: false,
				cellRenderer: (param) => {
					if (param.data) {
						let result = '';

						const commentHtml = `<span>
						${param.data && param.data.comments && param.data.comments.find(el => el.user == this.user._id) ? this.convertToPlain(param.data.comments.find(el => el.user == this.user._id).content || '') : ''}</span>`;
						result = commentHtml;
						const commentButtonHtml = `<span id="theEditCommentButton" class="action" ><i class='la la-pen'></i></span>`;

						setTimeout(() => {
							const commentButton = param.eGridCell.querySelector('#theEditCommentButton');
							if (commentButton) {
								commentButton.addEventListener('click', () => {
									this.onClickEditComment(param.data);
								});
							}
						}, 0);
						if (param.data) {
							result += commentButtonHtml;
						}
						return result;
					}
				}

			},
			{
				headerName: this.translate.instant('Subscribed from'), filter: 'agTextColumnFilter', field: 'platform', editable: false, sortable: true, minWidth: 100,
				cellRenderer: (param) => {
					console.log('param == ', param);
					if (param.data) {
						const content = [param.data.platform, param.data.linkedin ? 'linkedin' : null, param.data.newsletter ? 'newsletter' : null]
							.filter(el => el).join('/');

						if (param.data.linkedInProfileUrl) {
							return `<span>${content}</span>
              <a id="theLinkButton" class="action" target='_blank' href="${param.data.linkedInProfileUrl}"><i class='fa fa-link'></i></a>`;
						} else {
							return `<span>${content}</span>`;
						}
					}
				},
				floatingFilterComponent: 'dropdownFloatingFilter',
				suppressMenu: true,
				floatingFilterComponentParams: {
					suppressFilterButton: true,
					options: [
						{
							label: 'Web',
							value: 'web'
						},
						// {
						// 	label: 'Newsletter',
						// 	value: 'newsletter'
						// },
						{
							label: 'Android',
							value: 'android'
						},
						{
							label: 'IOS',
							value: 'ios'
						},
						// {
						// 	label: 'Linkedin',
						// 	value: 'linkedin'
						// }
					]
				},
			},
			{
				headerName: this.translate.instant('Newsletter'), filter: 'agTextColumnFilter', field: 'newsletter', editable: false, sortable: true, minWidth: 100,
				cellRenderer: (param) => {
					if (param.data) {
						if (param.data.newsletter) {
							return `<span>Newsletter</span>`;
						} else {
							return `<span></span>`;
						}
					}
				},
				floatingFilterComponent: 'dropdownFloatingFilter',
				suppressMenu: true,
				floatingFilterComponentParams: {
					suppressFilterButton: true,
					options: [
						{
							label: 'Newsletter',
							value: true
						}
					]
				},
			},
			{
				headerName: this.translate.instant('IP Address'), filter: 'agTextColumnFilter', field: 'ipaddress', editable: false, minWidth: 200,
				cellClass: isMobile ? 'custom-cell' : 'last-column-cell custom-cell'
			},
			{
				action: 'VALID', width: 42, fixed: true, pinned: 'right', editable: false, sortable: false,
				cellRenderer: param => {
					if (param.data && param.data.inValid) {
						return '<i class="fa fa-frown text-danger"></i>';
					} else if (param.data && !param.data.inValid) {
						return '<i class="fa fa-smile text-success"></i>';
					}

				}
			},
			{
				action: 'EDIT', width: 42, fixed: true, pinned: 'right', editable: false, sortable: false,
				cellRenderer: param => '<i class="la la-pen"></i>'
			},
			{
				action: 'VERIFY_EMAIL', width: 42, fixed: true, pinned: isMobile ? null : 'right', editable: false, sortable: false,
				cellRenderer: param => '<i class="la la-envelope"></i>'
			},
			// {
			// 	action: 'DELETE',	width: 42, fixed: true, pinned: isMobile? null: 'right', editable: false, sortable: false,
			// 	tooltip: params => {
			// 		if (params && params.data){
			// 			return this.translate.instant('COMMON.GENERAL.DELETE');
			// 		}
			// 	},
			// 	cellRenderer (params) {
			// 		if (params.data){
			// 			if (params.data.notRemovable){
			// 				return '';
			// 			} else {
			// 				return '<i class="flaticon-delete"></i>';
			// 			}
			// 		}
			// 	},
			// 	cellClass: isMobile? 'last-column-cell custom-cell': 'custom-cell'
			// }
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
		Object.keys(payload.filterModel).forEach(el => {
			const field = el.replace(/_\d/, '');
			if (field != el) {
				payload.filterModel[field] = { ...payload.filterModel[el] };
				delete payload.filterModel[el];
			}
		});
		Object.keys(payload.filterModel).forEach(el => {
			if (payload.filterModel[el].filterType == 'text' && payload.filterModel[el].type == 'equals') {
				payload.filterModel[el].filterType = 'set';
				payload.filterModel[el].values = payload.filterModel[el].filter.split(',').map(el => el.trim()).filter(el => el != '');
			}
		});
		if (payload.filterModel.fromNewsletter) {
			payload.filterModel.fromNewsletter = {
				filterType: 'eq',
				value: true
			};
		}
		payload.filterModel = {
			...payload.filterModel,
			...this.activeTab.filter
		};
		if (payload.sortModel && !payload.sortModel.find(e => e.colId && e.colId.indexOf('connectedAt') >= 0)) {
			payload.sortModel.push({ colId: 'connectedAt', sort: 'desc' });
		}
		if (payload.sortModel && !payload.sortModel.find(e => e.colId && e.colId.indexOf('createdAt') >= 0)) {
			payload.sortModel.push({ colId: 'createdAt', sort: 'desc' });
		}
	
		if (payload.filterModel.country) {
			const it_c = (payload.filterModel.country.values as Array<any>).includes('italy');
			if (it_c) {
				payload.filterModel.country = {
					or: true,
					filter: [
						[
							{ key: 'country', filterType: 'set', values: payload.filterModel.country.values }
						],
						[
							{ key: 'country', filterType: 'eq', values: null }
						]
					]
				};
			}
		}
		
		let result: QueryResultsModel;
		try {
			const res = await this.userService.get(payload);
			if (!res) { throw ''; }

			(res.items as Array<any>).forEach(user => {
				if (!user.country) {
					user.country = 'italy';
				}
			});

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
		if (this.keptPage > 0) {
			setTimeout(() => {
				this.tableCtrl.gridApi.paginationGoToPage(this.keptPage);
				this.keptPage = -1;
			}, 0);
		}
	}

	async onAction(param) {

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
		} else if (param.type == 'VERIFY_EMAIL') {
			this.onVerifyEmail(selectedIds);
		} else if (param.type == 'UPDATE_ROW') {
			const user = param.payload[0];
			this.userService.update({ _id: user._id, firstName: user.firstName || '', lastName: user.lastName || '' });
		} else if (param.type == 'EDIT') {
			this.router.navigate(['/admin/user-management/users/edit/' + selectedIds[0]]);
		} else if (param.type == 'VALID') {

			this.loadingSubject.next(true);
			try {
				if (node.data.inValid) {
					await this.userService.update({ _id: node.data._id, inValid: false });
					await this.loadState();
					this.tableCtrl.willRefreshTable.next('DATA');
				} else {
					this.onClickEditComment(node.data);
					await this.userService.update({ _id: node.data._id, inValid: true });
					await this.loadState();
					this.tableCtrl.willRefreshTable.next('DATA');
				}
			} catch (error) {

			}
			this.loadingSubject.next(false);
		} else if (param.type == 'COPY_EMAIL') {
			const emails = this.tableCtrl.originSelectedRows.map(el => el.email).join(', ');
			const el = document.createElement('textarea');
			el.value = emails;
			document.body.appendChild(el);
			const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
			if (iOS) {
				const range = document.createRange();
				range.selectNodeContents(el);
				const selection = window.getSelection();
				selection.removeAllRanges();
				selection.addRange(range);
				el.setSelectionRange(0, 999999);
			} else {
				el.select();
			}
			document.execCommand('copy');
			document.body.removeChild(el);
			this.toastService.show('Emails copied to clipboard');
			this.tableCtrl.onDeSelectAllButton();
		}
	}
	onDeleteByIds(ids) {
		const _description = 'Are you sure to permanently delete these users?';
		const _success = `Users have been deleted`;

		const modalRef = this.modal.open(MainModalComponent, { animation: false });
		modalRef.componentInstance.modalData = {
			text: _description,
			yes: 'GENERAL.YES',
		};

		const subscr = modalRef.closed.subscribe(async e => {
			if (e) {
				const res = await this.userService.deleteByIds(ids);
				if (res) {
					this.toastService.show(this.translate.instant(_success));
					this.keptPage = Math.max(0, this.tableCtrl.gridApi.paginationGetCurrentPage() - Math.floor(ids.length / this.tableCtrl.gridApi.paginationGetPageSize()));
					this.tableCtrl.onDeSelectAllButton();
					this.tableCtrl.willRefreshTable.next('DATA');
				}
			}

			setTimeout(() => subscr.unsubscribe(), 100);
		});

	}
	async onVerifyEmail(ids) {

		try {
			this.tableCtrl.onDeSelectAllButton();
			const res = await this.userService.sendVerifyEmail(ids);
			if (res) {
				this.toastService.show(this.translate.instant('NOTIFICATION.GO_EMAIL_BOX'));
			}
		} catch (error) {
			console.log(error);
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

	onClickTab(item) {
		this.activeTab = item;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
		this.defineColumns();
		this.tableCtrl.onDeSelectAllButton();
		this.tableCtrl.willRefreshTable.next('DATA');
	}

	async loadState() {
		this.loadingSubject.next(true);
		try {
			const res = await this.userService.getCountByState();
			if (!res) { throw {}; }

			each(res, (value, key) => {
				const tab = this.tabs.find(el => el.state == key);
				if (tab) {
					tab.count = value;
				}
			});
			if (!this.activeTab || this.activeTab.count == 0) {
				this.activeTab = this.tabs[0];
			}
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		} catch (error) {
			console.log(error);
		}
		this.loadingSubject.next(false);
	}
	async onClickEditComment(param) {
		const modalRef = this.modal.open(AddCommentDialog, { animation: false });
		const comments = param.comments || [];
		if (comments.find(el => el.user == this.user._id)) {
			modalRef.componentInstance.comment = comments.find(el => el.user == this.user._id).content;
		}
		const subscr = modalRef.closed.subscribe(async e => {
			if (e) {
				const comments = param.comments || [];
				if (comments.find(el => el.user == this.user._id)) {
					comments.find(el => el.user == this.user._id).content = e;
				} else {
					comments.push({
						user: this.user._id,
						content: e
					});
				}
				await this.userService.update({ _id: param._id, comments });
				this.tableCtrl.willRefreshTable.next('DATA');
			}
			setTimeout(() => subscr.unsubscribe(), 100);
		});
	}
	convertToPlain(html) {
		const tempDivElement = document.createElement('div');
		tempDivElement.innerHTML = html;
		const text = tempDivElement.textContent || tempDivElement.innerText || '';
		return text.substr(0, 40) + (text.length > 40 ? '...' : '');
	}
}
