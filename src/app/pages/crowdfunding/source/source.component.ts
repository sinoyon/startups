import { TransactionService } from 'src/app/pages/common/transaction.service';
import { UserService } from 'src/app/pages/common/user.service';
import { AuthDialog } from 'src/app/modules/auth/auth.dialog';
import { InvestAmountDialog } from 'src/app/pages/dialogs/invest-amount/invest-amount.dialog';
import { TranslateService } from '@ngx-translate/core';
import { AdvertisementService } from 'src/app/pages/common/advertisement.service';
import { WalletService } from 'src/app/pages/common/wallet.service';
import { AuthService } from 'src/app/modules/auth/_services/auth.service';
import { CommonService } from 'src/app/pages/common/common.service';
import { CampaignService } from 'src/app/pages/common/campaign.service';
import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef, ViewRef, ViewChild, NgModule } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, BehaviorSubject, Subscription, config, of } from 'rxjs';
import { cloneDeep, each, isEqualWith, union } from 'lodash';
import { catchError, switchMap } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SourceService } from 'src/app/pages/common/source.service';
import { ToastService } from 'src/app/pages/common/toast.service';
import { MainModalComponent } from 'src/app/_metronic/partials/layout/modals/main-modal/main-modal.component';
import { SplashScreenService } from 'src/app/_metronic/partials';
import { KTUtil } from '../../../_metronic/kt/index';
import { debounce } from 'lodash';
import { campaign2htmlData, tag2category } from '../../common/common';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-source',
  templateUrl: './source.component.html',
  styleUrls: ['./source.component.scss']
})
export class SourceComponent implements OnInit, OnDestroy {

  sourceId: any;
  source: any;
  campaigns: any[] = [];
  totalCampaigns;

  previous: any;
  loadingSubject = new BehaviorSubject<boolean>(true);
  loading$: Observable<boolean>;

  loadMore = false;

  expanded = true;
  expandedAdv = false;
  user;

  wallets = [];

  startRow = 0;
  endRow = 0;

  @ViewChild('video', { static: true }) video;

  private unsubscribe: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sourceService: SourceService,
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
    this.loading$ = this.loadingSubject.asObservable();

    this.unsubscribe.push(this.auth.currentUserSubject.subscribe(user => {
      this.user = user;
    }));
  }

  ngOnInit(): void {
    this.loadingSubject = this.splashScreenService.loadingSubject;
    this.loadSource();
  }

  ngOnDestroy(): void {
    this.unsubscribe.forEach(el => el.unsubscribe());
  }

  loadSource() {
    const sb = this.route.paramMap.pipe(
      switchMap(async params => {
        const name = params.get('name');
        if (name) {
          try {
            const source = await this.sourceService.getByName(name);
            this.sourceId = source?._id;
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

      this.source = res;
      console.log('source == ', this.source);

      let socials = [];
      (this.source.socials as Array<any>).forEach(el => {
        if ((el as string).includes('linkedin')) {
          let soc = {
            link: el,
            icon: 'socicon-linkedin'
          }
          socials.push(soc);
        } else if ((el as string).includes('facebook')) {
          let soc = {
            link: el,
            icon: 'socicon-facebook'
          }
          socials.push(soc);
        } else if ((el as string).includes('youtube')) {
          let soc = {
            link: el,
            icon: 'socicon-youtube'
          }
          socials.push(soc);
        } else if ((el as string).includes('twitter')) {
          let soc = {
            link: el,
            icon: 'socicon-twitter'
          }
          socials.push(soc);
        } else if ((el as string).includes('instagram')) {
          let soc = {
            link: el,
            icon: 'socicon-instagram'
          }
          socials.push(soc);
        }
      });
      this.source.socials = socials;

      this.setMetaData();

      this.loadCmapaigns();

      this.previous = cloneDeep(res);

      if (!(this.cdr as ViewRef).destroyed) {
        this.cdr.detectChanges();
      }

    });
    this.unsubscribe.push(sb);
  }

  setMetaData() {
    let typologies = [];
    (this.source.involvedCampaignTypologies as Array<any>).forEach(el => {
      var ttx = el + ' crowdfunding';
      typologies.push(ttx);
    });
    let tylology = typologies.toString().replace(',', ', ');


    let title = `${this.source.name}, il portale di investimenti ${tylology}`;
    var ogTitle = `${this.source.name}, il portale di investimenti nell'economia reale tramite ${tylology}`;
    var description = `${this.source.name}, il portale di investimenti nell'economia reale tramite ${tylology}, diversifica il tuo portafoglio tramite piccoli investimenti nell'economia reale`;
    var ogDescription = `${this.source.name}, il portale di investimenti nell'economia reale tramite ${tylology}, diversifica il tuo portafoglio tramite piccoli investimenti nell'economia reale in startup e PMI`;

    if (this.translate.currentLang == 'fr') {

      title = `${this.source.name}, le portail d'investissement ${tylology}`;
      ogTitle = `${this.source.name}, le portail d'investissement dans l'économie réelle par ${tylology}`;
      description = `${this.source.name}, le portail d'investissement dans l'économie réelle par ${tylology}, diversifiez votre portefeuille grâce à de petits investissements dans l'économie réelle`;
      ogDescription = `${this.source.name}, le portail d'investissement dans l'économie réelle par ${tylology}, diversifiez votre portefeuille grâce à de petits investissements dans l'économie réelle, dans des start-ups et des PME`;

    } else if (this.translate.currentLang == 'es') {

      title = `${this.source.name}, el portal de inversiones ${tylology}`;
      ogTitle = `${this.source.name}, el portal de inversiones de la economía real a través de ${tylology}`;
      description = `${this.source.name}, el portal de inversiones de la economía real a través de ${tylology}, diversifique su cartera mediante pequeñas inversiones en la economía real`;
      ogDescription = `${this.source.name}, el portal de inversiones de la economía real a través de ${tylology}, diversificar su cartera mediante pequeñas inversiones en la economía real en empresas de nueva creación y PYMES`;

    } else if (this.translate.currentLang == 'en') {

      title = `${this.source.name}, the investment portal ${tylology}`;
      ogTitle = `${this.source.name}, The portal of investment in the real economy through ${tylology}`;
      description = `${this.source.name}, The portal of investment in the real economy through ${tylology}, diversify your portfolio through small investments in the real economy`;
      ogDescription = `${this.source.name}, The portal of investment in the real economy through ${tylology}, diversify your portfolio through small investments in the real economy in startups and SMEs`;
    }

		this.titleService.setTitle(title);

		this.campaignService.generateTags({
			title,
			description: description,
			image: this.source.background,
			ogTitle,
			ogDescription
		});
  }

  async loadCmapaigns(start = 0, end = 0) {
    const res1 = await this.campaignService.get({
      filterModel: {
        'source._id': {
          filterType: 'eq',
          value: this.sourceId
        },
        status: {
          filterType: 'set',
          values: ['1_ongoing', '2_comingsoon'] // ['1_ongoing', '2_comingsoon', '3_funded', '4_closed', '5_extra', '6_refunded']
        }
      },
      endRow: end,
      pageSize: 9,
      sortModel: [{ colId: 'raised', sort: 'desc' }],
      startRow: start,
    }, {
      // self: 'name description systemTitle logo logoSM status',
      // company: 'name',
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
    await this.loadCmapaigns(this.startRow, this.endRow);

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
          type: 'home.source',
          value: -1,
          name: null,
          country: country
        });
    } catch (error) {
    }

  }

}
