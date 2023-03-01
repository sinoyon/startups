import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef,  Input, Output, EventEmitter } from '@angular/core';
import { Observable, Subscription, BehaviorSubject } from 'rxjs';
import { each } from 'lodash';

@Component({
	selector: 'app-company-field-extract-component',
	templateUrl: './company-field-extract.component.html',
	styleUrls: ['./company-field-extract.component.scss'],
	// changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanyFieldExtractComponent implements OnInit, OnDestroy {

	locale = 'it-IT';
    private unsubscribe: Subscription[] = [];

	@Input() config: any;
	@Input('loader') loading$: Observable<boolean>;
	@Input() parent: any;
    @Input() data: any;
    @Input() type: string;
    @Input() title: string;
    @Input() result: any = null;
    @Input() key: string;
	@Output() extract = new EventEmitter<any>();
	@Output() extractCampaigns = new EventEmitter<any>();

	@Input() fields: any[] = [];

	multiSelectSettings = {};

	activeField;

	constructor(
	) {
	}

	ngOnInit() {
		this.activeField = this.fields[0];
		this.multiSelectSettings = {
			singleSelection: false,
			idField: 'key',
			textField: 'title',
			selectAllText: 'Select All',
			enableCheckAll: false,
			unSelectAllText: 'UnSelect All',
			itemsShowLimit: 3,
			allowSearchFilter: false
		};
	}

	init() {
		each(this.fields, f => {
			const config = this.getConfig(f);
			if (config)  {
				this.extract.emit({ config, key: f.key});
				if(f.key == 'campaigns' && !config.detailContent) {
					this.extractCampaigns.emit({ config: this.config.campaigns, key: this.activeField.key, output: this.config.campaigns});
				}
			}
		});

	}
	ngOnDestroy() {
		this.unsubscribe.forEach(el => el.unsubscribe());
	}

    onExtract() {
		const config = this.getConfig();
		if (config)  {
			this.extract.emit({ config, key: this.activeField.key});
		}
	}
	onExtractCampaign() {
		if (this.config.campaigns)  {
			this.extractCampaigns.emit({ config: this.config.campaigns, key: this.activeField.key, output: this.config.campaigns});
		}
	}
	getConfig(param = null) {
		const field = param || this.activeField;
		try {
			if (field && field.key && this.config) {
				if (this.config[field.key]) {
					return this.config[field.key];
				} else {
					this.config[field.key]= {
						type: 'text',
						from: 'main'
					};
					return this.config[field.key];
				}
			}
		} catch (error) {
			console.log(error);
		}
		return null;
	}
	getFieldStatus(field) {
		try {
			if (field && field.key
				&& this.config && this.config[field.key]) {
				return this.config[field.key] && this.config[field.key].result;
			}
		} catch (error) {
		}
		return null;
	}
	onClickField(param) {
		if (param.disabled) {return;}
		this.activeField = param;
	}
	onSelectCampaignStatus(e) {
		if (parent) {
			this.parent.onSelectCampaignStatus();
		}
	}
	onSelectCampaignTypology(e) {
		if (parent) {
			this.parent.onSelectCampaignTypology();
		}
	}
}

