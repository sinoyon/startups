import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import {cloneDeep} from 'lodash';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { LpTableComponent } from 'src/app/pages/common/lp-table/lp-table.component';
import { UserService } from 'src/app/pages/common/user.service';
import { KTUtil } from 'src/app/_metronic/kt';
import { QueryResultsModel } from 'src/app/pages/common/models/query-results.model';
import { RoleAddDialog } from '../role-add-dialog/role-add.dialog';
import { PermissionsDetailDialog } from '../permissions-detail/permissions-detail.dialog';
import { CountryService } from 'src/app/pages/common/country.service';

@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.scss']
})
export class UserEditComponent implements OnInit, OnDestroy {
  locale = 'it-IT';
  id;
  user;
  previous;
  formGroup: FormGroup;

  isLoading$: Observable<boolean>;

	columnDefs: any[] = [];
	isEmptyTable = false;
	keptPage = -1;


	@ViewChild('tableCtrl', {static: false}) tableCtrl: LpTableComponent;

  permissions = [
    {
      label: 'COMPANY',
      value: 'company'
    },
    {
      label: 'SOURCE',
      value: 'source'
    },
    {
      label: 'ADVERTISEMENT',
      value: 'advertisement'
    },
    {
      label: 'ALIAS',
      value: 'alias'
    },
    {
      label: 'SCRAPING',
      value: 'scraping'
    },
    {
      label: 'GENERAL.USER',
      value: 'user'
    },
    {
      label: 'REPORT FUNDING',
      value: 'funding'
    },
    {
      label: 'REPORT ANALYTICS',
      value: 'analytics'
    },
  ];
  countries = [];
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
  typologies: any[] = [
		{key: 'company equity', title: 'company equity'},
		{key: 'company lending', title: 'company lending'},
		{key: 'real estate equity', title: 'real estate equity'},
		{key: 'real estate lending', title: 'real estate lending'},
		{key: 'minibond', title: 'minibond'}
	];

  private unsubscribe: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private modal: NgbModal,
    private translate: TranslateService,
    private countryService: CountryService
  ) { }

  ngOnInit(): void {
    this.isLoading$ = this.userService.isLoading$;
    this.loadCountries();
    this.loadUser();
    this.unsubscribe.push(this.translate.onLangChange.subscribe( lang => {
			this.updateByTranslate(lang.lang);
		}));
		this.updateByTranslate(this.translate.currentLang);
  }

  loadUser() {
    const sb = this.route.paramMap.pipe(
      switchMap(async params => {
        // get id from URL
        const id = params.get('id');
        if (id) {
          try {
            const user = await this.userService.getById(id);
            return user;
          } catch (error) {
            console.log(error);
          }
          return undefined;
        } else {
          return {
            roles: [],
            permissions: []
          };
        }

      }),
      catchError((errorMessage) => of(undefined)),
    ).subscribe((res: any) => {
      if (!res) {
        this.router.navigate(['/admin/user-management/users'], { relativeTo: this.route });
      }

      this.user = res;
      this.user.hasRole = this.user.hasRole ? true : (this.user.roles.length && !this.user.permissions.length ? true : false);
      this.previous = Object.assign({}, res);
      console.info('user =: ', this.user);
      
      this.loadForm();
    });
    this.unsubscribe.push(sb);
  }

  loadForm() {
    if (!this.user) {
      return;
    }

    this.formGroup = this.fb.group({
      firstName: [this.user.firstName, Validators.compose([Validators.required])],
      lastName: [this.user.lastName, Validators.compose([Validators.required])],
      email: [this.user.email, Validators.compose([Validators.email, Validators.required])]
    });

    if (!(this.cdr as ViewRef).destroyed) {
      this.cdr.detectChanges();
    }

    this.updateByTranslate(this.translate.currentLang);
    this.tableCtrl.originSelectedRowIds = this.user.roles.map(el => el._id);
  }

  reset() {
    if (!this.previous) {
      return;
    }

    this.user = Object.assign({}, this.previous);
    this.loadForm();
  }

  save() {
    this.formGroup.markAllAsTouched();
    if (!this.formGroup.valid) {
      return;
    }
    const formValues = this.formGroup.value;
    this.user = Object.assign(this.user, formValues);
    this.user.permissions = this.user.permissions.filter( el => el.permission);
    this.user.permissions.forEach( p => {
      p.country = p.country.map( el => el.key || el);
      p.typology = p.typology.map( el => el.key || el);
    });
    this.user.roles = this.tableCtrl.originSelectedRowIds;

    if (this.user.roles.length == 0) {
      this.user.hasRole = false;
    }

    if (this.user._id) {
      this.edit();
    } else {
      this.create();
    }
  }

  async edit() {
    const res = await this.userService.update(this.user);
    if (res) {
      this.router.navigate(['/admin/user-management/users']);
    } else {

    }
  }

  create() {
    const res = this.userService.create(this.user);
    if (res) {
      this.router.navigate(['/admin/user-management/users']);
    } else {

    }
  }

  ngOnDestroy() {
    this.unsubscribe.forEach(sb => sb.unsubscribe());
  }

  // helpers for View
  isControlValid(controlName: string): boolean {
    const control = this.formGroup.controls[controlName];
    return control.valid && (control.dirty || control.touched);
  }

  isControlInvalid(controlName: string): boolean {
    const control = this.formGroup.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  controlHasError(validation: string, controlName: string) {
    const control = this.formGroup.controls[controlName];
    return control.hasError(validation) && (control.dirty || control.touched);
  }

  isControlTouched(controlName: string): boolean {
    const control = this.formGroup.controls[controlName];
    return control.dirty || control.touched;
  }


  onAddCountry(item, value, ctrl) {
    if (!value) {return;}
    if (item.country && !item.country.includes(value)) {
      item.country.push(value);
    }
    setTimeout(() => {
      if (ctrl) {
        ctrl.selectedOption = null;
        if (!(this.cdr as ViewRef).destroyed) {
          this.cdr.detectChanges();
        }
      }
    });
	}
  onDeleteCountry(item, index) {
    if (item.country) {
      item.country.splice(index, 1);
    }
	}
  onAddTypology(item, value, ctrl) {
    if (!value) {return;}
    if (item.typology && !item.typology.includes(value)) {
      item.typology.push(value);
    }
    setTimeout(() => {
      if (ctrl) {
        ctrl.selectedOption = null;
        if (!(this.cdr as ViewRef).destroyed) {
          this.cdr.detectChanges();
        }
      }
    });
	}
  onDeleteTypology(item, index) {
    if (item.typology) {
      item.typology.splice(index, 1);
    }
	}
	onSelectPermission(item, value) {
    item.permission = value;
  }
  onClickAddPermission() {
    this.user.permissions.push({
      permission: null,
      country: [],
      typology: [],
      readable: true,
      writable: false,
      downloadable: false
    });
  }
  deletePermission(permission, index) {
    (this.user.permissions as Array<any>).splice(index, 1);
  }
  onAddRole() {
    const modalRef = this.modal.open(RoleAddDialog, { animation: false});

    modalRef.componentInstance.excepted = this.user.roles.map( el => el._id);

    const subscr = modalRef.closed.subscribe( async res => {

      try {

        if (!res || res.length == 0) {throw {};}

      } catch (error) {

      }
      setTimeout(() => subscr.unsubscribe(), 100);
    });
  }
  updateByTranslate(lang){
		if (lang == 'en') {
			this.locale = 'en-US';
		} else if (lang == 'it') {
			this.locale = 'it-IT';
		}
		this.defineColumns();
	}

  async onAction(param) {
		const ids = param.payload;
		let selectedIds = ids;
		if (ids.length > 1) {
			selectedIds = this.tableCtrl.originSelectedRowIds;
		}
	}
	defineColumns() {
    if (!this.tableCtrl) {return;}
		const isMobile = KTUtil.isMobileDevice();
		this.tableCtrl.selectionPreviewColumns = [{field: 'description'}];
		const columnDefs = [
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
    if (!this.tableCtrl) {throw {};}
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
		if (this.keptPage > 0 ){
			setTimeout(() => {
				this.tableCtrl.gridApi.paginationGoToPage(this.keptPage);
				this.keptPage = -1;
			}, 0);
		}
	}
  onShowPermissions(data) {
		const modalRef = this.modal.open(PermissionsDetailDialog, { animation: false, backdrop : 'static',
    size: 'xl',
		keyboard : false});
    modalRef.componentInstance.role = data;
	}
  async loadCountries() {
		this.countries = ['italy','spain', 'france'].map( el => ({
      key: el,
      title: el.charAt(0).toUpperCase() + el.slice(1)
    }));
	}
}
