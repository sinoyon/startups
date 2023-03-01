import { AliasService } from './../../common/alias.service';
import { MainModalComponent } from './../../../_metronic/partials/layout/modals/main-modal/main-modal.component';
import { AuthDialog } from './../../../modules/auth/auth.dialog';
import { InvestAmountDialog } from './../../dialogs/invest-amount/invest-amount.dialog';
import { KTUtil } from 'src/app/_metronic/kt';
import { campaign2htmlData, tag2category } from 'src/app/pages/common/common';
import { cloneDeep, debounce } from 'lodash';
import { catchError, switchMap } from 'rxjs/operators';
import { Title } from '@angular/platform-browser';
import { UserService } from './../../common/user.service';
import { TransactionService } from './../../common/transaction.service';
import { TranslateService } from '@ngx-translate/core';
import { SplashScreenService } from './../../../_metronic/partials/layout/splash-screen/splash-screen.service';
import { AdvertisementService } from 'src/app/pages/common/advertisement.service';
import { WalletService } from './../../common/wallet.service';
import { AuthService } from './../../../modules/auth/_services/auth.service';
import { CommonService } from './../../common/common.service';
import { CampaignService } from './../../common/campaign.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from './../../common/toast.service';
import { SourceService } from 'src/app/pages/common/source.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Component, OnInit, ViewChild, ChangeDetectorRef, OnDestroy, ViewRef } from '@angular/core';
import { Observable, Subscription, of } from 'rxjs';
import * as moment from 'moment';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss']
})
export class CategoryComponent implements OnInit, OnDestroy {

  categoryId: any;
  category: any;
  campaigns: any[] = [];
  totalCampaigns;

  previous: any;
  loadingSubject = new BehaviorSubject<boolean>(false);
  loading$: Observable<boolean>;

  loadMore = false;

  expanded = true;
  expandedAdv = false;
  user;

  wallets = [];

  startRow = 0;
  endRow = 0;

  categories: any[] = [];
  favoriteCategories = [];

  @ViewChild('video', { static: true }) video;

