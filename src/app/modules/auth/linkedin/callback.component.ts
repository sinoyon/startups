import { TranslateService } from '@ngx-translate/core';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs';
import { first } from 'rxjs/operators';
import { AuthService, UserModel } from '../../auth';
import { UserService } from '../../../pages/common/user.service';
import { SplashScreenService } from 'src/app/_metronic/partials';
import { ToastService } from 'src/app/pages/common/toast.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-linkedin-callback',
  styleUrls: ['./callback.component.scss'],
  templateUrl: './callback.component.html',
})
export class LinkedinCallbackComponent implements OnInit, OnDestroy {
	state;
	loadingSubject;

	private unsubscribe: Subscription[] = [];
	constructor(
		private route: ActivatedRoute,
		private auth: AuthService,
		private router: Router,
		private toastService: ToastService,
		private splashScreenService: SplashScreenService,
		private translate: TranslateService
	) {
		this.loadingSubject = this.splashScreenService.loadingSubject;
		this.loadingSubject.next(true);
	}

	ngOnInit(): void {
		this.state = this.route.snapshot.queryParams.state;
		const code = this.route.snapshot.queryParams.code;

		if (this.state == 'startupswallet_signin') {
			const loginSubscr = this.auth
			.loginWithLinkedIn(code, location.href.split('?')[0])
			.pipe(first())
			.subscribe((user: UserModel) => {
				this.loadingSubject.next(false);
				if (user) {
							this.router.navigate(['/']);
				} else {
					this.router.navigate(['/auth/registration']);
					this.toastService.show(this.translate.instant('OTHERS.linkedin_no_present'));
				}
			});
			this.unsubscribe.push(loginSubscr);
		} else if (this.state && this.state.indexOf('startupswallet_signup') >= 0) {
			const country = this.route.snapshot.queryParams.country;
			const loginSubscr = this.auth
			.registrationWithLinkedIn({
        code,
        redirect_uri: location.href.split('?')[0],
        platform: environment.platform,
        newsletter: this.state.split('_').pop() == 'linkedin',
				country
      })
			.pipe(first())
			.subscribe((user: UserModel) => {
				this.loadingSubject.next(false);
				if (user) {
					this.router.navigate(['/auth/configure-profile']);
				} else {
					this.router.navigate(['/auth/registration']);
					this.toastService.show(this.translate.instant('OTHERS.linkedin_no_present'));
				}
			});
			this.unsubscribe.push(loginSubscr);
		}
	}

	ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
