// Angular
import { Component, OnInit, ViewChild, ChangeDetectionStrategy, OnDestroy, ViewRef, ChangeDetectorRef } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import htmlBeautify from 'html-beautify';


@Component({
	selector: 'app-html-viewer-dialog',
	templateUrl: './html-viewer.dialog.html',
	styleUrls: ['./html-viewer.dialog.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class HtmlViewerDialog implements OnInit, OnDestroy {

	html;

	constructor(
		private cdr: ChangeDetectorRef,
		public modal: NgbActiveModal) { }

	ngOnInit() {

	}

	ngOnDestroy() {

	}

	load(param) {
		if (!param) {return;}
		if (Array.isArray(param)) {
			param = param.join('');
		}
		this.html = htmlBeautify(param);
	}
}
