import { CommonService } from 'src/app/pages/common/common.service';
import {AfterViewInit, Component, OnInit, ChangeDetectorRef,ViewEncapsulation, NgZone, Input, Output,EventEmitter, ElementRef, ViewChild, OnDestroy, ViewRef, ChangeDetectionStrategy} from '@angular/core';

import { LicenseManager} from 'ag-grid-enterprise';
import { TranslateService } from '@ngx-translate/core';
import { Subject, Subscription } from 'rxjs';
import { union, find, difference, each, cloneDeep} from 'lodash';

LicenseManager.prototype.validateLicense = function(){
};

import {ICellRendererAngularComp} from 'ag-grid-angular';
import { LpTableService } from './lp-table.service';

@Component({
	selector: 'lp-tbl-dropdown-floating-filter',
	template: `
			<div class="lp-tbl-dropdown-floating-filter">
        <div class="" dropdown #dropdown="bs-dropdown" [autoClose]="false" container="body">
          <button id="button-basic" dropdownToggle type="button"
              class="btn btn-transparent dropdown-toggle w-100 py-0 d-flex align-items-center h-25px"
              aria-controls="dropdown-basic" (click)="setEvent($event)">
              <span style="overflow:hidden" class="flex-root">{{selectedLabel}}</span>
              <span class="caret"></span>
          </button>
          <ul id="dropdown-basic" *dropdownMenu class="dropdown-menu"
              role="menu" aria-labelledby="button-basic">
              <li role="menuitem" *ngFor="let option of options" class="{{option.value == 'sall' ? 'sall' : ''}}">
                <div class="form-check mb-2">
                  <input class="form-check-input" id="float_filter_options_{{option.value}}" type="checkbox" [(ngModel)]="option.selected" (change)="onSelectedValue($event, option)"/>
                  <label class="form-check-label" for="float_filter_options_{{option.value}}">{{option.label}}
                  </label>
                </div>
              </li>
          </ul>
        </div>
			</div>
	`
})
export class LpTblDropdownFloatingFilterComponent {
	private params: any;
	options: any[] = [];
  get selectedLabel() {
    return this.options.filter( el => el.selected && el.value != 'sall' && el.value != 'dsall').map(el => el.label).join(',');
  }
	constructor(private cdr: ChangeDetectorRef, private comService: CommonService) {}
	agInit(params): void {
		this.params = params;
		var selectAll = (this.params.options as Array<any>).findIndex(el => el.value == 'sall') > -1;
		if (!selectAll) {
			(this.params.options as Array<any>).unshift({
				label: 'Select All',
				value: 'sall'
			})
		}
		this.options = this.params.options;
		if (this.options.filter(el => el.selected && el.value != 'sall' && el.value != 'dsall').length) {
			setTimeout(() => {
				this.params.parentFilterInstance(instance => {
					instance.onFloatingFilterChanged('equals', this.options.filter(el => el.selected && el.value != 'sall' && el.value != 'dsall').map( el=> el.value).join(','));
				});
			});
		}
	}
	onSelectedValue(e, option) {
		if (option.value == 'sall') {
			if (option.selected) {
				this.options.forEach(eel => eel.selected = true);
				option.label = "Deselect All";
			} else {
				this.options.forEach(eel => eel.selected = false);
				option.label = "Select All";
			}
		}

		if (option.kind && option.kind == 'status') {
			sessionStorage.setItem('statusfilter', JSON.stringify(this.options));
		} else if (option.kind && option.kind == 'typology') {
			sessionStorage.setItem('typologyfilter', JSON.stringify(this.options));
		} else if (option.kind && option.kind == 'sources') {
			sessionStorage.setItem('sourcefilter', JSON.stringify(this.options));
		}
		// this.comService.filterOptions.next(this.options);

    this.params.parentFilterInstance(instance => {
      instance.onFloatingFilterChanged('equals', this.options.filter(el => el.selected && el.value != 'sall' && el.value != 'dsall').map( el=> el.value).join(','));
    });
	}

	setEvent($event) {
		setTimeout(() => {
			var dropdown = document.getElementById('dropdown-basic');
			if (dropdown) {
				dropdown.onmouseleave = () => {
					// var button = $event.target.closest('div').querySelector('button');
					$event.target.click();
				}
			}
		}, 500);
	}
}

@Component({
    selector: 'floating-cell',
    template: `<span ref="eCellWrapper" class="ag-cell-wrapper">
								<span class="ag-selection-checkbox">
									<span class="ag-icon ag-icon-checkbox-checked"></span>
								</span>
							</span>`
})
export class LpTblPinnedRowRenderer implements ICellRendererAngularComp {
    public params: any;
    public style: string;

    agInit(params: any): void {

    }

