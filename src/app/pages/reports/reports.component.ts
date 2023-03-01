// Angular
import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { LayoutInitService } from 'src/app/_metronic/layout/core/layout-init.service';

@Component({
	templateUrl: './reports.component.html',
	styleUrls: ['./reports.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsComponent implements OnInit, OnDestroy {
	/**
	 * Component constructor
	 *
	 * @param store: Store<AppState>
	 * @param router: Router
	 */

	constructor(private meta: Meta, private layoutInitService: LayoutInitService) {
	}

	/*
	 * @ Lifecycle sequences => https://angular.io/guide/lifecycle-hooks
    */

	/**
	 * On init
	 */
	ngOnInit() {
		this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow'});
		this.layoutInitService.toogleToolbar(true);
    this.layoutInitService.toogleAside(true);
	}

	ngOnDestroy() {
		this.meta.removeTag('name=\'robots\'');
	}
}
