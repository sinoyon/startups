import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AgmCoreModule, GoogleMapsAPIWrapper } from '@agm/core';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { InlineSVGModule } from 'ng-inline-svg';
import { CardComponent } from './card/card.component';
import { CardSliderComponent } from './card-slider/card-slider.component';
import { MapComponent } from './map/map.component';
import { Safe } from '../common/safe-html.pipe';
import { AeSelectComponent } from './ae-select/ae-select.component';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { ListComponent } from './list/list.component';
import { TypologySelectorComponent } from './typology-selector/typology-selector.component';
import { ViewSelectorComponent } from './view-selector/view-selector.component';
import { MultiSelectComponent } from './multi-select/multi-select.component';
import { ToggleButtonComponent } from './toggle-button.component';

@NgModule({
  declarations: [
    CardComponent,
    CardSliderComponent,
    MapComponent,
    ListComponent,
		Safe,
    AeSelectComponent,
    TypologySelectorComponent,
    ViewSelectorComponent,
    MultiSelectComponent,
    ToggleButtonComponent
  ],
  providers: [
    GoogleMapsAPIWrapper
  ],
  imports: [
    CommonModule,
    FormsModule,
		ReactiveFormsModule,
    NgbTooltipModule,
    InlineSVGModule,
    TranslateModule.forChild(),
    AgmCoreModule.forRoot({apiKey: 'AIzaSyB1ybIZvTg12vt_dL7pjThLpI33MQIlOPc'}),
    PerfectScrollbarModule,
  ],
  exports: [
    CardComponent,
    CardSliderComponent,
    MapComponent,
    ListComponent,
    Safe,
    AeSelectComponent,
    TypologySelectorComponent,
    ViewSelectorComponent,
    MultiSelectComponent,
    ToggleButtonComponent
  ],
  entryComponents: []
})
export class ComponentsModule {}