    refresh(): boolean{
        return false;
    }
}
@Component({
	selector: 'lp-tbl-select-all-header-cell',
	template: `
		<span class="ag-selection-checkbox" unselectable="on" (click)="onClickCheckbox()">
			<span class="ag-icon ag-icon-checkbox-checked" unselectable="on" [ngClass]="{'ag-hidden': state!='checked'}"></span>
			<span class="ag-icon ag-icon-checkbox-unchecked" unselectable="on" [ngClass]="{'ag-hidden': state!='unchecked'}"></span>
			<span class="ag-icon ag-icon-checkbox-indeterminate" unselectable="on" [ngClass]="{'ag-hidden': state!='indeterminate'}"></span>
		</span>
	`
})
export class LpTblSelectAllHeader {
	private params: any;
	state = 'unchecked'; // checked, indeterminate

	constructor(private cdr: ChangeDetectorRef) {}
	agInit(params): void {
		this.params = params;
		this.getSelectedAllState();
		this.params.api.addEventListener('selectionChanged', (evt) => {
			this.getSelectedAllState();
		});
		this.params.api.addEventListener('paginationChanged', (evt) => {
			this.getSelectedAllState();
		});
	}
	onClickCheckbox() {
		const rowCount = this.params.api.getDisplayedRowCount();
		const lastGridIndex = rowCount - 1;
		const currentPage = this.params.api.paginationGetCurrentPage();
		const pageSize = this.params.api.paginationGetPageSize();
		const startPageIndex = currentPage * pageSize;
		let endPageIndex = (currentPage + 1) * pageSize - 1;
		if (endPageIndex > lastGridIndex) {
			endPageIndex = lastGridIndex;
		}
		for (let i = startPageIndex; i <= endPageIndex; i++) {
			const rowNode = this.params.api.getDisplayedRowAtIndex(i);
			if (rowNode && rowNode.selectable) {
				rowNode.setSelected(this.state != 'checked');
			}
		}
		this.state = this.state == 'checked' ? 'unchecked' : 'checked';
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
	getSelectedAllState() {
		const rowCount = this.params.api.getDisplayedRowCount();
		const lastGridIndex = rowCount - 1;
		const currentPage = this.params.api.paginationGetCurrentPage();
		const pageSize = this.params.api.paginationGetPageSize();
		const startPageIndex = currentPage * pageSize;
		let endPageIndex = (currentPage + 1) * pageSize - 1;
		if (endPageIndex > lastGridIndex) {
			endPageIndex = lastGridIndex;
		}
		this.state = 'unchecked';
		for (let i = startPageIndex; i <= endPageIndex; i++) {
			const rowNode = this.params.api.getDisplayedRowAtIndex(i);
			if (rowNode) {
				if (rowNode.selectable == true && rowNode.selected == true) {
					this.state = 'checked';
				}
				else if (rowNode.selectable == true && rowNode.selected == false) {
					this.state = 'unchecked';
					break;
				}
			}
		}
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
	;
}


@Component({
    selector: 'app-loading-overlay',
    template: `
        <div class="custom-date-editor">
			<button class="w-20xp h-20px btn calendar" style="background-size: 15px; padding: 0" (click)="dp.toggle()" type="button"></button>
			<input type="text"
			class="form-control"
			#dp="bsDatepicker"
			(bsValueChange)="onDateChanged($event)"
			[(bsValue)]="date"
			bsDatepicker>
            <div *ngIf="date" style="top: 0px;
            position: absolute;
            right: 3px;
            height: 100%;
            display: flex;
            align-items: center;
            padding-top: 3px;
            width: 15px;
            justify-content: flex-end;"><i class="fa fa-times" (click)="clear()"></i></div>
		</div>
    `,
    styles: [
    ]
})
export class LpTblDateComponent {
    @ViewChild('dp', {static: true}) dp: any;
    public date: Date;
    public params: any;
    public dateType = 'datetime';
    public opened: EventEmitter<void>;

    constructor(
        private cdr: ChangeDetectorRef,
        private zone: NgZone
    ){}
    agInit(params: any): void {
        this.params = params;
        if (this.params.onDateChanged){
            this.dateType = 'date';
        }else{
            if (this.params.value && this.params.value != ''){
                this.dateType = this.params.value.indexOf(':') >= 0 ? 'datetime' : 'date';
            }
            this.date = new Date(this.params.value);
            setTimeout(() =>{
				this.dp.open();
				if (!(this.cdr as ViewRef).destroyed){
					this.cdr.detectChanges();
				}
			}, 0);
        }
    }

    ngAfterViewInit(): void {
    }
    onToogleClick(){
    }
    onOpened(){
        const self = this;
        setTimeout(() => {self.cdr.detectChanges();}, 0);

    }
    convertToCelValue(): string{
        if (this.date.toString() === 'Invalid Date'){
            return '';
        }
        const month = this.date.getMonth() + 1;
            const day = this.date.getDate();
            const year = this.date.getFullYear();
            const hour = this.date.getHours();
            const minute = this.date.getMinutes();
            const date = [(month > 9 ? month : '0' + month ), (day > 9 ? day : '0' + day), (year)].join('/');
            const time = [(hour > 9 ? hour : '0' + hour ), (minute > 9 ? minute : '0' + minute)].join(':');
        if (this.dateType == 'date'){
            return date;
        } else if (this.dateType == 'datetime'){
            return date + ' ' + time;
        }

    }
    ngOnDestroy() {
        const self = this;
        setTimeout(() => {
            if ( self.params.node != null && self.params.node != undefined)
            {
                this.params.node.setDataValue(this.params.column.colId, this.convertToCelValue());
            }
        } ,0);
    }

    onDateChanged(e) {
        if (this.params.onDateChanged){
			setTimeout(() => {
				this.params.onDateChanged();
			});
        }
    }
	clear() {
		this.date = null;
		if (this.params.onDateChanged){
            setTimeout(() => {
				this.params.onDateChanged();
			});
        }
	}

    getDate(): Date {
        return this.date;
    }

    setDate(date: Date): void {
       this.date = date || null;
    }
}
@Component({
	selector: 'lp-table',
	templateUrl: './lp-table.component.html',
	styleUrls: [
		'./lp-table.component.scss'
	],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class LpTableComponent implements OnInit, AfterViewInit, OnDestroy {

	unsubscribe: Subscription[] = [];

	@Input()
	set columnDefs(param) {

		const defs = cloneDeep(param);

		defs.forEach(def => {
			if (def.filter === 'agDateColumnFilter'){
				def.filterParams = {
					...def.filterParams,
					comparator(filterLocalDateAtMidnight, cellValue) {
							const dateAsString = cellValue;
							if (dateAsString == null) {return -1;}
							// var dateParts = dateAsString.split("/");
							// var cellDate = new Date(Number(dateParts[2]), Number(dateParts[1]) - 1, Number(dateParts[0]));
							const cellDate = new Date(dateAsString);
							if (filterLocalDateAtMidnight.getTime() == cellDate.getTime()) {
								return 0;
							}
							if (cellDate < filterLocalDateAtMidnight) {
								return -1;
							}
							if (cellDate > filterLocalDateAtMidnight) {
								return 1;
							}
					}
				};
			}
			if (def.fixed == true && def.width){
				def.maxWidth = def.width;
				def.minWidth = def.width;
			}
			if (def.filter === 'agSetColumnFilter'){
				def.filterParams.suppressMiniFilter = true;
			}
			if (def.filter && def.filter !== ''){
				def.filterParams = {
					...def.filterParams,
					newRowsAction: 'keep'
				};
			}
		});
		const columnDefs = [
			{
				headerName: '',
				editable: false,
				sortable: false,
				width: 42,
				maxWidth: 42,
				minWidth: 42,
				hide: !this.showCheckbox,
				checkboxSelection: params => {
					if (params && params.data && params.data.userIsSuspended){
						return false;
					}
					return true;
				},
				// headerCheckboxSelection: true,
        // headerCheckboxSelectionFilteredOnly: true,
				filter: false,
				field: 'select-all',
				pinned: 'left',
				fixed: true,
				tooltip: params => {
					if (params && params.data && params.data.userIsSuspended){
						return this.translate.instant('COMMON.USER.USER_IS_SUSPENDED');
					}
				},
				pinnedRowCellRenderer: params => {
					if (params && params.data && params.data.userIsSuspended){
						return '';
					}
					return 'LpTblPinnedRowRenderer';
				},
				cellRenderer: params => {
					if (params && params.data && params.data.userIsSuspended){
						return '<span style=\'position: absolute; left: 12px; top: 0px;\'><i class=\'fa fa-ban\'></i></span>';
					}
					return '';
				},
				headerComponent: this.showSelectAllCheckbox ? 'customHeader' : ''
			},
			...defs,
			{
				headerName: '',
				action: 'LAST-COLUMN',
				always: true,
				editable: false,
				sortable: false,
				width: 0,
				cellClass: 'last-column-cell custom-cell',
				headerClass: 'last-column-header',
				suppressSizeToFit: false,
				cellRenderer(params){
					return null;
				}
			},
			{
				action: 'DELETE',
				headerName: '',
				sortable: false,
				width: 42,
				maxWidth: 42,
				minWidth: 42,
				filter: false,
				hide: !this.showDeleteColumn,
				resizable: false,
				suppressSizeToFit: true,
				editable: false,
				pinned: 'right',
				tooltip: params => {
					if (params && params.data){
						return this.translate.instant('COMMON.GENERAL.DELETE');
					}
				},
				cellRenderer(params) {
					if (params.data){
						if (params.data.notRemovable){
							return '';
						} else {
							return '<i class="la la-trash"></i>';
						}
					}
				}
			}
		];
		this._columnDefs =  columnDefs;

		each(this.selectionPreviewColumns, col => {
			const el = find(columnDefs, c => c.field && c.field == col.field);
			if (el){
				col.name = el.headerName;
			} else {
				col.name = '';
			}
		});
		// setTimeout(() => {this.initSelectAllListener();}, 10);
	}

	constructor(private _ngZone: NgZone,
		private cdr: ChangeDetectorRef,
		private translate: TranslateService,
		private lpTableService: LpTableService) {
		this.rowModelType = 'serverSide';
		this.canPrevious = false;
		this.canNext = false;
		this.paginationInfo = '';

		this.defaultColDef = {
			resizable: true,
			floatingFilterComponentParams: {
				suppressFilterButton: true
			},
			suppressMenu: true,
			suppressMovable: true,
			cellClass: 'custom-cell',
			editable: true,
			sortable: true,
			suppressSizeToFit:  true,
			cellRenderer: 'singleClickEditRenderer',
		};
		this.colResizeDefault = 'shift';
		this.rowSelection = 'multiple';
		this.currentStartPage = 0;
		this.pageBtns = [];
		this.moreSelected = false;
		this.components = {
			// LpTblPinnedRowRenderer: LpTblPinnedRowRenderer,
			singleClickEditRenderer: this.getRenderer(),
			datePicker: this.getDatePicker()
		};
		this.frameworkComponents = { agDateInput: LpTblDateComponent,
			dropdownFloatingFilter: LpTblDropdownFloatingFilterComponent,
			LpTblDropdownFloatingFilterComponent,
			LpTblPinnedRowRenderer,
			customHeader: LpTblSelectAllHeader};

		this.rowClassRules = {
			'disabled-row':  (param) => {
				if (param && param.data && param.data.id){
					return this.disabledRowIds.includes(param.data.id);
				}
			},
			'disabled-select-row':  (param) => {
				if (param && param.data && param.data.id){
					return this.disabledSelectRowIds.includes(param.data.id);
				}
			}
		};
		this.isRowSelectable = (rowNode) => {
			if (rowNode && rowNode.data){
				return !this.disabledRowIds.includes(rowNode.data.id);
			}
		};
	}

	@Input() cacheBlockSize = 50;
	@Input() paginationPageSize = '50';
	@Input() hasPadding = true;
	@Input() suppressRowClickSelection = false;
	@Input() rowMultiSelectWithClick = true;
	@Input() showDeleteColumn = true;
	@Input() showDeSelectAll = true;
	@Input() showQuickSearch = false;
	@Input() showCheckbox = true;
	@Input() showFloatingFilter = true;
	@Input() showSelectAllCheckbox = true;
	@Input() showPagination = true;
	@Input() showCopyAction = false;
	@Input() showExtraAction = false;
	@Input() extraActionText = 'Action';
	@Input() disabledRowIds = [];
	@Input() disabledSelectRowIds = [];
	@Input() markedVideoRowIds = [];
	@Input() markedPersonRowIds = [];
	@Input() markedPhoneRowIds = [];
	@Input() markedBanRowIds = [];
	@Input() markedRowIds = [];
	@Input() willRefreshTable: Subject<string> = new Subject<string>();
	@Input() isLoading: Subject<boolean> = new Subject<boolean>();
	@Input() deleteAllName = 'COMMON.TABLE.DELETE_ALL';
	@Input() deSelectAllName = 'COMMON.TABLE.DESELECT_ALL';


	@Input() extraActions: any[] = [];


	@Output() paginationChanged = new EventEmitter();
	@Output() action = new EventEmitter();
	@Output() selectionChanged = new EventEmitter();
	@Output() rowDoubleClicked = new EventEmitter();
	@Output() gridApiReady = new EventEmitter();



	@ViewChild('customTable', {static: true}) el: ElementRef;

	mainActions: any[] = [
		{
			text: 'Deselect all',
			type: 'DESELECT_ALL',
			icon: 'la la-minus-square',
			iconOnly: true
		},
		{
			text: 'Delete all',
			type: 'DELETE',
			icon: 'la la-trash',
			iconOnly: true,
		}
	];
	public gridApi;
	public gridColumnApi;

	public defaultColDef;
	public colResizeDefault;
	public rowData = [];
	public frameworkComponents;
	public rowSelection;
	public isRowSelectable;

	public moreSelected;

	public currentStartPage;
	public pageBtns;
	public components;
	public quickFilter;
	public showConfirmDialog;
	public removingData;
	public updatingData;
	public rowModelType;
	public cacheOverflowSize;

	public maxConcurrentDatasourceRequests;
	public infiniteInitialRowCount;
	public maxBlocksInCache;
	public _columnDefs;
	public canPrevious;
	public canNext;
	public paginationInfo;
	public rowClassRules = {};

	originSelectedRowIds = [];
	currentSelectedRowIds = [];
	totalRowCount = 0;
	selectedInfo = '';
	originSelectedRowsTmp = [];
	originSelectedRows = [];
	selectionPreviewColumns = [];
	isShowPreviewSelection = false;

	public isDestroyed = false;
	getRowNodeId = (data) => data.id;

	@Input() getContextMenuItems = (param) => [
			'copy'
		];

	public refreshColumns(){
		const self = this;
		if (!self.isDestroyed && self.gridApi && self.gridColumnApi){
			const allColumnIds = self.gridColumnApi.getAllColumns().map(column => column.colId);
			self.gridColumnApi.autoSizeColumns(allColumnIds);
			self.gridApi.sizeColumnsToFit();
			self.gridApi.refreshHeader();
			// self.initSelectAllListener();
		}
	}
	ngAfterViewInit(): void {
		this.mainActions[1].hidden = !this.showDeleteColumn;
	}

	ngOnInit() {

	}
	ngOnDestroy(){
		this.isDestroyed = true;
		this.unsubscribe.forEach ( u => u.unsubscribe());
	}
	onGridReady(params) {
		const self = this;

		this.gridApi = params.api;
		this.gridColumnApi = params.columnApi;
		params.api.setHeaderHeight(47);
		if (this.showFloatingFilter){
			params.api.setFloatingFiltersHeight(47);
		} else {
			params.api.setFloatingFiltersHeight(1);
		}
		// this.gridApi.addEventListener('gridSizeChanged', function(){
		// });
		this.gridApi.addEventListener('paginationChanged', function(){
			self.onUpdatePageButtons();
			if (!self.isDestroyed && self.gridApi && self.gridColumnApi){
				const allColumnIds = self.gridColumnApi.getAllColumns().map(column => column.colId);
				self.gridColumnApi.autoSizeColumns(allColumnIds);
				self.gridApi.sizeColumnsToFit();
			}
		});

		this.gridApi.addEventListener('rowDoubleClicked', (evt) => {
			this.rowDoubleClicked.emit(evt);
		});

		// this.gridApi.addEventListener('rowSelected', function(param) {
		// 	console.log(param);
		// 	self.rowSelected.emit({data: param.node.data, selected: param.node.selected});
		// });

		const dataServer = {
			getServerData( callback, request){
				const payload = { ...request };
				if (self.quickFilter !== ''){
					payload.quickFilter = self.quickFilter;
				}
				payload.pageSize = payload.endRow - payload.startRow;

				const selectedRowIds = self.gridApi.getSelectedNodes().map( node => node.data.id);
				self.originSelectedRowIds = self.originSelectedRowIds.filter( el => !self.currentSelectedRowIds.includes(el));
				self.originSelectedRowIds = union(self.originSelectedRowIds, selectedRowIds);


				self.paginationChanged.emit({ cb: dbCallback, payload});
				function dbCallback(data, totalRows) {
					if (Array.isArray(data)) {
						const lastRow = data.length < (request.endRow - request.startRow )? request.startRow + data.length : totalRows;
						callback(data, lastRow);
					}
					self.isLoading.next(false);
				}

			}
		};
		const dataSource =  {
			getRows(params) {
				const request = params.request;

				self.isLoading.next(true);

				dataServer.getServerData(successCallback, request);
				function successCallback(resultForGrid, lastRow) {
					params.successCallback(resultForGrid, lastRow);

					// Initial column size
					setTimeout( () => {
						// if (!self.gridApi.isAnyFilterPresent()){
							self.totalRowCount = self.gridApi.paginationGetRowCount();
						// }
						self.gridApi.deselectAll();
						self.gridApi.forEachNode ( node => {
							if (node.data && node.data.id && !self.disabledRowIds.includes(node.data.id) && !self.disabledSelectRowIds.includes(node.data.id)){
								node.setSelected(self.originSelectedRowIds.includes(node.data.id));
							}
						});

						self.currentSelectedRowIds = self.gridApi.getSelectedNodes().map( node => node.data.id);

						const allColumnIds = self.gridColumnApi.getAllColumns().map(column => column.colId);
						self.gridColumnApi.autoSizeColumns(allColumnIds);
						self.gridApi.sizeColumnsToFit();
						// self.initSelectAllListener();
					}, 0);


				}
			}
		};

		this.gridApi.setServerSideDatasource(dataSource);

		this.unsubscribe.push(this.willRefreshTable.subscribe( type => {
			setTimeout( () => {
				if (type == 'COLUMNS'){
					this.refreshColumns();
				} else if ( type == 'ROWS'){
					this.gridApi.redrawRows();
				} else if ( type == 'DATA'){
					this.gridApi.purgeServerSideCache();
				}
			},0);
		}));

		this.unsubscribe.push(this.lpTableService.pageContentWidthChanged$.subscribe( width => {
			setTimeout(() => {
				this.refreshColumns();
			},0);
		}));

		this.gridApi.paginationSetPageSize(parseInt(this.paginationPageSize));

		this.gridApiReady.emit();
	}

	getPaginationInfoString() {
		if (this.gridApi){
			const startRow = this.gridApi.paginationGetCurrentPage() * this.gridApi.paginationGetPageSize()  + 1;
			const totalRow = this.gridApi.paginationGetRowCount();
			let endRow = this.gridApi.paginationGetPageSize()  * ( this.gridApi.paginationGetCurrentPage() + 1);
			endRow = endRow > totalRow ? totalRow: endRow;

			return totalRow <= 1 ? '': this.translate.instant('COMMON.TABLE.PAGINATION_INFO')
				.replace('{start}', startRow)
				.replace('{end}', endRow)
				.replace('{total}', totalRow);
		} else {
			return '';
		}
	}
	getSelectionInfoString() {
		return this.translate.instant('COMMON.TABLE.SELECTED_INFO').replace('{selected}', this.originSelectedRowIds.length)
			.replace('{total}', this.totalRowCount);
	}
	onDeleteAllButton(){
		// const selectedRows = this.gridApi.getSelectedNodes() || [];
		// if (selectedRows.length == 0)
		// {
		// 	return;
		// }
		// const payload = selectedRows.map(node => node.data.id);
		this.action.emit({type: 'DELETE', payload: this.originSelectedRowIds});
	}
	onDeSelectAllButton(){
		this.originSelectedRowIds.forEach(id => {
			const node = this.gridApi.getRowNode(id);
			if (node) {
				node.setSelected(false);
			}
		});
		this.originSelectedRowIds = [];
		this.originSelectedRows = [];
		this.originSelectedRowsTmp = [];
	}

	onCopyAll(){

		this.onClearFilter();
		const selectedRows = this.gridApi.getSelectedNodes() || [];
		if (selectedRows.length == 0)
		{
			return;
		}
		const payload = selectedRows.map(node => node.data.id);
		this.action.emit({type: 'COPY', payload});
	}
	onCutAll(){
		this.onClearFilter();
		const selectedRows = this.gridApi.getSelectedNodes() || [];
		if (selectedRows.length == 0)
		{
			return;
		}
		const payload = selectedRows.map(node => node.data.id);
		this.action.emit({type: 'CUT', payload});
	}
	onMoveAll(){
		this.onClearFilter();
		const selectedRows = this.gridApi.getSelectedNodes() || [];
		if (selectedRows.length == 0)
		{
			return;
		}
		const payload = selectedRows.map(node => node.data.id);
		this.action.emit({type: 'MOVE', payload});
	}

	initSelectAllListener(){
		const self = this;
		if (!this.showSelectAllCheckbox) {
			return;
		}
		const arrHeaderCellEl = this.el.nativeElement.getElementsByClassName('ag-header-cell');
		for ( let i = 0 ; i < arrHeaderCellEl.length ; i++){

			if (arrHeaderCellEl[i].getAttribute('col-id') && arrHeaderCellEl[i].getAttribute('col-id').indexOf('select-all') >= 0){

				const  targetEl = arrHeaderCellEl[i].querySelector('.ag-header-select-all');
				if (targetEl){

					targetEl.classList.remove('ag-hidden');


					targetEl.id = 'select-all-chkbox';

					targetEl.addEventListener('click', function(evt: any){

						if (evt.target.className.indexOf('ag-header-select-all') >= 0){

							evt.target.childNodes.forEach( nodeEl => {

								if ( nodeEl.className && nodeEl.className.indexOf('ag-checkbox-checked') >= 0){

									if (nodeEl.className.indexOf('ag-hidden') >= 0){

										self.gridApi.forEachNode(function( node) {
											if (node.data && node.data.id && (self.disabledRowIds.includes(node.data.id) || self.disabledSelectRowIds.includes(node.data.id))){

											} else {
												node.setSelected(false);
											}
										});
										nodeEl.classList.remove('ag-hidden');
									}else{

										self.gridApi.forEachNode(function( node) {
											if (node.data && node.data.id && (self.disabledRowIds.includes(node.data.id) || self.disabledSelectRowIds.includes(node.data.id))){

											} else {
												node.setSelected(true);
											}
										});
										nodeEl.classList.add('ag-hidden');
									}
								}
							});
						}else if (evt.target.className.indexOf('ag-icon-checkbox-checked') >= 0){

							self.gridApi.forEachNode(function( node) {
								if (node.data && node.data.id && (self.disabledRowIds.includes(node.data.id) || self.disabledSelectRowIds.includes(node.data.id))){

								} else {
									node.setSelected(false);
								}
							});
						} else {

							self.gridApi.forEachNode(function( node) {
								if (node.data && node.data.id && (self.disabledRowIds.includes(node.data.id) || self.disabledSelectRowIds.includes(node.data.id))){

								} else {
									node.setSelected(true);
								}
							});
						}

					});
				}
			}
		}
	}

	onUpdatePageButtons(): void {
		let index;
		const curPage = this.gridApi.paginationGetCurrentPage();
		const start = curPage - curPage % 5;
		this.currentStartPage = start;
		this.pageBtns = [];
		this.canNext = false;
		this.canPrevious = false;
		if (curPage > 0) {
			this.canPrevious = true;
		}
		if ( curPage < this.gridApi.paginationGetTotalPages() - 1){
			this.canNext = true;
		}
		if (start > 0) {
			// this.canPrevious = true;
			// this.pageBtns.push({
			// 	name: '...',
			// 	index: -100
			// });
		}
		for (index = start; index - start < 5 && this.gridApi.paginationGetTotalPages() > index ; index++) {
			this.pageBtns.push({
				name: index + 1,
				index
			});
		}
		if (index < this.gridApi.paginationGetTotalPages()) {
			// this.canNext = true;
			// this.pageBtns.push({
			// 	name: '...',
			// 	index: -200
			// });
		}
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}

		this.pinSelectedRowsTop();
	}
	onCellClicked(evt){
		try {
			if (evt.column.userProvidedColDef.action && evt.rowPinned != 'bottom'){
				if (!this.disabledRowIds.includes(evt.data.id) || evt.column.userProvidedColDef.always){
					this.action.emit({
						type: evt.column.userProvidedColDef.action,
						payload: [evt.data.id],
						event: evt.event
					});
				}
			} else if (!evt.column.userProvidedColDef.action && evt.rowPinned != 'bottom') {
				if (this.showCheckbox && !evt.event.target.closest('.action') && !evt.event.target.closest('.show-action')) {
					const node = this.gridApi.getRowNode(evt.data.id);
					if (node) {
						node.setSelected(!this.originSelectedRowIds.includes(evt.data.id));
					}
				}
			}
		} catch (error) {

		}
	}

	// onFilterTextBoxChanged(evt): void {
	// 	this.gridApi.setQuickFilter(this.quickFilter);
	// }


	onBtPage(btn) {
		if (btn.index === -100) {
			this.currentStartPage = this.currentStartPage - 5 >= 0 ? this.currentStartPage - 5 : 0;
			this.gridApi.paginationGoToPage(this.currentStartPage + 4);
		} else if (btn.index === -200) {
			this.currentStartPage = this.currentStartPage + 5;
			this.gridApi.paginationGoToPage(this.currentStartPage);
		} else {
			this.gridApi.paginationGoToPage(btn.index);
		}
	}

	onBtFirst() {
		if (!this.canPrevious) {return;}

		this.gridApi.paginationGoToFirstPage();
	}

	onBtLast() {
		if (!this.canNext) {return;}

		this.gridApi.paginationGoToLastPage();
	}

	onBtNext() {
		if (!this.canNext) {return;}

		this.gridApi.paginationGoToNextPage();
	}

	onBtPrevious() {
		if (!this.canPrevious) {return;}
		this.gridApi.paginationGoToPreviousPage();
	}

	pinSelectedRowsTop() {
		const selectedRowIdsTmp = this.originSelectedRowsTmp.map( data => data.id);
		// const removedRowIds = difference( selectedRowIds, selectedRowIdsTop);
		// each ( removedRowIds, id => {
		// 	this.originSelectedRows = this.originSelectedRows.filter( data => data.id != id);
		// });
		const addedRowIds = difference( this.originSelectedRowIds, selectedRowIdsTmp);
		each ( addedRowIds, id => {
			const node = this.gridApi.getRowNode(id);
			if (node && node.data){
				this.originSelectedRowsTmp.push(node.data);
			}
		});
		this.originSelectedRows = this.originSelectedRowIds.map( id => {
			const row = find(this.originSelectedRowsTmp, el => el.id == id);
			if (row){
				return row;
			} else {
				return null;
			}
		}).filter( e => e);
  	}
	onSelectionChanged(evt){
		this.gridApi.getSelectedNodes().map( node => {
			if (this.disabledRowIds.includes(node.data.id) || this.disabledSelectRowIds.includes(node.data.id)){
				node.setSelected(false);
			}
		});
		this.originSelectedRowIds = this.originSelectedRowIds.filter( _id => !this.currentSelectedRowIds.includes(_id));
		this.currentSelectedRowIds = this.gridApi.getSelectedNodes().filter( node => {
			if (node.data.userIsSuspended) {return false;}
			return true;
		}).map( node => node.data.id);
		this.originSelectedRowIds = union(this.originSelectedRowIds, this.currentSelectedRowIds);
		// this.originSelectedRowIds = this.originSelectedRowIds.filter( _id => !this.disabledRowIds.includes(_id) && !this.disabledSelectRowIds.includes(_id));
		this.pinSelectedRowsTop();

		this.selectionChanged.emit(evt);

		// this.gridApi.setPinnedTopRowData(this.gridApi.getSelectedNodes().map( node => node.data));

	}

	onPageSizeChanged(){
		this.gridApi.paginationSetPageSize(parseInt(this.paginationPageSize));
		this.gridApi.purgeServerSideCache();
	}

	onClearFilter(){
		this.gridApi.setFilterModel({});
		this.gridApi.setQuickFilter(this.quickFilter = '');
	}

	getDatePicker() {
		const self = this;
		function Datepicker() {}
		Datepicker.prototype.init = function(params) {
				self._ngZone.run( ()=> {
					const template =
						`<input type="text"
						class="form-control"
						[bsConfig]="{}"
						#dp="bsDatepicker"
						bsDatepicker>`;

					const tempDiv = document.createElement('div');
					tempDiv.innerHTML = template;
					this.eInput = tempDiv.firstElementChild;
					// this.eInput = document.createElement("input");
					this.eInput.value = params.value;
					if (params.value.indexOf(':') > 0){
						console.log(params.value);
						// flatpickr(this.eInput, {dateFormat: 'm/d/Y H:i', enableTime: true});
					}else {
						console.log(params.value);
						// flatpickr(this.eInput, {dateFormat: 'm/d/Y'});
					}
				});
		};
		Datepicker.prototype.getGui = function() {
			return this.eInput;
		};
		Datepicker.prototype.afterGuiAttached = function() {
			 this.eInput.focus();
			// this.eInput.select();
		};
		Datepicker.prototype.getValue = function() {
			return this.eInput.value;
		};
		Datepicker.prototype.destroy = function() {};
		Datepicker.prototype.isPopup = function() {
			return false;
		};
		return Datepicker;
	}
	onClickedOutside(evt) {
		if (this.gridApi && evt.path && evt.path[0] && evt.path[0].className && typeof evt.path[0].className == 'string' && evt.path[0].className.indexOf('mat-datetimepicker') == -1  && evt.target.className !== 'flaticon2-note' && evt.target.id !== 'theButton'){
			this.gridApi.stopEditing(false);
		}
	}
	onCellValueChanged(evt) {
		if (evt.oldValue !== evt.newValue)
		{
			this.action.emit({type: 'UPDATE_ROW', payload : [evt.node.data]});
		}
	}
	getRenderer() {
		const self = this;
		function CellRenderer() {}
		CellRenderer.prototype.createGui = function(editable) {
			let template =
				'<span><span id="theValue" style="padding-left: 4px;"></span><button id="theButton" ';
			if (editable)
			{
				template += 'class="editable"';
			}
			template += '><i class="la la-pen"></i></button></span>';
			const tempDiv = document.createElement('div');
			tempDiv.innerHTML = template;
			this.eGui = tempDiv.firstElementChild;
		};
		CellRenderer.prototype.init = function(params) {
			this.createGui(params.colDef.editable);
			// if (params.value != null && (typeof params.value === 'string' || params.value instanceof String) && params.value.length > 40) {
			// 	params.value = params.value.substring(0, 40) + '...';
			// }
			this.params = params;
			const eValue = this.eGui.querySelector('#theValue');
			if (params.value)
				{eValue.innerHTML = params.value;}
				else{
					eValue.innerHTML = '';
				}
			this.eButton = this.eGui.querySelector('#theButton');
			this.buttonClickListener = this.onButtonClicked.bind(this);
			this.eButton.addEventListener('click', this.buttonClickListener);
		};
		CellRenderer.prototype.onButtonClicked = function(e) {
			e.stopPropagation();
			const startEditingParams = {
				rowIndex: this.params.node.rowIndex,
				colKey: this.params.column.getId()
			};
			this.params.api.startEditingCell(startEditingParams);
			if (!(self.cdr as ViewRef).destroyed) {
				self.cdr.detectChanges();
			}
		};
		CellRenderer.prototype.getGui = function() {
			return this.eGui;
		};
		CellRenderer.prototype.destroy = function() {
			this.eButton.removeEventListener('click', this.buttonClickListener);
		};
		return CellRenderer;
	}

	onExtraAction(action) {
		this.action.emit({type: action.type, payload: this.originSelectedRowIds});
	}
	onMainAction(action) {
		if (action.type == 'DESELECT_ALL') {
			this.onDeSelectAllButton();
		} else {
			this.action.emit({type: action.type, payload: this.originSelectedRowIds});

		}
	}
}
