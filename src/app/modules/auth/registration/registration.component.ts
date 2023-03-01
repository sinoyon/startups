import { TranslateService } from '@ngx-translate/core';
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Subscription, Observable } from 'rxjs';
import { AuthService } from '../_services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmPasswordValidator } from './confirm-password.validator';
import { UserModel } from '../_models/user.model';
import { first } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonService } from 'src/app/pages/common/common.service';
import { Platform } from '@angular/cdk/platform';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss'],
})
export class RegistrationComponent implements OnInit, OnDestroy {

  registrationForm: FormGroup;
  hasError: boolean;
  loading$: Observable<boolean>;
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

  countries = [
    {id: 'italy', name: 'Italy'},
		{id: 'france', name: 'France'},
		// {id: 'spain', name: 'Spain'},
		// {id: 'german', name: 'German'}
  ];
  selectedCountry: any;


  @Input() popup;
  @ViewChild('container', {static: true}) containerEl: ElementRef;
  // private fields
  private unsubscribe: Subscription[] = []; // Read more: => https://brianflove.com/2016/12/11/anguar-2-unsubscribe-observables/

  lang: any = 'it';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    public modal: NgbActiveModal,
    private cdr: ChangeDetectorRef,
    public common: CommonService,
    public platform: Platform,
    private translate: TranslateService
  ) {
    this.loading$ = this.authService.isLoading$;
    this.lang = translate.currentLang;
  }

  ngOnInit(): void {
    this.initForm();

    this.selectedCountry = this.authService.userCountry;

    if (this.authService.currentUserValue && !this.popup) {
      this.router.navigate(['/']);
    }
  }

  selectCountry($event) {
    console.info('event : ', $event.target.value);
    this.selectedCountry = $event.target.value;
    this.registrationForm.patchValue({country: $event.target.value});
  }

  // convenience getter for easy access to form fields
  get f() {
    return this.registrationForm.controls;
  }

  initForm() {
    this.registrationForm = this.fb.group(
      {
        firstName: [
          '',
          Validators.compose([
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(100),
          ]),
        ],
        lastName: [
          '',
          Validators.compose([
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(100),
          ]),
        ],
        email: [
          this.route.snapshot.queryParams.email || '',
          Validators.compose([
            Validators.required,
            Validators.email,
            Validators.minLength(3),
            Validators.maxLength(320), // https://stackoverflow.com/questions/386294/what-is-the-maximum-length-of-a-valid-email-address
          ]),
        ],
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
        newsletter: [this.route.snapshot.queryParams.from == 'newsletter'],
        registrationInformation: [false, Validators.compose([
          Validators.requiredTrue
        ])],
        country: [
          'italy',
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
    const result = {};
    Object.keys(this.f).forEach(key => {
      result[key] = this.f[key].value;
    });
    const newUser = new UserModel();
    newUser.setUser(result);

    let plt = 'web';
    if (this.platform.ANDROID) {
      plt = 'android browser';
    } else if (this.platform.IOS) {
      plt = 'ios browser';
    }
    
    newUser.platform = plt;
    
    const registrationSubscr = this.authService
      .registration(newUser)
      .pipe(first())
      .subscribe((user: UserModel) => {
        if (user) {
          if (!this.popup) {
            this.router.navigateByUrl('/crowdfunding', { state: { confirmEmail: true} }).then(() => window.location.reload());;
          }
        } else {
          this.hasError = true;
        }
        this.modal.close();
        this.cdr.detectChanges();
      });
    this.unsubscribe.push(registrationSubscr);
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
  registrationWithLinkedin(){
    location.href = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${environment.linkedinClientId}&redirect_uri=${environment.linkedinCallbackUri}&state=startupswallet_signup${this.registrationForm.get('newsletter').value?'_linkedin': ''}&country=${this.registrationForm.get('country').value}&scope=r_liteprofile%20r_emailaddress`;
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
		this.registrationForm.get('cPassword').updateValueAndValidity();
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
