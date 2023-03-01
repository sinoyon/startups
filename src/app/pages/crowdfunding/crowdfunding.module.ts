// Angular
import { Component, NgModule, OnInit, Pipe } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// Components

import { TranslateModule } from '@ngx-translate/core';
import { CampaignsComponent } from './campaigns/campaigns.component';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { NgbModalModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { InlineSVGModule } from 'ng-inline-svg';
import { FilterComponent } from './campaigns/filter/filter.component';
import { CardsComponent } from './campaigns/cards/cards.component';
import { VideoComponent } from './campaigns/video/video.component';
import { ComponentsModule } from '../components/components.module';
import { CampaignComponent } from './campaign/campaign.component';
import { LayoutInitService } from 'src/app/_metronic/layout/core/layout-init.service';
import { SortSelectorComponent } from './campaigns/sort-selector/sort-selector.component';
import { CountrySelectorComponent } from './campaigns/country-selector/country-selector.component';

import { ShareButtonsModule } from 'ngx-sharebuttons/buttons';
import { ShareIconsModule } from 'ngx-sharebuttons/icons';
import { SourceComponent } from './source/source.component';
import { CategoryComponent } from './category/category.component';

@Component({
	template: '<router-outlet></router-outlet>'
})
export class CrowdfundingComponent implements OnInit {
	constructor(private layoutInitService: LayoutInitService) {
	}
	ngOnInit() {
		this.layoutInitService.toogleToolbar(false);
    this.layoutInitService.toogleAside(false);
	}
}


// tslint:disable-next-line:class-name
const routes: Routes = [
	{
		path: '',
		component: CrowdfundingComponent,
		children: [
			{
				path: '',
				component: CampaignsComponent
			},
			{
				path: ':systemTitle',
				component: CampaignComponent
			},
			{
				path: 'source/:name',
				component: SourceComponent
			},
			{
				path: 'category/:name',
				component: CategoryComponent
			},
			{
				path: '',
				redirectTo: '',
				pathMatch: 'full'
			}
		]
	}
];

@NgModule({
	imports: [
		CommonModule,
		HttpClientModule,
		InlineSVGModule,
		RouterModule.forChild(routes),
		FormsModule,
		ReactiveFormsModule,
		TranslateModule.forChild(),
		PerfectScrollbarModule,
		NgbModalModule,
		NgbTooltipModule,
		ComponentsModule,
		ShareButtonsModule,
  	ShareIconsModule,
		// ModalsModule
	],
	declarations: [
		CrowdfundingComponent,
		CampaignsComponent,
		FilterComponent,
		SortSelectorComponent,
		CountrySelectorComponent,
		CardsComponent,
		VideoComponent,
		CampaignComponent,
  	SourceComponent,
   	CategoryComponent
	],
	providers: [

	]
})
export class CrowdfundingModule { }
