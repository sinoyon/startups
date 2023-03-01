import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccountComponent } from './account.component';
import { NotificationsComponent } from './settings/notifications/notifications.component';
import { CategoriesComponent } from './overview/categories/categories.component';
import { PersonalComponent } from './settings/personal/personal.component';
import { WalletsComponent } from './overview/wallets/wallets.component';
import { CampaignsComponent } from './overview/campaigns/campaigns.component';
import { AuthGuard } from 'src/app/modules/auth/_services/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: AccountComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'overview/campaigns',
        component: CampaignsComponent,
      },
      {
        path: 'overview/categories',
        component: CategoriesComponent,
      },
      {
        path: 'overview/wallets',
        component: WalletsComponent,
      },
      {
        path: 'settings/notification',
        component: NotificationsComponent,
      },
      {
        path: 'settings/personal',
        component: PersonalComponent,
      },
      { path: '', redirectTo: 'overview/campaigns', pathMatch: 'full' },
      { path: '**', redirectTo: 'overview/campaigns', pathMatch: 'full' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AccountRoutingModule {}
