import { TranslateService } from '@ngx-translate/core';
import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/modules/auth';
import { AuthDialog } from 'src/app/modules/auth/auth.dialog';
import { MessageService } from 'src/app/pages/common/message.service';
import { MainModalComponent } from 'src/app/_metronic/partials/layout/modals/main-modal/main-modal.component';
import { LayoutService } from '../../core/layout.service';
import { Router } from '@angular/router';
import { CommonService } from 'src/app/pages/common/common.service';
import { Platform } from '@angular/cdk/platform';
import { TranslationService } from 'src/app/modules/i18n';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
})
export class TopbarComponent implements OnInit {

  user$: Observable<any>;

  toolbarButtonMarginClass = 'ms-1 ms-lg-3';
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px d-flex justify-content-center align-items-center cursor-pointer';
  toolbarUserAvatarHeightClass = 'symbol-30px symbol-md-40px';
  toolbarButtonIconSizeClass = 'svg-icon-1';
  headerLeft = 'menu';

  lang:any;

  get unread(): number {
		return this.messageService.notifications$.value.filter( el => el.subtype == 'chat' || (el.subtype == 'notification' && !el.read)).length;
	}

  constructor(private layout: LayoutService,
    private messageService: MessageService,
    private auth: AuthService,
    private modal: NgbModal,
    private router: Router,
    public common: CommonService,
    public platform: Platform,
    private translate: TranslateService,
    private translationService: TranslationService
    ) {

    this.user$ = this.auth.currentUserSubject.asObservable();

    this.translationService.changeLangSubject.subscribe(lang => {
      if (lang) {
        this.lang = lang;
      }
    });

  }

  checkUser() {
    this.modal.open(AuthDialog, { animation: false});
	}

  ngOnInit(): void {
    this.headerLeft = this.layout.getProp('header.left') as string;
    this.lang = this.translate.currentLang;
  }
  login() {
    if (this.auth.currentUserValue && this.auth.currentUserValue.isGuest) {
      this.auth.logout(false);
    }
    this.router.navigate(['/auth/login']);
  }
}