  private unsubscribe: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private aliasService: AliasService,
    private toastService: ToastService,
    private modal: NgbModal,
    private cdr: ChangeDetectorRef,
    private campaignService: CampaignService,
    public common: CommonService,
    private auth: AuthService,
    private walletService: WalletService,
    private advertisementService: AdvertisementService,
    private splashScreenService: SplashScreenService,
    private translate: TranslateService,
    private transactionService: TransactionService,
    private userService: UserService,
    private titleService: Title,
  ) {
    this.loadingSubject = this.splashScreenService.loadingSubject;
    this.loading$ = this.loadingSubject.asObservable();

    this.unsubscribe.push(this.auth.currentUserSubject.subscribe(user => {
      this.user = user;
      if (this.user) {
        this.aliasService.getFavoriteCategories(this.user._id).then(res => {
          this.favoriteCategories = res.map(el => el._id);
        });
      }
    }));
   }

  ngOnInit(): void {
    this.loadCategory();
  }

  ngOnDestroy(): void {
    this.unsubscribe.forEach(el => el.unsubscribe());
  }

  loadCategory() {
    const sb = this.route.paramMap.pipe(
      switchMap(async params => {
        const name = params.get('name');
        if (name) {
          try {
            const source = await this.aliasService.getAliasByName(name);
            this.categoryId = source?._id;
            if (!source) { throw {}; }
            return source;
          } catch (error) {
            console.log(error);
          }
          return undefined;
        } else {
          return {
            configs: [],
            socials: [],
            type: 'root'
          };
        }
      }),
      catchError((errorMessage) => of(undefined)),
    ).subscribe((res: any) => {
      if (!res) {
        this.router.navigate(['/crowdfunding'], { relativeTo: this.route });
      }

      this.category = res;
      this.category.label = tag2category(res, this.translate.currentLang);
      this.category.description = (res.descriptions.find(el => el.language == this.translate.currentLang) || {}).value;
      if (this.category.articleDate) {
        this.category.articleDate = moment(new Date(this.category.articleDate)).format('DD/MM/Y');
      }
      console.info('category == ', this.category);
     
      // this.setMetaData();

      this.loadCampaigns();

      this.unsubscribe.push(this.common.categoriesSubject.subscribe(cates => {
        this.categories = cates.filter(el => el._id != this.categoryId && el.involvedCampaigns > 0);
      }));

      this.previous = cloneDeep(res);

      if (!(this.cdr as ViewRef).destroyed) {
        this.cdr.detectChanges();
      }

    });
    this.unsubscribe.push(sb);
  }


  async loadCampaigns(start = 0, end = 0) {
    var country = 'italy';
    if (this.translate.currentLang == 'it') {
      country = 'italy';
    } else if (this.translate.currentLang == 'fr') {
      country = 'france';
    } else if (this.translate.currentLang == 'es') {
      country = 'spain';
    }
    var filterModels = {
      tags: {
        or: true,
        filter: [
          [
            { key: 'company.tags', filterType: 'set', values: [this.category._id] }
          ],
          [
            { key: 'company', filterType: 'eq', value: null },
            { key: 'tags', filterType: 'set', values: [this.category._id], isObject: true }
          ]
        ]
      },
      country: {
        filterType: 'set',
        values: [country]
      },
      status: {
        filterType: 'set',
        values: ['1_ongoing', '2_comingsoon'] // ['1_ongoing', '2_comingsoon', '3_funded', '4_closed', '5_extra', '6_refunded']
      }
    }
    if (this.translate.currentLang == 'en') {
      delete filterModels.country;
    }
    const res1 = await this.campaignService.get({
      filterModel: filterModels,
      endRow: end,
      pageSize: 9,
      sortModel: [{ colId: 'raised', sort: 'desc' }],
      startRow: start,
    }, {
      self: 'name names descriptions description systemTitle logo logoSM backgroundSM background leftDays endDate startDate videoUrl raised status investorCount minimumGoal maximumGoal follows link typology roi roiAnnual holdingTime city address lat lng fullCity fullAddress minimumInvestment preMoneyEvaluation country',
      company: 'name tags campaigns article foundedDate physicalLocation fiscalCode type originalTags',
      source: 'link name description logo'
    });
    console.log('comapign == ', res1);
    res1.items.forEach((item, index) => {
      item.index = this.campaigns.length;
      this.campaigns.push(campaign2htmlData(item, this.wallets, this.user));
    });

    this.startRow += res1.items.length;
    this.endRow += res1.items.length;

    this.totalCampaigns = res1.totalCount;
    if (res1.totalCount > this.campaigns.length) {
      this.loadMore = true;
    } else {
      this.loadMore = false;
    }

    this.cdr.detectChanges();

  }


  async onClickDetailCampaign(param) {

    window.open(window.origin + '/crowdfunding/' + (param.systemTitle || ''));

    try {
      if (param.advId) {
        await this.advertisementService.action(param.advId, 'detail');
      }
    } catch (error) {
      console.log(error);
    }

  }
  async onClickExternalCampaign(param) {
    try {
      const url = new URL(param.link);
      url.search += (url.search && url.search.length ? '&' : '') + 'utm_source=startupswallet&utm_medium=web&utm_content=home';
      window.open(url.origin + url.pathname + url.hash + url.search);
      try {
        if (param.advId) {
          await this.advertisementService.action(param.advId, 'external');
        }
        await this.campaignService.action(param._id, 'external');
      } catch (error) {
        console.log(error);
      }
    } catch (error) {
    }
  }

  onClickVideo(param) {
    KTUtil.ElementStyleUtil.set(document.getElementById('video_view'), 'display', 'block');
    this.cdr.detectChanges();
    this.video.init({ parent: this, campaign: param });
    history.pushState({ videoModal: true }, null, null);
    document.body.style.position = 'fixed';
    document.body.style.top = `-${window.scrollY}px`;
  }

  onCloseVideo = debounce(async () => {
    this.closeVideoView();
    try {
      if (history.state.videoModal) {
        history.back();
      }
    } catch (error) {

    }
  }, 100);

  closeVideoView() {
    KTUtil.ElementStyleUtil.set(document.getElementById('video_view'), 'display', 'none');
    const scrollY = document.body.style.top;
    document.body.style.position = '';
    document.body.style.top = '';
    window.scrollTo(0, parseInt(scrollY || '0') * -1);
  }

  async onClickWalletCampaign(param) {

    if (!this.checkUser()) { return; }

    try {

      if (param.wallet) {
        await this.walletService.deleteByIds([param.wallet]);
      } else {
        await this.onShowInvestAmountDialog(param._id);

        this.toastService.show(this.translate.instant('OTHERS.compaign_portfolio'),
          { classname: '', delay: 6000, desc: this.translate.instant('OTHERS.go_personal_data'), action: '/account/overview/wallets' });
      }

      await this.loadWallets();
      const wallet = this.wallets.find(el => el.campaignId == param._id);
      param.wallet = wallet ? wallet._id : null;

    } catch (error) {
      console.log(error);
    }
    this.cdr.detectChanges();
  }
  onShowInvestAmountDialog(campaignId) {
    return new Promise((resolve, reject) => {
      const modalRef = this.modal.open(InvestAmountDialog, { animation: false, size: 'md' });
      const subscr = modalRef.closed.subscribe(async res => {
        try {
          if (!campaignId) { throw {}; }
          if (!res) { throw {}; }

          await this.walletService.create({
            user: this.user._id,
            campaign: campaignId,
            amountInvested: res,
            investedDate: new Date()
          });

        } catch (error) {
        }
        setTimeout(() => subscr.unsubscribe(), 10);
        resolve({});
      });

      const subscr1 = modalRef.dismissed.subscribe(res => {
        reject({});
        setTimeout(() => subscr1.unsubscribe(), 10);
      });
    });

  }

  async onClickFollowCampaign(param) {

    if (!this.checkUser()) { return; }

    this.loadingSubject.next(true);
    if (param) {
      const res = await this.campaignService.follow(param._id, this.user._id, !param.follows || !param.follows.includes(this.user._id));
      if (!res) { throw {}; }
      const campaign = this.campaigns.find(el => el._id == param._id);
      if (campaign) {
        campaign.follows = res.follows;
        campaign.followed = res.follows.includes(this.user._id);
      }
    } else {
      try {
        const res = await this.campaignService.follow(param._id, this.user._id, !param.follows || !param.follows.includes(this.user._id));
        if (!res) { throw {}; }
        param.follows = res.follows;
        param.followed = res.follows.includes(this.user._id);
      } catch (error) {
        console.log(error);
      }
    }
    this.cdr.detectChanges();
    this.loadingSubject.next(false);
  }

  onExpandCard(param) {
    this.expanded = param;
    this.expandedAdv = param;
  }

  async loadWallets() {

    try {
      if (!this.user) { throw {}; }

      this.wallets = await this.walletService.getWalletCampaignsByUserId({
        userId: this.user._id
      });


    } catch (error) {
      this.wallets = [];
    }

  }

  checkUser(withEmail = true) {
    if (!this.user || this.user.isGuest) {
      this.modal.open(AuthDialog, { animation: false });
      return false;
    } else if (withEmail && !this.user.emailConfirmed) {
      const modalRef = this.modal.open(MainModalComponent, { animation: false });
      modalRef.componentInstance.modalData = {
        text: 'GENERAL.CONFIRM_YOUR_EMAIL',
        yes: 'GENERAL.SEND_EMAIL',
        cancel: 'GENERAL.CANCEL'
      };

      const subscr = modalRef.closed.subscribe(async e => {
        if (e) {
          const res = await this.userService.sendVerifyEmail([this.user._id]);
          if (res) {
            this.toastService.show(this.translate.instant('NOTIFICATION.GO_EMAIL_BOX'));
          }
        }
        setTimeout(() => subscr.unsubscribe(), 100);
      });
      return false;
    }

    return true;
  }

  async onClickLoadMore() {
    if (!this.loadMore) {
      return;
    }
    // this.isLoadMore = true;
    await this.loadCampaigns(this.startRow, this.endRow);

    var country = 'italy';
    if (this.translate.currentLang == 'it') {
      country = 'italy';
    } else if (this.translate.currentLang == 'fr') {
      country = 'france';
    } else if (this.translate.currentLang == 'es') {
      country = 'spain';
    } else if (this.translate.currentLang == 'en') {
      country = null;
    }

    try {
      await
        this.transactionService.create({
          type: 'home.category',
          value: -1,
          name: null,
          country: country
        });
    } catch (error) {
    }
  }

  showCategory(category) {
    window.open(window.origin + '/crowdfunding/category/' + (category.name || ''));
  }

  async onClickFollowCategory(categoryId) {

		if (!this.checkUser()) {return;}

		this.loadingSubject.next(true);
		if (categoryId) {
			if (!this.favoriteCategories.includes(categoryId)) {
				if (this.favoriteCategories.length >= 3) {
					this.toastService.show(this.translate.instant('GENERAL.CATEGORY_SELECTABLE_ERROR'),
					{ classname: '', delay: 6000, desc: this.translate.instant('GENERAL.CATEGORIES'), action: 'account/overview/categories' });
				} else {
					try {
						const res = await this.aliasService.follow(this.user._id, true, categoryId);
						if (res) {
							this.favoriteCategories.push(categoryId);
						}
					} catch (error) {
					}
					this.cdr.detectChanges();
				}
			} else {
				try {
					const res = await this.aliasService.follow(this.user._id, false, categoryId);
					if (res) {
						this.favoriteCategories = this.favoriteCategories.filter( c => c != categoryId);
					}
				} catch (error) {
				}
				this.cdr.detectChanges();
			}
		}
		this.loadingSubject.next(false);
	}

}
