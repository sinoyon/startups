import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of, Subscription } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import {union, unionWith, cloneDeep} from 'lodash';
import { CompanyService } from 'src/app/pages/common/company.service';
import { CampaignService } from 'src/app/pages/common/campaign.service';
import { AliasService } from 'src/app/pages/common/alias.service';
import { ToastService } from 'src/app/pages/common/toast.service';
import { CountryService } from 'src/app/pages/common/country.service';

@Component({
  selector: 'app-company-edit',
  templateUrl: './company-edit.component.html',
  styleUrls: ['./company-edit.component.scss']
})
export class CompanyEditComponent implements OnInit, OnDestroy {
  id;
  company;
  previous;
  formGroup: FormGroup;
  isLoading$: Observable<boolean>;
  errorMessage = '';

  selectableTags = [];
  selectableTypes = [];
  currentSocial;
  currentSocialIndex = -1;
  isLoadedEditor = false;

  types: any[] = [{
    label: 'None',
    value: null
  }];

  private unsubscribe: Subscription[] = [];

  selectableCountries = [{
    label: 'Italy',
    value: 'italy'
  },
  {
    label: 'France',
    value: 'france'
  }];


  @ViewChild('tagSelector', {static: false}) tagSelector;
  @ViewChild('typeSelector', {static: false}) typeSelector;

  constructor(
    private fb: FormBuilder,
    private companyService: CompanyService,
    private router: Router,
    private route: ActivatedRoute,
    private campaignService: CampaignService,
    private aliasService: AliasService,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.isLoading$ = this.companyService.isLoading$;
    this.loadCompany();
  }

