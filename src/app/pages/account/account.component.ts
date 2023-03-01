import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService, UserModel } from 'src/app/modules/auth';
import { UserService } from '../common/user.service';
import {date2string} from '../common/common';

import { KTUtil } from '../../_metronic/kt';
import { Meta } from '@angular/platform-browser';
import { LayoutInitService } from 'src/app/_metronic/layout/core/layout-init.service';

@Component({
  selector: 'app-account',
  styleUrls: ['./account.component.scss'],
  templateUrl: './account.component.html',
})
export class AccountComponent implements OnInit, OnDestroy {

  locale = 'it-IT';
  user$: Observable<any>;
  loadingSubject = new BehaviorSubject<boolean>(false);
  loading$: Observable<boolean>;

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
      tooltip: 'Aggiungi le campagne al tuo portafoglio'
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


  constructor(public auth: AuthService, private userService: UserService,
    private layoutInitService: LayoutInitService,
    private meta: Meta) {
    this.user$ = this.auth.currentUserSubject.asObservable();
    this.loading$ = this.loadingSubject.asObservable();
  }

  ngOnInit(): void {
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow'});
    this.layoutInitService.toogleToolbar(false);
    this.layoutInitService.toogleAside(false);
  }

  ngOnDestroy(): void {
    this.meta.removeTag('name=\'robots\'');
    KTUtil.ElementStyleUtil.set(document.getElementById('kt_content'), 'background', 'inherit');
  }

  date2string(param) {
    return date2string(param,this.locale, 'day');
  }

  logout() {
		this.auth.logout();
  }
  async picInputChanged(event){
		if (event.target.files && event.target.files[0]){
			this.loadingSubject.next(true);
			const formData = new FormData();
			formData.append('pic', event.target.files[0], 'avatar.jpg');
			try {
        const res = await this.userService.uploadPicture(formData);
        if (res) {
          this.auth.getUserByToken().subscribe();
        }
			} catch (error) {
			}
			this.loadingSubject.next(false);
		}
	}
}
