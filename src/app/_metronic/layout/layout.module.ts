import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InlineSVGModule } from 'ng-inline-svg';
import { RouterModule, Routes } from '@angular/router';
import {
  NgbDropdownModule,
  NgbProgressbarModule,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { TranslationModule } from '../../modules/i18n';
import { LayoutComponent } from './layout.component';
import { ExtrasModule } from '../partials/layout/extras/extras.module';
import { Routing } from '../../pages/routing';
import { HeaderComponent } from './components/header/header.component';
import { ContentComponent } from './components/content/content.component';
import { FooterComponent } from './components/footer/footer.component';
import { ScriptsInitComponent } from './components/scripts-init/scripts-init.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { TopbarComponent } from './components/topbar/topbar.component';
import { PageTitleComponent } from './components/header/page-title/page-title.component';
import { HeaderMenuComponent } from './components/header/header-menu/header-menu.component';
import { DrawersModule, ModalsModule } from '../partials';
import { NgLetModule } from 'ng-let';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LanguageSelectorComponent } from './components/footer/language-selector/language-selector.component';
import { AsideComponent } from './components/aside/aside.component';
import { AsideMenuComponent } from './components/aside/aside-menu/aside-menu.component';
import { CarouselSliderComponent } from './components/carousel-slider/carousel-slider.component';

import { CarouselModule } from 'ngx-owl-carousel-o';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: Routing,
  },
];

@NgModule({
  declarations: [
    LayoutComponent,
    HeaderComponent,
    ContentComponent,
    FooterComponent,
    ScriptsInitComponent,
    ToolbarComponent,
    TopbarComponent,
    PageTitleComponent,
    HeaderMenuComponent,
    LanguageSelectorComponent,
    AsideComponent,
    AsideMenuComponent,
    CarouselSliderComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
		ReactiveFormsModule,
    RouterModule.forChild(routes),
    TranslationModule,
    InlineSVGModule,
    NgbDropdownModule,
    NgbProgressbarModule,
    ExtrasModule,
    ModalsModule,
    DrawersModule,
    NgbTooltipModule,
    TranslateModule.forChild(),
    InlineSVGModule,
    NgLetModule,
    CarouselModule
  ],
  exports: [RouterModule],
})
export class LayoutModule {}
