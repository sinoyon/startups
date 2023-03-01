import { FormsModule } from '@angular/forms';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
// import { ClipboardModule } from 'ngx-clipboard';
import { TranslateModule } from '@ngx-translate/core';
import { InlineSVGModule } from 'ng-inline-svg';
import { NgbActiveModal, NgbModule, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthService } from './modules/auth/_services/auth.service';
import { SplashScreenModule } from './_metronic/partials/layout/splash-screen/splash-screen.module';
import { ToastsContainer } from './pages/common/toast.service';

import { ShareButtonsModule } from 'ngx-sharebuttons/buttons';
import { ShareIconsModule } from 'ngx-sharebuttons/icons';

import { CarouselModule } from 'ngx-owl-carousel-o';
import { NgSelectModule } from '@ng-select/ng-select';

function appInitializer(authService: AuthService) {
  return () => new Promise((resolve) => {
    authService.getUserByToken().subscribe().add(resolve);
  });
}

@NgModule({
  declarations: [AppComponent, ToastsContainer],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    TranslateModule.forRoot(),
    SplashScreenModule,
    HttpClientModule,
    AppRoutingModule,
    InlineSVGModule.forRoot(),
    NgbModule,
    NgbToastModule,
    ShareButtonsModule,
    ShareIconsModule,
    CarouselModule,
    NgSelectModule,
    FormsModule
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializer,
      multi: true,
      deps: [AuthService],
    },
    NgbActiveModal
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
