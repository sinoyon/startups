import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InlineSVGModule } from 'ng-inline-svg';

import { AccountRoutingModule } from './account-routing.module';
import { AccountComponent } from '../account/account.component';
import { ProfileDetailsComponent } from './settings/forms/profile-details/profile-details.component';
import { ConnectedAccountsComponent } from './settings/forms/connected-accounts/connected-accounts.component';
import { DeactivateAccountComponent } from './settings/forms/deactivate-account/deactivate-account.component';
import { EmailPreferencesComponent } from './settings/forms/email-preferences/email-preferences.component';
import { NotificationsComponent } from './settings/notifications/notifications.component';
import { SignInMethodComponent } from './settings/forms/sign-in-method/sign-in-method.component';
import { TranslateModule } from '@ngx-translate/core';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CategoriesComponent } from './overview/categories/categories.component';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PersonalComponent } from './settings/personal/personal.component';
import { LpTableModule } from '../common/lp-table/lp-table.module';
import { WalletsComponent } from './overview/wallets/wallets.component';
import { NgApexchartsModule } from 'ng-apexcharts';
import { DialogsModule } from '../dialogs/dialogs.module';
import { ComponentsModule } from '../components/components.module';
import { CampaignsComponent } from './overview/campaigns/campaigns.component';

@NgModule({
  declarations: [
    AccountComponent,
    ProfileDetailsComponent,
    ConnectedAccountsComponent,
    DeactivateAccountComponent,
    EmailPreferencesComponent,
    NotificationsComponent,
    SignInMethodComponent,
    CategoriesComponent,
    PersonalComponent,
    WalletsComponent,
    CampaignsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AccountRoutingModule,
    InlineSVGModule,
    TranslateModule.forChild(),
    NgbTooltipModule,
    PerfectScrollbarModule,
    LpTableModule,
    NgApexchartsModule,
    DialogsModule,
    ComponentsModule
  ],
})
export class AccountModule {}
