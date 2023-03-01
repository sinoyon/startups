import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Subscription, Observable } from 'rxjs';
import { AuthService } from '../_services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmPasswordValidator } from '../registration/confirm-password.validator';
import { UserModel } from '../_models/user.model';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  resetPasswordForm: FormGroup;
  hasError: boolean;
  isLoading$: Observable<boolean>;
  token;

  @Input() popup;
  @Output('close') closeEvent = new EventEmitter();
  @ViewChild('container', {static: true}) containerEl: ElementRef;

  @ViewChild('passwordInput', {static: true}) passwordInput: ElementRef;
  @ViewChild('confirmPasswordInput', {static: true}) confirmPasswordInput: ElementRef;
  passwordStrength: any = {
		capital: false,
		lower: false,
		special: false,
		number: false,
    len: false,
    maxLen: false
	};

  // private fields
  private unsubscribe: Subscription[] = []; // Read more: => https://brianflove.com/2016/12/11/anguar-2-unsubscribe-observables/

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.isLoading$ = this.authService.isLoading$;
    this.route.queryParams.subscribe(params => {
			this.token = params.token;
		});

  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
			this.token = params.token;
			try {
				const decoded: any = jwt_decode(this.token);
				const emailConfirmed = decoded.user.emailConfirmed;
        if (!emailConfirmed) {
        //  this.authService.verifyEmail(this.token)
        }
			} catch (error) {
			}
		});
    this.initForm();
  }

  // convenience getter for easy access to form fields
  get f() {
    return this.resetPasswordForm.controls;
  }

  initForm() {
    this.resetPasswordForm = this.fb.group(
      {
        password: [
          '',
          Validators.compose([
            Validators.required,
            Validators.pattern('(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[$@$!$#$^|/.,;:_()%*?&])[A-Za-z\d$@$!$#$%*&?].{7,30}')
          ]),
        ],
        cPassword: [
          '',
          Validators.compose([
            Validators.required
          ]),
        ],
      },
      {
        validator: ConfirmPasswordValidator.MatchPassword,
      }
    );
  }

  submit() {
    this.hasError = false;

    const subscr = this.authService
      .resetPassword(this.f.password.value, this.token)
      .pipe(first())
      .subscribe((user: UserModel) => {
        if (user) {
          this.router.navigate(['/']).then(() => window.location.reload());
        } else {
          this.hasError = true;
        }
        this.closeEvent.emit();
      });
    this.unsubscribe.push(subscr);
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }

  onChangePasswordInput(event, defaultValue = null){

		const password = event ?  event.target.value : (defaultValue || '');
		this.passwordStrength = {
			capital: false,
			lower: false,
			special: false,
			number: false,
			len: false
		};

    this.passwordStrength.len = password.length >= 8;
    this.passwordStrength.maxLen = password.length <= 30 && password.length > 0;

		for (let i = 0 ; i < password.length; i++){
			const c = password.charAt(i);
			if (c >= 'A' && c <= 'Z'){
				this.passwordStrength.capital = true;
			}
			if (c >= 'a' && c <= 'z'){
				this.passwordStrength.lower = true;
			}
			if (`?|)-(!"£$%&/='^;,.:_*§°Ç#@`.indexOf(c) >= 0){
				this.passwordStrength.special =  true;
			}
			if (c >= '0' && c <= '9'){
				this.passwordStrength.number = true;
			}
		}
		this.resetPasswordForm.get('cPassword').updateValueAndValidity();
		this.cdr.detectChanges();

	}
  onClickShowPassowrd() {
    if (this.passwordInput.nativeElement.type == 'password') {
      this.passwordInput.nativeElement.type = 'text';
      this.confirmPasswordInput.nativeElement.type = 'text';
    } else if (this.passwordInput.nativeElement.type == 'text') {
      this.passwordInput.nativeElement.type = 'password';
      this.confirmPasswordInput.nativeElement.type = 'password';
    }
    this.cdr.detectChanges();
  }
}
function jwt_decode(token: any) {
  throw new Error('Function not implemented.');
}

