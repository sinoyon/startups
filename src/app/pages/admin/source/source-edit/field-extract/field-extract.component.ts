// Angular
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Observable, Subscription, BehaviorSubject } from 'rxjs';
import { each } from 'lodash';
import { ToastService } from 'src/app/pages/common/toast.service';

@Component({
	selector: 'app-field-extract-component',
	templateUrl: './field-extract.component.html',
	styleUrls: ['./field-extract.component.scss'],
	// changeDetection: ChangeDetectionStrategy.OnPush
})
export class FieldExtractComponent implements OnInit, OnDestroy {

	locale = 'it-IT';
    private unsubscribe: Subscription[] = [];

	@Input() config: any;
	@Input('loader') loading$: Observable<boolean>;
	@Input() status: any = null;
	@Input() statuses: any[] = [];
	@Input() typology: any = null;
	@Input() typologies: any[] = [];
	@Input() languages: any[] = [];
	@Input() defaultLanguage;
	@Input() data: any;
	@Input() dynamicConfig: any;
	@Input() type: string;
	@Input() title: string;
	@Input() result: any = null;
	@Input() key: string;
	@Input() mainCollectionType: string;
	@Input() detailCollectionType: string;
	@Input() hideFrom = false;
	@Input() hideLink = false;
	@Output() extract = new EventEmitter<any>();

	@Output('next') nextEvent = new EventEmitter<any>();
	@Output('prev') prevEvent = new EventEmitter<any>();

	@Input() fields: any[] = [];

	activeField;
	activeLanguage;

	constructor(
    private toastService: ToastService
		) {

	}

	ngOnInit() {
		this.activeField = this.fields[0];
		this.activeLanguage = this.defaultLanguage;
	}

	init() {
		const formulaFields = [];
		const combineFields = [];
		each(this.fields, f => {
			const config = this.getConfig(f);
			if (config)  {
				if (config.from == 'formula') {
					formulaFields.push( {key: f.key, config});
				} else if (config.from == 'combine') {
					combineFields.push( {key: f.key, config});
				} else {
					this.extract.emit({ config, status: this.status, typology: this.typology, key: f.key});
				}
			}
		});
		each(formulaFields, el => {
			this.extract.emit({ config: el.config, status: this.status, typology: this.typology, key: el.key});
		});
		each(combineFields, el => {
			this.extract.emit({ config: el.config, status: this.status, typology: this.typology, key: el.key});
		});
	}
	ngOnDestroy() {
		this.unsubscribe.forEach(el => el.unsubscribe());
	}

