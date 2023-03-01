import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from 'src/app/modules/auth/_services/auth.guard';
import { UnsubscribeComponent } from './unsubscribe.component';

const routes: Routes = [
  {
    path: '',
    component: UnsubscribeComponent,
    canActivate: [AuthGuard]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UnsubscribeRoutingModule {}
