import { TranslateModule } from '@ngx-translate/core';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UnsubscribeComponent } from '../unsubscribe/unsubscribe.component';
import { UnsubscribeRoutingModule } from './unsubscribe-routing.module';
import { Routes, RouterModule } from '@angular/router';


const routes: Routes = [
	{
		path: '',
		component: UnsubscribeComponent,
    children:  [
      {
        path: 'unsubscribe',
        component: UnsubscribeComponent,
      },
      {
        path: '',
        redirectTo: '/unsubscribe',
        pathMatch: 'full',
      }
    ]
	}
];

@NgModule({
  declarations: [
    UnsubscribeComponent
  ],
  imports: [
    CommonModule,
    UnsubscribeRoutingModule,
    TranslateModule.forChild(),
    RouterModule.forChild(routes),
  ]
})
export class UnsubscribeModule { }