    onExtract() {
		const config = this.getConfig();
		if (config)  {
			this.extract.emit({ config, status: this.status, typology: this.typology ,key: this.activeField.key});
		}
	}
	getConfig(param = null) {
		const field = param || this.activeField;
		let resultConfig;
		try {
			if (this.status && this.status.key && !this.status.disabled && this.typology && this.typology.key && !this.typology.disabled
				&& field && field.key && this.config) {
				if (this.config[field.key]) {
					const config = this.config[field.key].find(el => el.status == this.status.key && el.typology == this.typology.key);
					if (config) {
						// setTimeout(() => {
						// 	if (!config.result) {
						// 		this.extract.emit({ loader: this.loadingSubject , config: config, status: this.status});
						// 	}
						// },0)

						resultConfig = config;
						// throw {};
					} else {

						const em_config = this.config[field.key].find( el => el.typology == null && el.status == this.status.key);
						if (em_config) {
							const count = this.config[field.key].push({
								...em_config,
								typology: this.typology.key,
								status: this.status.key
							});
							resultConfig = this.config[field.key][count - 1];
							// throw {};
						} else {
							const count = this.config[field.key].push({
								typology: this.typology.key,
								status: this.status.key,
								type: 'text',
								from: 'main',
								patternWithLanguage: []
							});
							resultConfig = this.config[field.key][count - 1];
							// throw {};
						}
					}
				} else {
					this.config[field.key]= [{
						status: this.status.key,
						typology: this.typology.key,
						type: 'text',
						from: 'main',
						patternWithLanguage: []
					}];
					resultConfig = this.config[field.key][0];
				}
			}
		} catch (error) {
			console.log(error);
		}
		if (field.withLanguage && resultConfig) {
			resultConfig.patternWithLanguage = resultConfig.patternWithLanguage || [];
			this.languages.forEach ( lng => {
				if (!resultConfig.patternWithLanguage.find( el => el.language == lng.key)) {
					resultConfig.patternWithLanguage.push({
						language: lng.key,
					});
				}
			});
			resultConfig.patternWithLanguage = resultConfig.patternWithLanguage.filter( el => this.languages.find(lng => lng.key == el.language));
		}
		return resultConfig;
	}
	getAvailableCopyStatuses(param = null) {
		const field = param || this.activeField;
		try {
			if (this.status && this.status.key && !this.status.disabled &&
				this.typology && this.typology.key && !this.typology.disabled && this.statuses && this.statuses.length) {
				const result = this.statuses.filter(status =>  {
					const config = this.config[field.key].find(el => el.status == status.key && el.typology == this.typology.key);
					return status.key != this.status.key && !status.disabled && config && ((config.from == 'formula' && config.formula) || (config.from != 'formula' && config.pattern) || config.auto);
				});
				return result;
			}
		} catch (error) {
			console.log(error);
		}
		return [];
	}
	getAvailableCopyTypologies(param = null) {
		const field = param || this.activeField;
		try {
			if (this.status && this.status.key && !this.status.disabled &&
				this.typology && this.typology.key && !this.typology.disabled && this.typologies && this.typologies.length) {
				const result = this.typologies.filter(typology =>  {
					const config = this.config[field.key].find(el => el.status == this.status.key && el.typology == typology.key);
					return typology.key != this.typology.key && !typology.disabled && config && ((config.from == 'formula' && config.formula) || (config.from != 'formula' && config.pattern) || config.auto);
				});
				return result;
			}
		} catch (error) {
			console.log(error);
		}
		return [];
	}
	getFieldStatus(field) {
		try {
			if (this.status && this.status.key && !this.status.disabled &&
				this.typology && this.typology.key && !this.typology.disabled
				&& field && field.key
				&& this.config && this.config[field.key]) {
				const config = this.config[field.key].find(el => el.status == this.status.key && el.typology == this.typology.key);
				if (config) {
					if (config.result == null || (Array.isArray(config.result) && config.result.length == 0)) {
						if ((config.from == 'main' || config.from == 'detail') && config.pattern && config.pattern.trim() != '') {return 'warning';}
						if (config.from == 'formula' && config.formula && config.formula.trim() != '') {return 'warning';}
						if (config.from == 'combine' && config.combine && config.combine.trim() != '') {return 'warning';}
						throw {};
					}
					return 'success';
				}
			}
		} catch (error) {
		}
		return null;
	}
	onClickField(param) {
		this.activeField = param;
	}
	onCopyFrom(param, fromType = 'status'){
		if (fromType == 'status') {
			if (param && this.status && this.status.key && !this.status.disabled  && this.typology && this.typology.key && !this.typology.disabled) {
				const fromConfig = this.config[this.activeField.key].find(el => el.status == param.key && el.typology == this.typology.key);
				let toConfig = this.config[this.activeField.key].find(el => el.status == this.status.key && el.typology == this.typology.key);

				if (fromConfig && toConfig) {
					each(fromConfig, (value, key) => {
						toConfig[key]=fromConfig[key];
					});
					toConfig.status = this.status.key;
				} else if (fromConfig){
					const count = this.config[this.activeField.key].push({
						...fromConfig,
						status: this.status.key,
						result: null
					});
					toConfig = this.config[this.activeField.key][count -1];
				}
				this.extract.emit({ config: toConfig, status: this.status , typology: this.typology, key: this.activeField.key});
			}
		} else if (fromType == 'typology') {
			if (param && this.status && this.status.key && !this.status.disabled  && this.typology && this.typology.key && !this.typology.disabled) {
				const fromConfig = this.config[this.activeField.key].find(el => el.status == this.status.key && el.typology == param.key);
				let toConfig = this.config[this.activeField.key].find(el => el.status == this.status.key && el.typology == this.typology.key);

				if (fromConfig && toConfig) {
					each(fromConfig, (value, key) => {
						toConfig[key]=fromConfig[key];
					});
					toConfig.typology = this.typology.key;
				} else if (fromConfig){
					const count = this.config[this.activeField.key].push({
						...fromConfig,
						typology: this.typology.key,
						result: null
					});
					toConfig = this.config[this.activeField.key][count -1];
				}
				this.extract.emit({ config: toConfig, status: this.status , typology: this.typology, key: this.activeField.key});
			}
		}


	}
	addCommas(nStr) {
		if (nStr == null) {
			return '';
		}
		nStr += '';
		const comma = /,/g;
		nStr = nStr.replace(comma,'');
		const x = nStr.split('.');
		let x1 = x[0];
		const x2 = x.length > 1 ? '.' + x[1] : '';
		const rgx = /(\d+)(\d{3})/;
		while (rgx.test(x1)) {
		  x1 = x1.replace(rgx, '$1' + ',' + '$2');
		}
		return (x1 + x2).replace(/,/g, ';').replace(/\./g, ',').replace(/;/g, '.');
	}
	getDateTimeFromDate(param): string {
		const date = new Date(param);
		return date.toLocaleString(this.locale, {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		}).replace(', ', ', h:');
	}
  onClickCopy(value) {

    const el = document.createElement('textarea');
    el.value =  value;
    document.body.appendChild(el);
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (iOS){
      const range = document.createRange();
      range.selectNodeContents(el);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      el.setSelectionRange(0, 999999);
    } else {
      el.select();
    }
    document.execCommand('copy');
    document.body.removeChild(el);
    this.toastService.show('result copied to clipboard');
  }
}
