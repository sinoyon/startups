import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AuthComponent } from './auth.component';
import { TranslateModule } from '@ngx-translate/core';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from './login/login.component';
import { RegistrationComponent } from './registration/registration.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { ConfigureProfileComponent } from './configure-profile/configure-profile.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { LinkedinCallbackComponent } from './linkedin/callback.component';
import { AuthDialog } from './auth.dialog';
import { LogoutComponent } from './logout/logout.component';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';

@NgModule({
  declarations: [
    LoginComponent,
    RegistrationComponent,
    ForgotPasswordComponent,
    LogoutComponent,
    AuthComponent,
    VerifyEmailComponent,
    ResetPasswordComponent,
    AuthDialog,
    LinkedinCallbackComponent,
    ConfigureProfileComponent,
  ],
  exports: [AuthDialog],
  entryComponents: [AuthDialog],
  imports: [
    CommonModule,
    AuthRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    TranslateModule.forChild(),
    PerfectScrollbarModule,
    NgbTooltipModule,
    NgSelectModule
  ]
})
export class AuthModule {
}
