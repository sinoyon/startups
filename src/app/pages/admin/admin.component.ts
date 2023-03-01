// Angular
import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { KTUtil } from 'src/app/_metronic/kt';
import { LayoutService } from 'src/app/_metronic/layout';
import { LayoutInitService } from 'src/app/_metronic/layout/core/layout-init.service';

@Component({
	templateUrl: './admin.component.html',
	styleUrls: ['./admin.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminComponent implements OnInit, OnDestroy {
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
		this.layoutInitService.toogleToolbar(true);
    this.layoutInitService.toogleAside(true);
		this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow'});
	}

	ngOnDestroy() {
		this.meta.removeTag('name=\'robots\'');
	}
}