  loadCompany() {
    const sb = this.route.paramMap.pipe(
      switchMap(async params => {

        try {
          const payload = {
            filterModel: {
              type: {
                filterType: 'text',
                filter: 'company.type'
              },
              confirmed: true,
              ignore: {
                filterType: 'ne',
                value: true
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
          const res = await this.aliasService.get(payload);
          if (!res) {throw {};}
          this.types = [{
            label: 'None',
            value: null
          }];
          this.types = this.types.concat(res.items.map( el => ({
              value: el._id,
              label: el.names[0].value,
              names: el.names
            })));
        } catch (error) {

        }

        // get id from URL
        const id = params.get('id');
        if (id) {
          try {
            const company = await this.companyService.getById(id);
            if (company.articleDate) {
              company.articleDate = new Date(company.articleDate);
            }
            return company;
          } catch (error) {
            console.log(error);
          }
          return undefined;
        } else {
          const campaignId = this.route.snapshot.queryParams.campaignId;
          if (campaignId) {
            try {
              const campaign = await this.campaignService.getById(campaignId);
              if (campaign) {
                return {
                  campaigns: [campaignId],
                  name: campaign.companyName,
                  physicalLocation: campaign.companyPhysicalLocation,
                  contactEmail: campaign.companyContactEmail,
                  webPageLink: campaign.companyWebPageLink,
                  tags: [],
                  deletedTags: [],
                  socials: campaign.socials
                };
              }
            } catch (error) {
              console.log(error);
            }
          }
          return {
            campaigns: [],
            tags: [],
            socials: []
          };
        }

      }),
      catchError((errorMessage) => {
        this.errorMessage = errorMessage;
        return of(undefined);
      }),
    ).subscribe((res: any) => {
      if (!res) {
        this.router.navigate(['/admin/companies'], { relativeTo: this.route });
      }

      this.company = res;
      this.previous = Object.assign({}, res);

      this.loadForm();
    });
    this.unsubscribe.push(sb);
  }

  loadForm() {
    if (!this.company) {
      return;
    }

    this.formGroup = this.fb.group({
      name: [this.company.name, Validators.compose([Validators.required])],
      fiscalCode: [this.company.fiscalCode],
      contactEmail: [this.company.contactEmail, Validators.compose([Validators.email])]
    });

    if (!(this.cdr as ViewRef).destroyed) {
      this.cdr.detectChanges();
    }

    if (this.tagSelector) {
			this.tagSelector.registerOnChange( (value) => {
				this.onAddTag();
			});
		}
    if (this.typeSelector) {
      if (this.company.type) {
        this.typeSelector.writeValue(this.company.type._id);
      }
    }

    if (!(this.cdr as ViewRef).destroyed) {
      this.cdr.detectChanges();
    }
  }

  reset() {
    if (!this.previous) {
      return;
    }

    this.company = Object.assign({}, this.previous);
    this.loadForm();
  }

  save() {
    this.formGroup.markAllAsTouched();
    if (!this.formGroup.valid) {
      return;
    }

    const formValues = this.formGroup.value;
    this.company = Object.assign(this.company, formValues);

    const data = cloneDeep(this.company);
    data.type = this.typeSelector.value;
    data.tags = (data.tags || []).map( el => el._id);
    data.deletedTags = (data.deletedTags || []).map(el => el._id);

    if (this.company._id) {
      this.edit(data);
    } else {
      this.create(data);
    }
  }

  async edit(data) {
    const res = await this.companyService.update(data);
    if (res) {
      this.router.navigate(['/admin/companies']);
    } else {

    }
  }

  async create(data) {
    if (!data.fiscalCode) {
      data.fiscalCode = `${new Date().getTime()}`;
    }
    try {
      const res = await this.companyService.create(data);
      if (res) {
        if (this.route.snapshot.queryParams.campaignId) {
          this.router.navigate(['/admin/campaigns']);
        } else {
          this.router.navigate(['/admin/companies']);
        }
      } else {
        this.toastService.show('This company fiscal code already exist');
      }
    } catch (error) {

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

  searchTagsCb = async (keyword) => {
		try {
			const payload = {
				filterModel: {
					type: {
						filterType: 'text',
						filter: 'campaign.tag'
					},
          ignore: {
            filterType: 'ne',
            value: true
          },
          confirmed: {
            filterType: 'eq',
            value: true
          },
					name: {
						or: true,
						filter: [[{
							key: 'synonyms.value',
							filterType: 'text',
							filter: keyword
						},{
							key: 'synonyms.country',
							filterType: 'text',
							filter: 'italy'
						}], [{
							key: 'names.value',
							filterType: 'text',
							filter: keyword
						},{
							key: 'names.country',
							filterType: 'text',
							filter: 'italy'
						}]]
					}
				},
				startRow: 0,
				endRow: 0,
				pageSize: 100,
				totalCount: 0,
				result: []
			};
			const res = await this.aliasService.get(payload);
			this.selectableTags = res.items.map ( item => ({
					label: item.names[0].value,
					value: item._id,
          names: item.names
				}));
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		} catch (error) {
			console.log(error);
		}
  };
  onAddTag() {
		if (this.tagSelector.value && this.tagSelector.value.trim() != '')
		{

			if (!this.company.tags.find( el => el._id == this.tagSelector.value)) {
				this.company.tags.push({
          _id: this.tagSelector.value,
          names: this.tagSelector.selectedOption.names
        });
			}
			setTimeout(() => {
				this.tagSelector.selectedOption = null;
				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.detectChanges();
				}
			}, 0);
		}
	}
  onDeleteTag(tag, index, permanently = false) {
		if (permanently) {
			this.company.deletedTags.splice(index, 1);
		} else {
			this.company.deletedTags = unionWith(this.company.deletedTags, [tag], ( a, b) => a._id == b._id);
			this.company.tags.splice(index, 1);
		}
	}
	onRestoreTag(tag, index) {
		this.company.tags = unionWith(this.company.tags, [tag], ( a, b) => a._id == b._id);
		this.company.deletedTags.splice(index, 1);
  }
  onAddSocial() {
		if (this.currentSocial && this.currentSocial.trim() != '')
		{
			if (this.currentSocialIndex == -1) {
				this.company.socials.push(this.currentSocial);
				this.currentSocial = '';
				this.currentSocialIndex = -1;
			} else if (this.currentSocialIndex >= 0 && this.company.socials.length >= this.currentSocialIndex + 1){
				this.company.socials[this.currentSocialIndex] = this.currentSocial;
				this.currentSocialIndex = -1;
				this.currentSocial = '';
			}

		}
	}
	onUpdateSocial() {
		if (this.currentSocial && this.currentSocial.trim() != '')
		{
			if (this.currentSocialIndex >= 0 && this.company.socials.length >= this.currentSocialIndex + 1){
				this.company.socials[this.currentSocialIndex] = this.currentSocial;
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
		this.company.socials.splice(index, 1);
  }
  onInitEditor(evt) {
		this.isLoadedEditor = true;
		this.cdr.detectChanges();
  }
  onSwap(tag, index, isNext = true) {
		const temp = tag;
		if (isNext) {
			if (index < this.company.tags.length - 1) {
				this.company.tags[index] = this.company.tags[index + 1];
				this.company.tags[index + 1] = temp;
			}
		} else {
			if (index > 0) {
				this.company.tags[index] = this.company.tags[index - 1];
				this.company.tags[index - 1] = temp;
			}
		}
	}
}
