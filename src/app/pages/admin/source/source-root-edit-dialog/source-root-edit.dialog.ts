// Angular
import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef, Inject, ViewChild, ViewRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, BehaviorSubject, Subject } from 'rxjs';
import { SourceService } from 'src/app/pages/common/source.service';

@Component({
	selector: 'app-source-root-edit-dialog',
	templateUrl: './source-root-edit.dialog.html',
	styleUrls: ['./source-root-edit.dialog.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SourceRootEditDialog implements OnInit, OnDestroy {

	locale = 'it-IT';

	loadingSubject = new BehaviorSubject<boolean>(false);
	loading$: Observable<boolean>;

	source: any = {};


	private unsubscribe: Subscription[] = [];

	constructor(
		private cdr: ChangeDetectorRef,
		private translate: TranslateService,
		public modal: NgbActiveModal,
		private sourceService: SourceService,
		) { }

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

	async onYesClick() {
		this.loadingSubject.next(true);
		try {
			const res = await this.sourceService.update({
				_id: this.source._id,
				description: this.source.description,
				note: this.source.note,
				logo: this.source.logo,
				background: this.source.background,
				domain: this.source.domain,
				name: this.source.name
			});
		} catch (error) {

		}
		this.loadingSubject.next(false);
		this.modal.close();
	}
	async backgroundInputChanged(event){
		this.loadingSubject.next(true);
		try {
			if (event.target.files && event.target.files[0]){
				const formData = new FormData();
				formData.append('file', event.target.files[0],this.source._id + `/${new Date().getTime()}_background.jpg`);
				const res = await this.sourceService.uploadPicture(formData);
				if (res) {
					this.source.background = res.result;
					this.cdr.detectChanges();
				}
			}
		} catch (error) {

		}
		this.loadingSubject.next(false);
  	}
	async logoInputChanged(event){
		this.loadingSubject.next(true);
		try {
			if (event.target.files && event.target.files[0]){
				const formData = new FormData();
				formData.append('file', event.target.files[0],this.source._id + `/${new Date().getTime()}_logo.jpg`);
				const res = await this.sourceService.uploadPicture(formData);
				if (res) {
					this.source.logo = res.result;
					this.cdr.detectChanges();
				}
			}
		} catch (error) {

		}
		this.loadingSubject.next(false);
  	}
}
