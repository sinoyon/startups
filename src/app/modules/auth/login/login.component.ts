import { Component, OnInit, OnDestroy, ChangeDetectorRef, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription, Observable } from 'rxjs';
import { first, windowCount } from 'rxjs/operators';
import { UserModel } from '../_models/user.model';
import { AuthService } from '../_services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from 'src/app/pages/common/toast.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  hasError: boolean;
  returnUrl: string;
  isLoading$: Observable<boolean>;
  @Input() popup;
  @Output('page') pageEvent = new EventEmitter();
  @ViewChild('passwordInput', {static: true}) passwordInput: ElementRef;

  // private fields
  private unsubscribe: Subscription[] = []; // Read more: => https://brianflove.com/2016/12/11/anguar-2-unsubscribe-observables/

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    public modal: NgbActiveModal,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService,
  ) {
    this.isLoading$ = this.authService.isLoading$;
  }

  ngOnInit(): void {
    this.initForm();
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'.toString()] || '/';

    if (this.authService.currentUserValue && !this.popup) {
      this.router.navigate(['/']).then(() => window.location.reload());
    }

  }

  get f() {
    return this.loginForm.controls;
  }

  initForm() {
    this.loginForm = this.fb.group({
      email: [
        '',
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
          Validators.minLength(3),
          Validators.maxLength(100),
        ]),
      ],
    });
  }

  submit() {
    this.hasError = false;
    const loginSubscr = this.authService
      .login(this.f.email.value, this.f.password.value)
      .pipe(first())
      .subscribe((user: UserModel) => {
        if (user) {
          if (!this.popup) {
            this.router.navigate([this.returnUrl]).then(() => window.location.reload());
          } else {
            window.location.reload();
          }
        } else {
          this.hasError = true;
          if (this.popup) {
            this.toastService.show(this.translate.instant('AUTH.VALIDATION.INVALID_LOGIN'));
          }
        }
        this.modal.close();
        this.cdr.detectChanges();
      });
    this.unsubscribe.push(loginSubscr);
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }

  loginWithLinkedin() {
    location.href = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${environment.linkedinClientId}&redirect_uri=${environment.linkedinCallbackUri}&state=startupswallet_signin&scope=r_liteprofile%20r_emailaddress`;
  }

  onClickShowPassowrd() {
    if (this.passwordInput.nativeElement.type == 'password') {
      this.passwordInput.nativeElement.type = 'text';
    } else if (this.passwordInput.nativeElement.type == 'text') {
      this.passwordInput.nativeElement.type = 'password';
    }
    this.cdr.detectChanges();
  }
}
