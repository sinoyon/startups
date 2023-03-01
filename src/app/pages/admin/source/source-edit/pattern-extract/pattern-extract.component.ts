import { Component, OnInit,  OnDestroy, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';

@Component({
	selector: 'app-pattern-extract-component',
	templateUrl: './pattern-extract.component.html',
	styleUrls: ['./pattern-extract.component.scss'],
	// changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatternExtractComponent implements OnInit, OnDestroy {

	locale = 'it-IT';
    private unsubscribe: Subscription[] = [];

	@Input() config: any;
	@Input('loader') loading$: Observable<boolean>;
    @Input() output: any;
    @Input() data: any;
    @Input() type: string;
    @Input() title: string;
    @Input() result: any = null;
    @Input() key = '';
	@Input() hideType;
	@Input() showLength;
	@Input() showAuto;
    @Output() extract = new EventEmitter<any>();
	constructor(
	) {
	}

	ngOnInit() {
	}

	ngOnDestroy() {
		this.unsubscribe.forEach(el => el.unsubscribe());
	}
    onExtract() {
        this.extract.emit({ config: this.config, data: this.data, key: this.key, output: this.output});
    }
}
