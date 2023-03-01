// Angular
import { Component, OnInit, OnDestroy, Output, EventEmitter, Input } from '@angular/core';
import { each } from 'lodash';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { decode } from 'html-entities';
import { HtmlViewerDialog } from '../html-viewer/html-viewer.dialog';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
	selector: 'app-pre-select-component',
	templateUrl: './pre-select.component.html',
	styleUrls: ['./pre-select.component.scss'],
	// changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreSelectComponent implements OnInit, OnDestroy {

	locale = 'it-IT';
    private unsubscribe: Subscription[] = [];

	@Input() configs: any = [];
	@Input('loader') loading$: Observable<boolean>;
	@Input() typology: any = null;
	@Input() typologies: any[] = [];
	@Input() status: any = null;
	@Input() statuses: any[] = [];
	@Input() languages: any[] = [];
	@Input() defaultLanguage;
  @Input() data: any;
  @Input() type: string;
  @Input() result: any = null;
  @Input() key: string;
	@Output() extract = new EventEmitter<any>();
	@Output() extractLink = new EventEmitter<any>();

	tabs: any[] = [
		{ key: 'status', title: 'Status', key_matched: 'statusMatched'},
		{ key: 'typology', title: 'Typology', key_matched: 'typologyMatched'}
	];
	activeTab;

	constructor(private modal: NgbModal) {
	}

	ngOnInit() {
		this.activeTab = this.tabs[0];
	}

	ngOnDestroy() {
		this.unsubscribe.forEach(el => el.unsubscribe());
	}

	init() {
		each(this.statuses, status => {
			each(this.typologies, typology => {
				const config = this.getConfig(status, typology);
				if (config)  {
					this.extract.emit({ config, typology, status, withContent: config.detailContent == null});
				}
			});
		});

	}

	onExtract() {
		const config = this.getConfig();
		if (config)  {
			this.extract.emit({ config, withContent: true, output: config, typology: this.typology, status: this.status});
		}
	}
	onNextExtract() {
		const config = this.getConfig();
		if (config)  {
			config.matchedIndex = config.matchedIndex || 0;
			if (config.matchedIndex < config.matchedCount - 1 ) {
				config.matchedIndex ++;
			}
			this.extract.emit({ config, withContent: true, output: config, typology: this.typology, status: this.status});
		}
	}
	onPrevExtract() {
		const config = this.getConfig();
		if (config)  {
			config.matchedIndex = config.matchedIndex || 0;
			if (config.matchedIndex > 0) {
				config.matchedIndex --;
			}
			this.extract.emit({ config, withContent: true, output: config, typology: this.typology, status: this.status});
		}
	}
	onExtractLink() {
		const config = this.getConfig();
		if (config)  {
			this.extractLink.emit({ output: config});
		}
	}
	getConfig(in_status = null, in_typology = null) {
		const typology = in_typology || this.typology;
		const status = in_status || this.status;
		try {
			if (this.configs && status && status.key && !status.disabled && typology && typology.key && !typology.disabled) {
				const config = this.configs.find( el => el.typology == typology.key && el.status == status.key);
				if (config) {
					if (!config.match) {
						config.match = 'eq';
					}
					config.type = 'text';
					config.type_typology = 'text';
					return config;
				} else {
					const em_config = this.configs.find( el => el.typology == null && el.status == status.key);
					if (em_config) {
						const count = this.configs.push({
							...em_config,
							typology: typology.key,
							status: status.key,
							match: 'eq'
						});
						this.configs[count - 1].type = 'text';
						this.configs[count - 1].type_typology = 'text';
						return this.configs[count - 1];
					} else {
						const count = this.configs.push({
							typology: typology.key,
							status: status.key,
							match: 'eq'
						});
						this.configs[count - 1].type = 'text';
						this.configs[count - 1].type_typology = 'text';
						return this.configs[count - 1];
					}

				}
			}
		} catch (error) {
			console.log(error);
		}

		return null;
	}
	onCopyFrom(param, fromType = 'status'){
		if (fromType == 'case') {
			if (param && this.status && this.status.key && this.typology && this.typology.key && !this.typology.disabled) {
				const fromConfig = this.configs.find(el => el.status == param.key && el.typology == this.typology.key);
				let toConfig = this.configs.find(el => el.typology == this.typology.key && el.status == this.status.key);
				if (fromConfig && toConfig) {
					if (this.activeTab && this.activeTab.key == 'status') {
						['pattern', 'match', 'value', 'type'].forEach ( key => {
							toConfig[key]=fromConfig[key];
						});
					} else if (this.activeTab && this.activeTab.key == 'typology') {
						['pattern_typology', 'match_typology', 'value_typology', 'type_typology'].forEach ( key => {
							toConfig[key]=fromConfig[key];
						});
					}
				} else if (fromConfig) {
					const count = this.configs.push({
						...fromConfig,
						status: this.status.key,
						mainContent: null,
						detailContent: null
					});
					toConfig = this.configs[count -1];
				}
				this.extract.emit({  config: toConfig, withContent: true, output: toConfig, typology: this.typology, status: this.status});
			}
		} else if (fromType == 'status') {
			if (param && this.status && this.status.key && this.typology && this.typology.key && !this.typology.disabled) {
				const fromConfig = this.configs.find(el => el.status == param.key && el.typology == this.typology.key);
				let toConfig = this.configs.find(el => el.typology == this.typology.key && el.status == this.status.key);
				if (fromConfig && toConfig) {
					if (this.activeTab && this.activeTab.key == 'status') {
						['pattern', 'match', 'value', 'type', 'patternSecond', 'typeSecond', 'valueSecond', 'matchSecond', 'hasSecond',
            'isAndSecond', 'patternThird', 'typeThird', 'valueThird', 'matchThird', 'hasThird', 'isAndThird'].forEach ( key => {
							toConfig[key]=fromConfig[key];
						});
					} else if (this.activeTab && this.activeTab.key == 'typology') {
						['pattern_typology', 'match_typology', 'value_typology', 'type_typology', 'patternSecond_typology', 'typeSecond_typology',
            'valueSecond_typology', 'matchSecond_typology', 'hasSecond_typology', 'isAndSecond_typology', 'patternThird_typology',
            'typeThird_typology', 'valueThird_typology', 'matchThird_typology', 'hasThird_typology', 'isAndThird_typology'].forEach ( key => {
							toConfig[key]=fromConfig[key];
						});
					}
				} else if (fromConfig) {
					const count = this.configs.push({
						...fromConfig,
						status: this.status.key,
						mainContent: null,
						detailContent: null
					});
					toConfig = this.configs[count -1];
				}
				this.extract.emit({  config: toConfig, withContent: true, output: toConfig, typology: this.typology, status: this.status});
			}
		} else if (fromType == 'typology') {
			if (param && this.status && this.status.key && this.typology && this.typology.key && !this.typology.disabled) {
				const fromConfig = this.configs.find(el => el.typology == param.key && el.status == this.status.key);
				let toConfig = this.configs.find(el => el.typology == this.typology.key && el.status == this.status.key);
				if (fromConfig && toConfig) {
					if (this.activeTab && this.activeTab.key == 'status') {
						['pattern', 'match', 'value', 'type', 'patternSecond', 'typeSecond', 'valueSecond', 'matchSecond', 'hasSecond',
            'isAndSecond', 'patternThird', 'typeThird', 'valueThird', 'matchThird', 'hasThird', 'isAndThird'].forEach ( key => {
							toConfig[key]=fromConfig[key];
						});
					} else if (this.activeTab && this.activeTab.key == 'typology') {
						['pattern_typology', 'match_typology', 'value_typology', 'type_typology', 'patternSecond_typology', 'typeSecond_typology',
            'valueSecond_typology', 'matchSecond_typology', 'hasSecond_typology', 'isAndSecond_typology', 'patternThird_typology',
            'typeThird_typology', 'valueThird_typology', 'matchThird_typology', 'hasThird_typology', 'isAndThird_typology'].forEach ( key => {
							toConfig[key]=fromConfig[key];
						});
					}
				} else if (fromConfig) {
					const count = this.configs.push({
						...fromConfig,
						typology: this.typology.key,
						mainContent: null,
						detailContent: null
					});
					toConfig = this.configs[count -1];
				}
				this.extract.emit({  config: toConfig, withContent: true, output: toConfig, typology: this.typology, status: this.status});
			}
		}

	}
	getAvailableCopyStatuses() {
		try {
			if (this.status && this.status.key && !this.status.disabled &&
				this.typology && this.typology.key && !this.typology.disabled && this.statuses && this.statuses.length) {
				const result = this.statuses.filter( status =>  {
					const config = this.configs.find(el => el.typology == this.typology.key && el.status == status.key);
					return status.key != this.status.key && !status.disabled && config && config.pattern;
				});
				return result;
			}
		} catch (error) {
			console.log(error);
		}
		return [];
	}
  getAvailableCopyCases() {
		try {
			if (this.status && this.status.key && !this.status.disabled &&
				this.typology && this.typology.key && !this.typology.disabled && this.statuses && this.statuses.length) {
				const result = this.statuses.filter( status =>  {
					const config = this.configs.find(el => el.typology == this.typology.key && el.status == status.key);
					return status.key != this.status.key && !status.disabled && config && config.pattern;
				});
				return result;
			}
		} catch (error) {
			console.log(error);
		}
		return [];
	}
	getAvailableCopyTypologies() {
		try {
			if (this.status && this.status.key && !this.status.disabled &&
				this.typology && this.typology.key && !this.typology.disabled && this.statuses && this.statuses.length) {
				const result = this.typologies.filter( typology =>  {
					const config = this.configs.find(el => el.typology == typology.key && el.status == this.status.key);
					return typology.key != this.typology.key && !typology.disabled && config && config.pattern;
				});
				return result;
			}
		} catch (error) {
			console.log(error);
		}
		return [];
	}
	onClickTab(param) {
		this.activeTab = param;
	}

	decodeHtml(content) {
		return decode(content);
	}
	onShowHtml(param) {
		const modalRef = this.modal.open(HtmlViewerDialog, { animation: false, size: 'xl'});
		modalRef.componentInstance.load(param);
	}
}
