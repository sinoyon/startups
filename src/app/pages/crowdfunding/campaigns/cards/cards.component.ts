// Angular
import { Component, Output, EventEmitter, ViewChild, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, HostBinding, Input, HostListener, Renderer2, forwardRef, ViewRef, AfterViewInit } from '@angular/core';
import { debounce } from 'lodash';
import { KTUtil } from '../../../../_metronic/kt/index';

@Component({
	selector: 'app-crowdfunding-cards',
	templateUrl: './cards.component.html',
	styleUrls: ['./cards.component.scss']
})
export class CardsComponent implements OnInit, OnDestroy, AfterViewInit{

	@Input() campaigns = [];
	@Input() totalCount = 0;
	@Input() advs = [];
	@Input() sourceAdvs = [];
	@Input() isFilteredOrSorted = false;
	@Input() expanded = true;

	columns = 3;
  // expanded = true;
  expandedAdv = false;

	@Output('videoClick') videoClickEvent = new EventEmitter<any>();
	@Output('followClick') followClickEvent = new EventEmitter<any>();
	@Output('walletClick') walletClickEvent = new EventEmitter<any>();
	@Output('detailClick') detailClickEvent = new EventEmitter<any>();
	@Output('externalClick') externalClickEvent = new EventEmitter<any>();

	@Output('loadMore') loadMoreEvent = new EventEmitter<any>();

	constructor( private cdr: ChangeDetectorRef) {
		const vpWidth = KTUtil.getViewPort().width;
		this.columns = vpWidth >= 1200 ? 3 : (vpWidth >= 768 ? 2 : 1);
		window.addEventListener('resize', debounce (() => {
			const vpWidth = KTUtil.getViewPort().width;
			this.columns = vpWidth >= 1200 ? 3 : (vpWidth >= 768 ? 2 : 1);
			this.cdr.detectChanges();
		}, 100));
	}
	ngOnInit(): void {
	}
	ngOnDestroy(): void {

	}

	ngAfterViewInit() {
	}

  onExpandCard(param) {
    this.expanded = param;
    this.expandedAdv = param;
  }
}
