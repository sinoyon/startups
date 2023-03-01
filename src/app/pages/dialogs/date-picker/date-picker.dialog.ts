// Angular
import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef, Inject, ViewChild, ViewRef } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, BehaviorSubject, Subject } from 'rxjs';


@Component({
	selector: 'app-date-picker-dialog',
	templateUrl: './date-picker.dialog.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatePickerDialog implements OnInit, OnDestroy {

	date;
	private unsubscribe: Subscription[] = [];

	minDate = null;

	constructor(
		public modalActive: NgbActiveModal,
		) { }

	ngOnInit() {
	}

	ngOnDestroy() {
		this.unsubscribe.forEach(el => el.unsubscribe());
	}

	onYesClick() {
		this.modalActive.close(this.date);
	}

	onDateChanged(event) {
		this.date = new Date(event);
	}
}
