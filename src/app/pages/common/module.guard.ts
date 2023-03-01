import { Injectable } from '@angular/core';
import {
  Router,
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { AuthService } from 'src/app/modules/auth';
import { MainModalComponent } from 'src/app/_metronic/partials/layout/modals/main-modal/main-modal.component';
import { ToastService } from './toast.service';
import { UserService } from './user.service';


@Injectable({
  providedIn: 'root'
})
export class ModuleGuard implements CanActivate {
  constructor(private router: Router, private authService: AuthService,
    private userService: UserService,
    private translate: TranslateService,
    private toastService: ToastService,
    private modal: NgbModal) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean>  {
      const permission = route.data.permission;
      const permissionOr = route.data.permissionOr;
      const admin = route.data.admin;
      const emailConfirmed = route.data.emailConfirmed;

      try {
        if (admin) {
          if (!this.authService.currentUserValue || !this.authService.currentUserValue.isAdmin) {
            throw {};
          }
        }
        if (emailConfirmed) {
          if (!this.authService.currentUserValue || !this.authService.currentUserValue.emailConfirmed) {
            if (this.authService.currentUserValue) {
              const modalRef = this.modal.open(MainModalComponent, { animation: false});
              modalRef.componentInstance.modalData = {
                text: 'GENERAL.CONFIRM_YOUR_EMAIL',
                yes: 'GENERAL.SEND_EMAIL',
                cancel: 'GENERAL.CANCEL'
              };

              const subscr = modalRef.closed.subscribe ( async e => {
                if (e) {
                  const res  = await this.userService.sendVerifyEmail([this.authService.currentUserValue._id]);
                  if (res) {
                    this.toastService.show(this.translate.instant('NOTIFICATION.GO_EMAIL_BOX'));
                  }
                }
                setTimeout(() => subscr.unsubscribe(), 100);
              });
            }
            throw {};
          }
        }
        if (permission && permission.length) {
          if ( !this.authService.currentUserValue) {throw {};}
          if (permissionOr) {
            if (permission.filter( p => {
              let name; let allow = 'readable';
              if (p.split('_').length > 1) {
                name = p.split('_')[0];
                allow = p.split('_')[1];
              } else {
                name = p;
              }
              return this.authService.hasPermission(name, allow).allowed;
            }).length == 0) {throw {};}
          } else {
            if (permission.filter( p => {
              let name; let allow = 'readable';
              if (p.split('_').length > 1) {
                name = p.split('_')[0];
                allow = p.split('_')[1];
              } else {
                name = p;
              }
              return !this.authService.hasPermission(name, allow).allowed;
            }).length) {throw {};}
          }

        }

        return of(true);
      } catch (error) {

      }
      this.router.navigateByUrl('/');
  }
}
