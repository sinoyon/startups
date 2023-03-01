// Angular
import { Component, OnInit, ViewChild, ChangeDetectionStrategy, OnDestroy, ViewRef, ChangeDetectorRef } from '@angular/core';
import { Observable, Subscription, BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';


@Component({
	selector: 'app-permissions-detail-dialog',
	templateUrl: './permissions-detail.dialog.html',
	styleUrls: ['./permissions-detail.dialog.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class PermissionsDetailDialog implements OnInit, OnDestroy {

	locale = 'it-IT';

	loadingSubject = new BehaviorSubject<boolean>(false);
	loading$: Observable<boolean>;

	role;

	private unsubscribe: Subscription[] = [];

	constructor(
		private cdr: ChangeDetectorRef,
		private translate: TranslateService,
		public modal: NgbActiveModal) { }

	ngOnInit() {
		this.loading$ = this.loadingSubject.asObservable();

		this.unsubscribe.push(this.translate.onLangChange.subscribe( lang => {
			this.updateByTranslate(lang.lang);
		}));
		this.updateByTranslate(this.translate.currentLang);

	}

	ngOnDestroy() {
		this.unsubscribe.forEach(el => el.unsubscribe());
	}
	updateByTranslate(lang){
		if (lang == 'en') {
			this.locale = 'en-US';
		} else if (lang == 'it') {
			this.locale = 'it-IT';
		}
	}
	getDateStringFromDate(param): string {
		const date = new Date(param);
		return date.toLocaleString(this.locale, {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
		}).replace(', ', ', h:');
	}
}
