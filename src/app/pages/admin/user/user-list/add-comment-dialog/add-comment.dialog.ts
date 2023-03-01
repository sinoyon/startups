// Angular
import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef, Inject, ViewChild, ViewRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, BehaviorSubject, Subject } from 'rxjs';

import { cloneDeep, concat } from 'lodash';
import { UserService } from 'src/app/pages/common/user.service';
import { KTUtil } from 'src/app/_metronic/kt';
import { QueryResultsModel } from 'src/app/pages/common/models/query-results.model';

@Component({
	selector: 'app-add-comment-dialog',
	templateUrl: './add-comment.dialog.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddCommentDialog implements OnInit, OnDestroy {

	loadingSubject = new BehaviorSubject<boolean>(true);
	loading$: Observable<boolean>;

	comment;


	private unsubscribe: Subscription[] = [];

	constructor(
		private cdr: ChangeDetectorRef,
		private translate: TranslateService,
		public modal: NgbActiveModal,
		private userService: UserService) { }

	ngOnInit() {
		this.loading$ = this.loadingSubject.asObservable();
	}

	ngOnDestroy() {
		this.unsubscribe.forEach(el => el.unsubscribe());
	}

	async onYesClick() {
		try {
			this.modal.close(this.comment);
		} catch (error) {

		}
	}

	onInitEditor(evt) {
		this.loadingSubject.next(false);
  }
}
