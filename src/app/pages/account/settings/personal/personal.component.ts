import { cloneDeep } from 'lodash';
import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/modules/auth/_services/auth.service';
import { UserService } from 'src/app/pages/common/user.service';
import { SplashScreenService } from 'src/app/_metronic/partials';

@Component({
  selector: 'app-account-personal',
  templateUrl: './personal.component.html'
})
export class PersonalComponent implements OnInit, OnDestroy {

	locale = 'it-IT';

	loadingSubject;
	loading$: Observable<boolean>;

	user;

    checked: boolean;
    notification: any;
    notificationApp: any;

	form: FormGroup;
	private subscriptions: Subscription[] = [];

	constructor(
		private translate: TranslateService,
		private cdr: ChangeDetectorRef,
		public auth: AuthService,
		private fb: FormBuilder,
		private userService: UserService,
		private splashScreenService: SplashScreenService
		) {


		this.loadingSubject = this.splashScreenService.loadingSubject;

        this.form = this.fb.group({
            firstName: [
                '',
                Validators.compose([
                Validators.required,
                ])
            ],
            lastName: [
                '',
                Validators.compose([
                Validators.required,
                ])
            ],
            phone: [
                '',
                Validators.compose([
                ])
            ],
            linkedInProfileUrl: [
                '',
                Validators.compose([
                ])
            ],
            jobTitle: [
                '',
                Validators.compose([
                ])
            ],
            city: [
                '',
                Validators.compose([
                ])
            ],
            actualCompany: [
                '',
                Validators.compose([
                ])
            ],
        });

        this.loading$ = this.loadingSubject.asObservable();
        this.subscriptions.push(this.auth.currentUserSubject.subscribe( user => {
            this.user = user;
            this.notification = cloneDeep(this.user.notification);
            this.notificationApp = cloneDeep(this.user.notificationApp);
            this.initForm();
        }));


	}

	ngOnInit(): void {
		this.subscriptions.push(this.translate.onLangChange.subscribe( lang => {
			this.updateByTranslate(lang.lang);
		}));
		this.updateByTranslate(this.translate.currentLang);
		this.loading$ = this.loadingSubject.asObservable();
	}

	ngOnDestroy(): void {
		this.subscriptions.forEach ( u => u.unsubscribe());
	}

	initForm() {
		if (!this.user) {return;}

        this.form.setValue({
            firstName: this.user.firstName,
            lastName: this.user.lastName,
            linkedInProfileUrl: this.user.linkedInProfileUrl || '',
            phone: this.user.phone || '',
            jobTitle: this.user.jobTitle || '',
            city: this.user.city || '',
            actualCompany: this.user.actualCompany || ''
        });

        this.form.markAsPristine();
	}
	updateByTranslate(lang){
		if (lang == 'en') {
			this.locale = 'en-US';
		} else if (lang == 'it') {
			this.locale = 'it-IT';
		}
	}
	async save(){
		this.form.markAllAsTouched();
        if (!this.form.valid) {
            return;
        }
		try {
			await this.userService.update({
				_id: this.user._id,
				...this.form.value
			});
			this.auth.getUserByToken().subscribe();
		} catch (error) {
		}
	}

    async deletAccount() {
        await this.userService.update({
            _id: this.user._id,
            deleted: "yes"
        });
        this.auth.logout();
    }

    changeSubscribe($event) {
        this.checked = $event;
        this.setFalse();
    }
    
    setFalse(isMobile = false) {
        Object.keys(this.notification).forEach(mainKey => {
            Object.keys(this.notification[mainKey]).forEach(key => {
            this.notification[mainKey][key] = this.checked;
            });
        });
        this.subscribeFunc();
    }

    async subscribeFunc() {    
        try {
            await this.userService.update({
            _id: this.user._id,
            newsletter: this.checked,
            notification: this.notification,
            notificationApp: this.notificationApp
            });

            this.auth.getUserByToken().subscribe();

        } catch (error) {
        }

        this.cdr.detectChanges();
    }
}
