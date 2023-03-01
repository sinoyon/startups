import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InlineSVGModule } from 'ng-inline-svg';
import { NotificationsInnerComponent } from './dropdown-inner/notifications-inner/notifications-inner.component';
import { UserInnerComponent } from './dropdown-inner/user-inner/user-inner.component';
import { LayoutScrollTopComponent } from './scroll-top/scroll-top.component';
import { TranslationModule } from '../../../../modules/i18n';
import { NgLetModule } from 'ng-let';
import { SearchInnerComponent } from './dropdown-inner/search-inner/search-inner.component';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { HighlightPipe } from 'src/app/pages/common/hightlight.pipe';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ResizableModule } from 'angular-resizable-element';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { ChatInnerComponent } from './dropdown-inner/chat-inner/chat-inner.component';
import { ChatSearchComponent } from './dropdown-inner/chat-inner/search/search.component';

@NgModule({
  declarations: [
    NotificationsInnerComponent,
    ChatInnerComponent,
    ChatSearchComponent,
    UserInnerComponent,
    LayoutScrollTopComponent,
    SearchInnerComponent,
    HighlightPipe
  ],
  imports: [CommonModule,
  FormsModule,
    ReactiveFormsModule,
    InlineSVGModule,
    RouterModule,
    TranslationModule,
    NgLetModule,
    PerfectScrollbarModule,
    ResizableModule,
    NgbDropdownModule
  ],
  exports: [
    NotificationsInnerComponent,
    UserInnerComponent,
    LayoutScrollTopComponent,
    SearchInnerComponent,
    ChatInnerComponent,
    ChatSearchComponent
  ],
})
export class ExtrasModule {}
