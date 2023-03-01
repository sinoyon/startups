import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from 'src/app/modules/auth/_services/auth.service';
import { cloneDeep, each, isEqualWith } from 'lodash';
import { UserService } from 'src/app/pages/common/user.service';
import { SplashScreenService } from 'src/app/_metronic/partials';
import * as objectPath from 'object-path';
import { Router } from '@angular/router';

@Component({
  selector: 'app-account-notifications',
  styleUrls: ['./notifications.component.scss'],
  templateUrl: './notifications.component.html',
})
export class NotificationsComponent implements OnInit {
  loadingSubject;
	loading$: Observable<boolean>;
  private unsubscribe: Subscription[] = [];

  user;
  notification;
  notificationApp;

  categoryCheck(category, isApp) {
    const v = isApp ? this.notificationApp : this.notification;
    let result = true;
    each(category.keys, (key) => {
      result = result && objectPath.get(v, key);
    });
    return result;
  }
  categoryIndeterminate(category, isApp){
    const v = isApp ? this.notificationApp : this.notification;
    let result = false; let isCheckedAll = true;
    each(category.keys, (key) => {
      result = result || objectPath.get(v, key);
      isCheckedAll = isCheckedAll && objectPath.get(v, key);
    });
    return result && !isCheckedAll;
  }

  configs: any[] = [
    {
      label: 'GENERAL.CATEGORY',
      tooltip: 'NOTIFICATION.follow_categories',
      keys: ['category.newEquityCampaign', 'category.newLendingCampaign']
    },
    {
      label: 'NOTIFICATION.new_compaign_quity',
      link: '/account/overview/categories',
      linkLabel: 'OTHERS.FAVORITE_CATEGORY',
      mKey: 'category',
      sKey: 'newEquityCampaign',
      tooltip: '',
      path: '/account/overview/categories',
      label_path: 'Vedi altre categorie'
    },
    {
      label: 'NOTIFICATION.new_compaign_lending',
      link: '/account/overview/categories',
      linkLabel: 'OTHERS.FAVORITE_CATEGORY',
      mKey: 'category',
      sKey: 'newLendingCampaign',
      tooltip: '',
      path: '/account/overview/categories',
      label_path: 'Vedi altre categorie'
    },
    {
      label: 'NOTIFICATION.compaign_alerts',
      keys: ['campaign.maximumGoalAlmostReached', 'campaign.minimumGoalReached', 'campaign.willCloseIn', 'campaign.availableIn']
    },
    {
      label: 'NOTIFICATION.maximum_archieved',
      mKey: 'campaign',
      sKey: 'maximumGoalAlmostReached',
      tooltip: 'NOTIFICATION.maximum_tooltip',
    },
    {
      label: 'NOTIFICATION.minimum_archieved',
      mKey: 'campaign',
      sKey: 'minimumGoalReached',
      tooltip: 'NOTIFICATION.minimum_tooltip',
    },
    {
      label: 'NOTIFICATION.compaign_end',
      mKey: 'campaign',
      sKey: 'willCloseIn',
      tooltip: 'NOTIFICATION.end_tooltip',
    },
    {
      label: 'NOTIFICATION.start_compaign',
      mKey: 'campaign',
      sKey: 'availableIn',
      tooltip: 'NOTIFICATION.start_tooltip',
    },
    {
      label: 'NOTIFICATION.status_change',
      keys: ['campaign.available', 'campaign.closedFunded', 'campaign.closedNotFunded']
    },
    {
      label: 'NOTIFICATION.coming_progress',
      mKey: 'campaign',
      sKey: 'available',
      tooltip: 'NOTIFICATION.coming_progress_tooltip',
    },
    {
      label: 'NOTIFICATION.progress_closed',
      mKey: 'campaign',
      sKey: 'closedFunded',
      tooltip: 'NOTIFICATION.progress_closed_tooltip',
    },
    {
      label: 'NOTIFICATION.progress_notfound',
      mKey: 'campaign',
      sKey: 'closedNotFunded',
      tooltip: 'NOTIFICATION.progress_notfound_tooltip',
    },
    {
      label: 'NOTIFICATION.new_inverview',
      keys: ['interview.newInterview']
    },
    {
      label: 'NOTIFICATION.updateme_new_interview',
      mKey: 'interview',
      sKey: 'newInterview',
      tooltip: 'NOTIFICATION.updateme_new_interview_tooltip',
    }
  ];


  constructor(
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private splashScreenService: SplashScreenService,
    private auth: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {

    this.loadingSubject = this.splashScreenService.loadingSubject;
    this.loading$ = this.loadingSubject.asObservable();


    this.unsubscribe.push(this.auth.currentUserSubject.subscribe( user => {
		  this.user = user;
      if (this.user) {
        if (this.user.notification) {
          this.notification = cloneDeep(this.user.notification);
        }
        if (this.user.notificationApp) {
          this.notificationApp = cloneDeep(this.user.notificationApp);
        }
      }
	  }));
  }

  ngOnInit(): void {

  }

  discard() {
    if (this.user.notification) {
      this.notification = cloneDeep(this.user.notification);
    }
    if (this.user.notificationApp) {
      this.notificationApp = cloneDeep(this.user.notificationApp);
    }
  }
  onClickCategory(category = null, isApp = false) {
    const isChecked = this.categoryCheck(category, isApp);
    const v = isApp ? this.notificationApp : this.notification;
    each(category.keys, (key) => {
      objectPath.set(v, key, !isChecked);
    });
  }
  async save() {
    this.loadingSubject.next(true);
    try {
      await this.userService.update({
				_id: this.user._id,
        notification: this.notification,
        notificationApp: this.notificationApp
			});
			this.auth.getUserByToken().subscribe();

    } catch (error) {

    }

    this.loadingSubject.next(false);
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }

  compareWithOld() {
		function customizer(objValue, othValue){
			if (objValue && othValue && typeof objValue == typeof othValue && typeof objValue == 'object') {
			}
			return undefined;
		}
		return isEqualWith( this.notification, this.user.notification, customizer) && isEqualWith( this.notificationApp, this.user.notificationApp, customizer);
	}
}
