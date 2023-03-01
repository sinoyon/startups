import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { AuthService } from 'src/app/modules/auth';
import { UserService } from '../common/user.service';
import { cloneDeep } from 'lodash';

@Component({
  selector: 'app-unsubscribe',
  templateUrl: './unsubscribe.component.html',
  styleUrls: ['./unsubscribe.component.scss']
})
export class UnsubscribeComponent implements OnInit, OnDestroy {

  private unsubscribe: Subscription[] = [];

  user;
  notification;
  notificationApp;

  type: any;

  constructor(
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private activeRouter: ActivatedRoute,
    private router: Router
  ) {
    
    const sb = this.activeRouter.queryParams.subscribe((res: any) => {
      this.type = res.type || null;
      const _id = res.uid || null;
      if (_id) {
        this.unsubscribe.push(this.auth.getById(_id).subscribe(user => {
          this.user = user;
          if (this.user) {
            if (this.user.notification) {
              this.notification = cloneDeep(this.user.notification);
              this.setFalse();
            }
            if (this.user.notificationApp) {
              this.notificationApp = cloneDeep(this.user.notificationApp);
            }
          } else {
            this.router.navigateByUrl('/crowdfunding');
          }
        }));
      }
    });
  }

  ngOnInit(): void {
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }

  setFalse(isMobile = false) {
    const v = isMobile ? this.notificationApp : this.notification;
    Object.keys(v).forEach(mainKey => {
      Object.keys(this.notification[mainKey]).forEach(key => {
        this.notification[mainKey][key] = false;
      });
    });
    this.save();
  }

  async save() {    
    try {
      await this.userService.update({
        _id: this.user._id,
        newsletter: false,
        notification: this.notification,
        notificationApp: this.notificationApp
      });

    } catch (error) {
    }

    this.cdr.detectChanges();
  }

}
