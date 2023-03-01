import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { UserService } from 'src/app/pages/common/user.service';
import { AuthService, UserType } from '../../../../../../modules/auth/_services/auth.service';
import { TranslationService } from '../../../../../../modules/i18n';

@Component({
  selector: 'app-user-inner',
  templateUrl: './user-inner.component.html',
})
export class UserInnerComponent implements OnInit, OnDestroy {
  @HostBinding('class')
  class = `menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg menu-state-primary fw-bold py-4 fs-6 w-275px`;
  @HostBinding('attr.data-kt-menu') dataKtMenu = 'true';
  @HostBinding('attr.id') id = 'user_inner_dropdown';

  language: LanguageFlag;
  user$: Observable<UserType>;
  langs = languages;
  menuList: any[] = [
    {
      label: 'USER_MENU.FOLLOW_CATEGORY',
      path: '/account/overview/categories',
      svg: './assets/media/svg/category.svg'
    },
    {
      label: 'USER_MENU.FOLLOW_PROJECT',
      path: '/account/overview/campaigns',
      svg: './assets/media/svg/project.svg'
    },
    {
      label: 'USER_MENU.WALLET',
      path: '/account/overview/wallets',
      svg: './assets/media/svg/wallet.svg',
    },
    {
      label: 'USER_MENU.NOTIFICATIONS',
      path: '/account/settings/notification',
      svg: './assets/media/svg/bell.svg'
    },
    {
      label: 'USER_MENU.PERSONAL_DATA',
      path: '/account/settings/personal',
      svg: './assets/media/svg/user.svg'
    }
  ];

  private unsubscribe: Subscription[] = [];

  constructor(
    private auth: AuthService,
    private userService: UserService,
    private translationService: TranslationService
  ) {}

  ngOnInit(): void {
    this.user$ = this.auth.currentUserSubject.asObservable();
    this.unsubscribe.push(this.auth.currentUserSubject.subscribe ( user => {
      let lang = this.translationService.getSelectedLanguage();
      if (!lang) {
        this.translationService.setLanguage('it');
        lang = 'it';
      }
      this.setLanguage(lang);
		}));

    this.translationService.changeLangSubject.subscribe(lang => {
      if (lang) {
        this.translationService.setLanguage(lang);
        this.setLanguage(lang);
      }
    });
  }

  logout() {
    this.auth.logout();
    window.location.reload();
  }

  selectLanguage(lang: string) {
    // this.translationService.setLanguage(lang);
    // this.setLanguage(lang);
    // window.location.reload();
    this.translationService.changeLangSubject.next(lang);
  }

  setLanguage(lang: string) {
    this.langs.forEach((language: LanguageFlag) => {
      if (language.lang === lang) {
        language.active = true;
        this.language = language;
      } else {
        language.active = false;
      }
    });
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }

  async picInputChanged(event){
		if (event.target.files && event.target.files[0]){
			const formData = new FormData();
			formData.append('pic', event.target.files[0], 'avatar.jpg');
			try {
        const res = await this.userService.uploadPicture(formData);
        if (res) {
          this.auth.getUserByToken().subscribe();
        }
			} catch (error) {
			}
		}
  }
  async confirmEmail() {
		try {
      if (!this.auth.currentUserValue) {throw {};}

      const res = await this.userService.sendVerifyEmail([this.auth.currentUserValue._id]);
      if (res) {
        // this._snackBar.open(this.translate.instant('NOTIFICATION.GO_EMAIL_BOX'), null, {
        //   duration: 3000,
        //   horizontalPosition: 'end',
        //   verticalPosition: 'bottom',
        // });
      }
		} catch (error) {
			console.log(error);
		}
  }
}

interface LanguageFlag {
  lang: string;
  name: string;
  flag: string;
  active?: boolean;
}

const languages = [
  {
    lang: 'en',
    name: 'English',
    flag: './assets/media/flags/united-states.svg',
  },
  {
    lang: 'es',
    name: 'Spanish',
    flag: './assets/media/flags/spain.svg',
  },
  // {
  //   lang: 'de',
  //   name: 'German',
  //   flag: './assets/media/flags/germany.svg',
  // },
  {
    lang: 'fr',
    name: 'French',
    flag: './assets/media/flags/france.svg',
  },
  {
    lang: 'it',
    name: 'Italy',
    flag: './assets/media/flags/italy.svg',
  },
];

