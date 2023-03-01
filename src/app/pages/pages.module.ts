import { Component, NgModule, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../modules/auth/_services/auth.guard';
import { ModuleGuard } from './common/module.guard';

@Component({
	template: '<router-outlet></router-outlet>'
})
export class PagesComponent implements OnInit {
	constructor() {
	}
	ngOnInit() {}
}

const routes: Routes = [
  {
    path: '',
    component: PagesComponent,
    children:  [
      {
        path: 'crowdfunding',
        loadChildren: () =>
          import('./crowdfunding/crowdfunding.module').then((m) => m.CrowdfundingModule),
      },
      {
        path: 'account',
        canActivate: [AuthGuard, ModuleGuard],
        data: {
          emailConfirmed: true
        },
        loadChildren: () =>
          import('./account/account.module').then(m => m.AccountModule)
      },
      {
        path: 'admin',
        canActivate: [AuthGuard, ModuleGuard],
        loadChildren: () =>
          import('./admin/admin.module').then(m => m.AdminModule)
      },
      {
        path: 'reports',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./reports/reports.module').then(
            (m) => m.ReportsModule
          ),
      },
      {
        path: 'campaigns',
        redirectTo: '/crowdfunding',
      },
      {
        path: '',
        redirectTo: '/crowdfunding',
        pathMatch: 'full',
      },
      {
        path: '**',
        redirectTo: 'error/404',
      },
    ]
  },
];

@NgModule({
  declarations: [
    PagesComponent
  ],
  providers: [
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
  ],
  exports: [RouterModule],
})
export class PagesModule {}
