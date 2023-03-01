// Angular
import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef, Inject, ViewChild, ViewRef } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, BehaviorSubject, Subject } from 'rxjs';


@Component({
	selector: 'app-invest-amount-dialog',
	templateUrl: './invest-amount.dialog.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvestAmountDialog implements OnInit, OnDestroy {

	investmentType = 'amountInvested';
	amount = 100;
	private unsubscribe: Subscription[] = [];

	constructor(
		private translate: TranslateService,
		public modalActive: NgbActiveModal,
		private modal: NgbModal
		) { }

	ngOnInit() {
	}

	ngOnDestroy() {
		this.unsubscribe.forEach(el => el.unsubscribe());
	}

	onYesClick() {
		if (typeof this.amount == 'number') {
			this.modalActive.close(this.amount);
		} else {
			const ns: string = this.amount;
			const n = parseFloat(ns.replace(',', '.'));
			this.modalActive.close(n);
		}
	}
	onChangeInvestType(e) {
		if (this.investmentType == 'equityOwned') {
			if (typeof this.amount == 'number') {
				if (this.amount > 100) {
					this.amount = 100;
				}
			} else {
				const ns: string = this.amount;
				const n = parseFloat(ns.replace(',', '.'));
				if (n > 100) {
					this.amount = 100;
				}
			}
		}
	}
	preventInput(event) {
		if (this.investmentType == 'equityOwned') {
			if (typeof this.amount == 'number') {
				if (this.amount > 100) {
					event.preventDefault();
					this.amount = 100;
				}
			} else {
				const ns: string = this.amount;
				const n = parseFloat(ns.replace(',', '.'));
				if (n > 100) {
					event.preventDefault();
					this.amount = 100;
				}
			}
		}
	}
}
