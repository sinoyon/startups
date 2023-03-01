import { AliasService } from './../../../../pages/common/alias.service';
import { SourceService } from 'src/app/pages/common/source.service';
import { cloneDeep } from 'lodash';
import { TranslateService } from '@ngx-translate/core';
import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/modules/auth';
import { CommonService } from 'src/app/pages/common/common.service';
import { ToastService } from 'src/app/pages/common/toast.service';
import { UserService } from 'src/app/pages/common/user.service';
import { LayoutService } from '../../core/layout.service';
import { TranslationService } from 'src/app/modules/i18n';
import { tag2category } from 'src/app/pages/common/common';

const LOCALIZATION_LOCAL_STORAGE_KEY = 'language';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {

  user$: Observable<any>;
  currentYear: string;
  footerContainerCssClasses = '';
  currentDateStr: string = new Date().getFullYear().toString();
  lang:any;

  @ViewChild('carouselSlider') carouselSlider;

  isAdmin = false;

  categories: any[] = [];
  carousels: any[] = [];
  canReget = false;

  constructor(
    private layout: LayoutService,
    private auth: AuthService,
    private userService: UserService,
    private router: Router,
    private toastService: ToastService,
    public common: CommonService,
    private translate: TranslateService,
    private translationService: TranslationService,
    private cdr: ChangeDetectorRef,
    private sourceService: SourceService,
    private aliasService: AliasService,
    ) {
      this.user$ = this.auth.currentUserSubject.asObservable();
      const currentDate = new Date();
      this.currentYear = currentDate.getFullYear().toString();

      this.translationService.changeLangSubject.subscribe(lang => {
				if (lang) {
          this.translationService.setLanguage(lang);
          this.cdr.detectChanges();
          
          if (this.canReget) {
            sessionStorage.removeItem('carousels');
            sessionStorage.removeItem('categories');
            this.lang = lang;
            setTimeout(() => {
              if (!this.isAdmin) {
                this.filterData();
                this.getCategories();
              }
            }, 550);
          }
				}
			});

      this.router.events.subscribe(events => {
        if (events instanceof NavigationEnd) {
          this.isAdmin = this.router.url.includes('admin') || this.router.url.includes('reports');
          if (!this.isAdmin) {
            if (!this.carousels.length) {
              this.filterData();
            }

            if (!this.categories.length) {
              this.getCategories();
            }
          }          
        }
      });
    }

  ngOnInit(): void {
    this.lang = this.translate.currentLang;
    this.footerContainerCssClasses = this.layout.getStringCSSClasses('footerContainer');
  }

  async onClickSubscribe(value) {
    if (this.auth.currentUserValue) {
      this.userService.update({ _id: this.auth.currentUserValue._id, newsletter: true}).then(res => {
        if (res) {
          this.toastService.show(this.translate.instant('OTHERS.subscribed_newsletter'));
          this.auth.currentUserSubject.next(res);
        }
      });
      
    } else {
      this.router.navigate(['/auth/registration'], { queryParams: {email: value, from: 'newsletter'}});
    }
  }

  async filterData() {
    if (sessionStorage.getItem('carousels')) {
      this.carousels = JSON.parse(sessionStorage.getItem('carousels'));
      setTimeout(() => {
        if (this.carouselSlider) {
          this.carouselSlider.slidesStore = this.carousels;
        }
        this.cdr.detectChanges();
      }, 1250);
    } else {
      var filter = {
        startRow: 0,
        sortModel: [
          {colId: 'name', sort: 'asc'}
        ],
        endRow: 550,
        pageSize: 550,
        pivotMode: false,
        filterModel: {
          "configs.involvedCampaignCountries": {
            filterType: 'set',
            values: sessionStorage.getItem('country') == 'europe' ? [] : [sessionStorage.getItem('country') || 'italy']
          },
          disabled: {filterType: 'ne', value: true},
          type: {filterType: 'eq', value: 'root'}
        }
      }
      const payload = cloneDeep(filter);
      this.sourceService.getWithPagination(payload).then(res => {
        this.carousels = (res.items as Array<any>).filter(el => el.logo);
        if (this.carousels.length) {
          sessionStorage.setItem('carousels', JSON.stringify(this.carousels));
        } else {
          sessionStorage.removeItem('carousels');
        }
        if (this.carouselSlider) {
          this.carouselSlider.slidesStore = this.carousels;
        }
        this.cdr.detectChanges();
      });
    }
  }

  async getCategories() {

    if (sessionStorage.getItem('categories')) {
      this.categories = JSON.parse(sessionStorage.getItem('categories'));
      this.common.categories = this.categories;
      this.common.categoriesSubject.next(this.categories);

      setTimeout(() => {
        this.canReget = true;
      }, 3.5 * 1000);

      this.cdr.detectChanges();

    } else {

      var country = 'italy';
      if (this.translate.currentLang == 'it') {
        country = 'italy';
      } else if (this.translate.currentLang == 'fr') {
        country = 'france';
      } else if (this.translate.currentLang == 'es') {
        country = 'spain';
      } else {
        country = null;
      }

      try {

        this.aliasService.get({
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
            }
          },
          sortModel: [
            { colId: 'name', sort: 'asc'}
          ],
          startRow: 0,
          endRow: 0,
          pageSize: 100,
          countries: country ? [country] : []
        }).then(res => {
          this.categories = res.items.map( el => ({
            _id: el._id,
            label: tag2category(el,this.lang),
            pic: el.pic,
            name: (el.names.find( ele => ele.language == this.lang) || el.names.find( ele => ele.language == 'it') || el.names.find( ele => ele.value && ele.value != '')).value,
            involvedCampaigns: el.involvedCampaigns
          })).filter(el => el.label && el.label != '' && el.involvedCampaigns > 0);
  
          this.common.categories = this.categories;
          this.common.categoriesSubject.next(this.categories);
  
          if (this.categories.length) {
            sessionStorage.setItem('categories', JSON.stringify(this.categories));
          } else {
            sessionStorage.removeItem('categories');
          }
  
          setTimeout(() => {
            this.canReget = true;
          }, 3.5 * 1000);
  
          this.cdr.detectChanges();
        }).catch(err => {
          throw {};
        });        

      } catch (error) {
        console.log(error);
      }
    }
  }

  showCategory(category) {
    window.open(window.origin + '/crowdfunding/category/' + (category.name || ''));
  }
}
