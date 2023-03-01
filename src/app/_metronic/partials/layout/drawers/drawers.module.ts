import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InlineSVGModule } from 'ng-inline-svg';
import { MessengerDrawerComponent } from './messenger-drawer/messenger-drawer.component';
import { NotificationDrawerComponent } from './notification-drawer/notification-drawer.component';
import { ExtrasModule } from '../extras/extras.module';

@NgModule({
  declarations: [
    MessengerDrawerComponent,
    NotificationDrawerComponent
  ],
  imports: [CommonModule, InlineSVGModule, RouterModule, ExtrasModule],
  exports: [
    MessengerDrawerComponent,
    NotificationDrawerComponent
  ],
})
export class DrawersModule {}
