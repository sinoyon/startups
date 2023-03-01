import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of, Subscription } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { AliasService } from 'src/app/pages/common/alias.service';
import { CampaignService } from 'src/app/pages/common/campaign.service';
import { CountryService } from 'src/app/pages/common/country.service';
import { UserService } from 'src/app/pages/common/user.service';

@Component({
  selector: 'app-role-edit',
  templateUrl: './role-edit.component.html',
})
export class RoleEditComponent implements OnInit, OnDestroy {
  id;
  role;
  previous;
  formGroup: FormGroup;
  isLoading$: Observable<boolean>;

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
      label: 'USER',
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

  private unsubscribe: Subscription[] = [];

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


  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private campaignService: CampaignService,
    private aliasService: AliasService,
    private cdr: ChangeDetectorRef,
    private countryService: CountryService
  ) { }

  ngOnInit(): void {
    this.isLoading$ = this.userService.isLoading$;
    this.loadCountries();
    this.loadRole();
  }

  loadRole() {
    const sb = this.route.paramMap.pipe(
      switchMap(async params => {
        // get id from URL
        const id = params.get('id');
        if (id) {
          try {
            const role = await this.userService.getRoleById(id);
            return role;
          } catch (error) {
            console.log(error);
          }
          return undefined;
        } else {
          return {
            permissions: []
          };
        }

      }),
      catchError((errorMessage) => of(undefined)),
    ).subscribe((res: any) => {
      if (!res) {
        this.router.navigate(['/admin/user-management/roles'], { relativeTo: this.route });
      }

      this.role = res;
      this.previous = Object.assign({}, res);

      this.loadForm();
    });
    this.unsubscribe.push(sb);
  }

  loadForm() {
    if (!this.role) {
      return;
    }

    this.formGroup = this.fb.group({
      description: [this.role.description, Validators.compose([Validators.required])],
    });

    if (!(this.cdr as ViewRef).destroyed) {
      this.cdr.detectChanges();
    }

  }

  reset() {
    if (!this.previous) {
      return;
    }

    this.role = Object.assign({}, this.previous);
    this.loadForm();
  }

  save() {
    this.formGroup.markAllAsTouched();
    if (!this.formGroup.valid) {
      return;
    }
    const formValues = this.formGroup.value;

    this.role.description = formValues.description;

    this.role.permissions = this.role.permissions.filter( el => el.permission);
    this.role.permissions.forEach( p => {
      p.country = p.country.map( el => el.key || el);
      p.typology = p.typology.map( el => el.key || el);
    });
    if (this.role._id) {
      this.edit();
    } else {
      this.create();
    }
  }

  async edit() {
    const res = await this.userService.updateRole(this.role);
    if (res) {
      this.router.navigate(['/admin/user-management/roles']);
    } else {

    }
  }

  create() {
    const res = this.userService.createRole(this.role);
    if (res) {
      this.router.navigate(['/admin/user-management/roles']);
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
    this.role.permissions.push({
      permission: null,
      country: [],
      typology: [],
      readable: true,
      writable: false,
      downloadable: false
    });
  }
  async loadCountries() {
		this.countries = ['italy','spain', 'france'].map( el => ({
      key: el,
      title: el.charAt(0).toUpperCase() + el.slice(1)
    }));
	}
}
