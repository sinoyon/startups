import { Platform } from '@angular/cdk/platform';
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonService } from '../../common/common.service';

@Component({
	selector: 'app-campaign-card',
	templateUrl: './card.component.html',
	styleUrls: ['./card.component.scss']
})
export class CardComponent implements OnInit, OnDestroy{

	@Input() data;
	@Input() type = 'md';

	@Output('videoClick') videoClickEvent = new EventEmitter<any>();
	@Output('followClick') followClickEvent = new EventEmitter<any>();
	@Output('walletClick') walletClickEvent = new EventEmitter<any>();
	@Output('detailClick') detailClickEvent = new EventEmitter<any>();
	@Output('externalClick') externalClickEvent = new EventEmitter<any>();
  @Output('expandClick') expandClickEvent = new EventEmitter<any>();

	@Input() expanded = false;

	isMobile = false;

	constructor(
		public common: CommonService,
		private platform: Platform
		) {
		this.isMobile = this.platform.ANDROID || this.platform.IOS;
	}
	ngOnInit(): void {
		
	}

	ngOnDestroy(): void {
	}
	onClick(e = null, except = null) {
		if (e && except && e.target.closest(except)) {
			return;
		}
		this.externalClickEvent.emit(this.data);
	}

	onDblClick(e = null, except = null) {
		if (e && except && e.target.closest(except)) {
			return;
		}
		this.detailClickEvent.emit(this.data);
	}

  onExpandCard() {
    this.expanded = !this.expanded;
    this.expandClickEvent.emit(this.expanded);
  }
}
