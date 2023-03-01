// Angular
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation, ViewRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { AuthService } from '../_services/auth.service';
import { first } from 'rxjs/operators';
import { UserModel } from '../_models/user.model';
import jwt_decode from 'jwt-decode';
import { UserService } from '../../../pages/common/user.service';

enum ErrorStates {
	NotSubmitted,
	HasError,
	HasTokenError,
	NoError,
}
@Component({
	selector: 'app-verify-email',
	templateUrl: './verify-email.component.html',
	styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent implements OnInit, OnDestroy {

	loadingSubject = new BehaviorSubject<boolean>(true);
	loading$: Observable<boolean>;

	token;
	decodedUserId;

	user;
	errorState: ErrorStates = ErrorStates.NotSubmitted;
  	errorStates = ErrorStates;
	private unsubscribe: Subscription[] = [];


	constructor(
		private route: ActivatedRoute,
		private auth: AuthService,
		private router: Router,
		private userService: UserService,
	) {

		this.auth.currentUserSubject.subscribe( user => this.user = user);
	}

	ngOnInit(): void {
		this.loading$ = this.loadingSubject.asObservable();
		this.loadingSubject.next(false);

		this.route.queryParams.subscribe(params => {
			this.token = params.token;
			try {
				const decoded: any = jwt_decode(this.token);
				this.decodedUserId = decoded.user.id;
				this.submitVerify();
			} catch (error) {
				this.errorState = ErrorStates.HasTokenError;
			}

		});
	}
	submitVerify() {
		this.errorState = ErrorStates.NotSubmitted;
		const verifyEmailSubscr = this.auth
		.verifyEmail(this.token)
		.pipe(first())
		.subscribe((result: UserModel) => {
			if (result) {
				this.auth.currentUserSubject.next(result);
				this.router.navigateByUrl('/auth/configure-profile');
			}
			this.errorState = result ? ErrorStates.NoError : ErrorStates.HasError;
			this.loadingSubject.next(false);
		});
		this.unsubscribe.push(verifyEmailSubscr);
	}

	ngOnDestroy(): void {
	}
	async resendConfirmEmail(){

		try {
			const res = await this.userService.sendVerifyEmail([this.decodedUserId]);
		} catch (error) {
		}
		this.router.navigate(['/']);
	}
}
