// Angular
import { Component, OnInit, OnDestroy, ViewChild, Input, ViewRef, ChangeDetectorRef } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import * as htmlDecoder from 'jquery';
import { HtmlViewerDialog } from '../html-viewer/html-viewer.dialog';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { cloneDeep, each, union } from 'lodash';
import * as objectPath from 'object-path';
import { deepParseJson } from 'deep-parse-json';
import { str2date, str2number } from 'src/app/pages/common/common';
import  {Parser} from 'expr-eval';
import * as moment from 'moment';
import { SourceService } from 'src/app/pages/common/source.service';

@Component({
	selector: 'app-config-component',
	templateUrl: './config.component.html',
	styleUrls: ['./config.component.scss'],
	// changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfigComponent implements OnInit, OnDestroy {

	loading$: Observable<boolean>;
	activeTab;
	tabs: any[] = [
		{key: 'main', title: 'Api configuration', tooltip: 'Back to api config'},
		{key: 'company', title: 'Company configuration', tooltip: 'Go to company extraction'},
		{key: 'campaign', title: 'Campaign configuration', tooltip: 'Go to campaign extraction'}
	];
	activeStatus;
	statuses: any[] = [
		{key: '1_ongoing', title: 'on going'},
		{key: '2_comingsoon', title: 'coming soon'},
		{key: '4_closed', title: 'closed not funded'},
		{key: '3_funded', title: 'closed funded'},
		{key: '5_extra', title: 'closing'},
		{key: '6_refunded', title: 'refunded'},
	];
	activeTypology;
	typologies: any[] = [
		{key: 'company equity', title: 'company equity'},
		{key: 'company lending', title: 'company lending'},
		{key: 'real estate equity', title: 'real estate equity'},
		{key: 'real estate lending', title: 'real estate lending'},
		{key: 'minibond', title: 'minibond'}
	];

	countries: any[] = [
		{key: 'italy', title: 'Italy'},
		{key: 'spain', title: 'Spain'},
    {key: 'france', title: 'France'}
	];
	languages: any[] = [
		{key: 'it', title: 'Italian'},
		{key: 'es', title: 'Spainish'},
		{key: 'fr', title: 'French'},
		{key: 'de', title: 'Germany'},
		{key: 'en', title: 'English'}
	];

	campaignFields: any[] = [
		{key: 'link', title: 'Link', type: 'url'},
		{key: 'name', title: 'Name', withLanguage: true},
		{key: 'logo', title: 'Logo image', type: 'url'},
		{key: 'background', title: 'Background image', type: 'url'},
		{key: 'description', title: 'Short description', withLanguage: true},
		{key: 'videoUrl', title: 'Video URL', type: 'url'},
		{key: 'raised', title: 'Raised money', type: 'number', statuses_n: ['2_comingsoon']},
		{key: 'minimumGoal', title: 'Goal minimum', type: 'number'},
		{key: 'maximumGoal', title: 'Goal maximum', type: 'number'},
		{key: 'preMoneyEvaluation', title: 'Pre money evaluation', type: 'number', suggestion: 'minimumGoal * (100 / equity - 1)<br>maximumGoal * (100 / equityMax - 1)'},
		{key: 'minimumInvestment', title: 'Minimum investment', type: 'number'},
		{key: 'investorCount', title: 'Number of investors', type: 'number', statuses_n: ['2_comingsoon']},
		{key: 'endDate', title: 'End date', type: 'date'},
		{key: 'startDate', title: 'Start date', type: 'date'},
		{key: 'equity', title: 'Equity minimum', type: 'number', suggestion: 'minimumGoal / (preMoneyEvaluation + minimumGoal) * 100', typologies: ['company equity', 'company lending']},
		{key: 'equityMax', title: 'Equity maximum', type: 'number',  typologies: ['company equity', 'company lending']},
		{key: 'tags', title: 'Tags', withLanguage: true},
		{key: 'socials', title: 'Socials'},
		{key: 'address', title: 'Real estate address', typologies: ['real estate equity', 'real estate lending'], type: 'address'},
		{key: 'city', title: 'Real estate city', typologies: ['real estate equity', 'real estate lending']},
		{key: 'roi', title: 'ROI', typologies: ['real estate equity', 'real estate lending', 'company lending', 'minibond'], type: 'number',
		suggestion: 'roiAnnual / 12 * holdingTime'},
		{key: 'roiAnnual', title: 'ROI Annuo', typologies: ['real estate equity', 'real estate lending', 'company lending', 'minibond'], suggestion: 'roi / holdingTime * 12', type: 'number'},
		{key: 'holdingTime', title: 'Holding time', type: 'month', typologies: ['real estate equity', 'real estate lending', 'company lending', 'minibond']},
		{key: 'pictures', title: 'House pictures', typologies: ['real estate equity', 'real estate lending'] ,type: 'url'},
		{key: 'totalSurface', title: 'Total surface',type: 'number', typologies: ['real estate equity', 'real estate lending']},
		{key: 'companyName', title: 'Company name'},
		{key: 'companyFiscalCode', title: 'Company fiscal code', type: 'code'},
		{key: 'companyType', title: 'Company type'},
		{key: 'companyWebPageLink', title: 'Company web page', type: 'url'},
		{key: 'companyContactEmail', title: 'Company contact email', type: 'url'},
		{key: 'companyPhysicalLocation', title: 'Company location'},
	];
	companyFields: any[] = [
		{key: 'name', title: 'Name'},
		{key: 'fiscalCode', title: 'Fiscal Code'},
		{key: 'webPageLink', title: 'Web Page Link', type: 'url'},
		{key: 'physicalLocation', title: 'Location'},
		// {key: 'foundedDate', title: 'Found Date', type: 'date', disabled: true},
		// {key: 'contactEmail', title: 'Contact Email', type: 'url', disabled: true},
		// {key: 'type', title: 'Type', disabled: true},
		// {key: 'tags', title: 'Tags', disabled: true},
		// {key: 'socials', title: 'Socials', disabled: true},
		{key: 'campaigns', title: 'Campaign URL', type: 'url', hidden: true}
	];

	selectedCampaignStatuses = [];
	selectedCampaignTypologies = [];
	selectedCountries = [];
	selectedLanguages = [];

	multiSelectSettings = {
		singleSelection: false,
		idField: 'key',
		textField: 'title',
		selectAllText: 'Select All',
		enableCheckAll: false,
		unSelectAllText: 'UnSelect All',
		itemsShowLimit: 3,
		allowSearchFilter: false
	};

	@Input() config: any = {};
	@Input('loader') loadingSubject;

	@ViewChild('fieldExtractor', {static: false}) fieldExtractor;
	@ViewChild('companyFieldExtractor', {static: false}) companyFieldExtractor;
	@ViewChild('preSelectExtractor', {static: false}) preSelectExtractor;

    private unsubscribe: Subscription[] = [];

	constructor(private modal: NgbModal,
		private cdr: ChangeDetectorRef,
		private configService: SourceService) {
	}

	ngOnInit() {
		this.activeTab = this.tabs[0];
		this.loading$ = this.loadingSubject.asObservable();
	}

	ngOnDestroy() {
		this.unsubscribe.forEach(el => el.unsubscribe());
	}


	async init(param) {

		this.activeTab = this.tabs[0];

		this.selectedCampaignStatuses = this.config.involvedCampaignStatuses.map( st => this.statuses.find( e => e.key == st)).filter( el => el);
		this.statuses.forEach( el => {
			el.disabled = !this.config.involvedCampaignStatuses.includes(el.key);
		});
		this.selectedCampaignTypologies = this.config.involvedCampaignTypologies.map( st => this.typologies.find( e => e.key == st)).filter( el => el);
		this.typologies.forEach( el => {
			el.disabled = !this.config.involvedCampaignTypologies.includes(el.key);
		});
		this.selectedCountries = this.config.involvedCampaignCountries.map( st => this.countries.find( e => e.key == st)).filter( el => el);
		this.countries.forEach( el => {
			el.disabled = !this.config.involvedCampaignCountries.includes(el.key);
		});

		this.selectedLanguages = this.config.involvedCampaignLanguages.map( st => this.languages.find( e => e.key == st)).filter( el => el);
		this.countries.forEach( el => {
			el.disabled = !this.config.involvedCampaignLanguages.includes(el.key);
		});

		if (this.config.involvedCampaignTypologies && this.config.involvedCampaignTypologies.length == 1) {
			this.config.campaignStatusConfigs.forEach( el => {
				el.isDefaultTypology = true;
			});
		}

		this.activeTypology = this.typologies.find( el => !el.disabled);
		this.activeStatus = this.statuses.find( el => !el.disabled);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}

		if (!param) {return;}

		try {

			// await this.onLoadMain();
			// await this.onExtractDetailPage({ output: this.config.loadDetailConfig, data: this.config.loadMainConfig.result, withContent: this.config.type == 'company'});

		} catch (error) {

		}

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
	async onLoadMain() {

		this.loadingSubject.next(true);
		try {
			let res;
			res = await this.configService.extractMainContentFromServer({
				...this.config.loadMainConfig,
				result: undefined
			});
			if (!res) {throw {};}

			this.config.loadMainConfig.result = res;

		} catch (error) {
			this.config.loadMainConfig.result = [];
		}
		this.loadingSubject.next(false);
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	onConfigTypeChanged() {
		if (this.config.type == 'campaign') {
			if (!this.config.campaignFieldConfig) {
				this.config.campaignFieldConfig = {};
			}
		} else if (this.config.type == 'company') {
			if (!this.config.companyFieldConfig) {
				this.config.companyFieldConfig = {};
			}
		}
	}

	onSelectCampaignStatus(e) {
		setTimeout(() => {
			this.config.involvedCampaignStatuses = this.selectedCampaignStatuses.map( el => el.key);
			this.statuses.forEach( el => {
				el.disabled = !this.config.involvedCampaignStatuses.includes(el.key);
			});
		}, 0);
	}
	onSelectCampaignTypology(e) {
		setTimeout(() => {
			this.config.involvedCampaignTypologies = this.selectedCampaignTypologies.map( el => el.key);
			this.typologies.forEach( el => {
				el.disabled = !this.config.involvedCampaignTypologies.includes(el.key);
			});
		}, 0);
	}
	onSelectCountry(e) {
		setTimeout(() => {
			this.config.involvedCampaignCountries = this.selectedCountries.map( el => el.key);
			this.countries.forEach( el => {
				el.disabled = !this.config.involvedCampaignCountries.includes(el.key);
			});
		}, 0);
	}
	onSelectLanguage(e) {
		setTimeout(() => {
			this.config.involvedCampaignLanguages = this.selectedLanguages.map( el => el.key);
			this.languages.forEach( el => {
				el.disabled = !this.config.involvedCampaignLanguages.includes(el.key);
			});
			this.config.defaultLanguage = this.config.defaultLanguage || this.selectedLanguages[0];
		}, 0);
	}

	onClickStatus(param) {
		this.activeStatus = param;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
		setTimeout(() => {
			if (this.fieldExtractor) {
				this.fieldExtractor.init();
			}
		}, 0);
	}
	onClickTypology(param) {
		this.activeTypology = param;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
		setTimeout(() => {
			if (this.fieldExtractor) {
				this.fieldExtractor.init();
			}
		}, 0);
	}
	async onExtractStatus(param) {
		this.loadingSubject.next(true);
		try {
			if (!this.config.campaignStatusConfigs) {throw {error: 'no config campaignStatusConfigs'};}
			if (!param.status || !param.status.key || !param.typology || !param.typology.key ) {throw {error: 'no status or typology pattern'};}

			const config = this.config.campaignStatusConfigs.find( el => el.status == param.status.key && el.typology == param.typology.key);

			if (!config) {throw {error: 'no config'};}
			config.typologyMatched = config.isDefaultTypology;

			if (!config.pattern) {throw {error: 'no config pattern'};}

			let data;
			if (this.config.type) {
				data = objectPath.get(this.config, 'loadMainConfig.result');
				config.mainContent = null;
				config.statusMatched = false;
				config.typologyMatched = false;
				config.matchedCount = 0;
				config.matchedIndex = config.matchedIndex || 0;
				if (data) {
					try {
						each(data, (el, index) => {
							let statusMatched = false;
							let value;
							if (this.config.loadMainConfig.resultCollectionType == 'pattern' || this.config.loadMainConfig.method == 'dynamic'){
								value = this._extractFromPattern(el, config);
							} else if (this.config.loadMainConfig.resultCollectionType == 'path') {
								value = objectPath.get(deepParseJson(el), config.pattern).toString();
							} else {throw {};}

							if (!config.match || config.match == 'eq' || config.match == 'ne') {
								if (this._compare(value, config.value, config.match)) {
									statusMatched = true;
								}
							} else if (config.match == 'contain' || config.match == 'start' || config.match == 'end') {
								if (this._compare(value, config.value, config.match)) {
									statusMatched = true;
								}
							} else if (config.match == 'lt' || config.match == 'gt' || config.match == 'lte' || config.match == 'gte') {
								if (this._compare(value, config.value, config.match, 'number')) {
									statusMatched = true;
								}
							} else if (config.match == 'none') {
								if (value == null) {
									statusMatched = true;
								}
							} else if (config.match == 'exist') {
								if (value != null) {
									statusMatched = true;
								}
							}
							if (config.hasSecond) {
								let statusSecondMatched = false;
								if (this.config.loadMainConfig.resultCollectionType == 'pattern' || this.config.loadMainConfig.method == 'dynamic'){
									value = this._extractFromPattern(el, { type: config.typeSecond, pattern: config.patternSecond});
								} else if (this.config.loadMainConfig.resultCollectionType == 'path') {
									value = objectPath.get(deepParseJson(el), config.patternSecond).toString();
								}
								if (!config.matchSecond || config.matchSecond == 'eq' || config.matchSecond == 'ne') {
									if (this._compare(value, config.valueSecond, config.matchSecond)) {
										statusSecondMatched = true;
									}
								} else if (config.matchSecond == 'contain' || config.matchSecond == 'start' || config.matchSecond == 'end') {
									if (this._compare(value, config.valueSecond, config.matchSecond)) {
										statusSecondMatched = true;
									}
								} else if (config.matchSecond == 'lt' || config.matchSecond == 'gt' || config.matchSecond == 'lte' || config.matchSecond == 'gte') {
									if (this._compare(value, config.valueSecond, config.matchSecond, 'number')) {
										statusSecondMatched = true;
									}
								} else if (config.matchSecond == 'none') {
									if (value == null) {
										statusSecondMatched = true;
									}
								} else if (config.matchSecond == 'exist') {
									if (value != null) {
										statusSecondMatched = true;
									}
								}
								if (config.isAndSecond) {
									statusMatched = statusMatched && statusSecondMatched;
								} else {
									statusMatched = statusMatched || statusSecondMatched;
								}
							}
              if (config.hasThird) {
								let statusThirdMatched = false;
								if (this.config.loadMainConfig.resultCollectionType == 'pattern' || this.config.loadMainConfig.method == 'dynamic'){
									value = this._extractFromPattern(el, { type: config.typeThird, pattern: config.patternThird});
								} else if (this.config.loadMainConfig.resultCollectionType == 'path') {
									value = objectPath.get(deepParseJson(el), config.patternThird).toString();
								}
								if (!config.matchThird || config.matchThird == 'eq' || config.matchThird == 'ne') {
									if (this._compare(value, config.valueThird, config.matchThird)) {
										statusThirdMatched = true;
									}
								} else if (config.matchThird == 'contain' || config.matchThird == 'start' || config.matchThird == 'end') {
									if (this._compare(value, config.valueThird, config.matchThird)) {
										statusThirdMatched = true;
									}
								} else if (config.matchThird == 'lt' || config.matchThird == 'gt' || config.matchThird == 'lte' || config.matchThird == 'gte') {
									if (this._compare(value, config.valueThird, config.matchThird, 'number')) {
										statusThirdMatched = true;
									}
								} else if (config.matchThird == 'none') {
									if (value == null) {
										statusThirdMatched = true;
									}
								} else if (config.matchThird == 'exist') {
									if (value != null) {
										statusThirdMatched = true;
									}
								}
								if (config.isAndThird) {
									statusMatched = statusMatched && statusThirdMatched;
								} else {
									statusMatched = statusMatched || statusThirdMatched;
								}
							}

							if (statusMatched) {
								config.statusMatched = true;
								if (config.isDefaultTypology) {
									if (!config.typologyMatched) {
										config.typologyMatched = true;
									}
									if (config.matchedIndex == config.matchedCount) {
										config.mainContent = el;
									}
									config.matchedCount++;
									
								} else {
									let typologyMatched = false;
									if (this.config.loadMainConfig.resultCollectionType == 'pattern' || this.config.loadMainConfig.method == 'dynamic'){
										value = this._extractFromPattern(el, {
											pattern: config.pattern_typology,
											type: config.type_typology
										});
									} else if (this.config.loadMainConfig.resultCollectionType == 'path') {
										value = objectPath.get(deepParseJson(el), config.pattern_typology).toString();
									} else {throw {};}

									if (!config.match_typology || config.match_typology == 'eq' || config.match_typology == 'ne') {
										if (this._compare(value, config.value_typology, config.match_typology)) {
											typologyMatched = true;
										}
									} else if (config.match_typology == 'contain' || config.match_typology == 'start' || config.match_typology == 'end') {
										if (this._compare(value, config.value_typology, config.match_typology)) {
											typologyMatched = true;
										}
									} else if (config.match_typology == 'lt' || config.match_typology == 'gt' || config.match_typology == 'lte' || config.match_typology == 'gte') {
										if (this._compare(value, config.value_typology, config.match_typology, 'number')) {
											typologyMatched = true;
										}
									} else if (config.match_typology == 'none') {
										if (value == null) {
											typologyMatched = true;
										}
									} else if (config.match_typology == 'exist') {
										if (value != null) {
											typologyMatched = true;
										}
									}
                  if (config.hasSecond_typology) {
                    let typologySecondMatched = false;
                    if (this.config.loadMainConfig.resultCollectionType == 'pattern' || this.config.loadMainConfig.method == 'dynamic'){
                      value = this._extractFromPattern(el, { type: config.typeSecond_typology, pattern: config.patternSecond_typology});
                    } else if (this.config.loadMainConfig.resultCollectionType == 'path') {
                      value = objectPath.get(deepParseJson(el), config.patternSecond_typology).toString();
                    }
                    if (!config.matchSecond_typology || config.matchSecond_typology == 'eq' || config.matchSecond_typology == 'ne') {
                      if (this._compare(value, config.valueSecond_typology, config.matchSecond_typology)) {
                        typologySecondMatched = true;
                      }
                    } else if (config.matchSecond_typology == 'contain' || config.matchSecond_typology == 'start' || config.matchSecond_typology == 'end') {
                      if (this._compare(value, config.valueSecond_typology, config.matchSecond_typology)) {
                        typologySecondMatched = true;
                      }
                    } else if (config.matchSecond_typology == 'lt' || config.matchSecond_typology == 'gt' || config.matchSecond_typology == 'lte' || config.matchSecond_typology == 'gte') {
                      if (this._compare(value, config.valueSecond_typology, config.matchSecond_typology, 'number')) {
                        typologySecondMatched = true;
                      }
                    } else if (config.matchSecond_typology == 'none') {
                      if (value == null) {
                        typologySecondMatched = true;
                      }
                    } else if (config.matchSecond_typology == 'exist') {
                      if (value != null) {
                        typologySecondMatched = true;
                      }
                    }
                    if (config.isAndSecond_typology) {
                      typologyMatched = typologyMatched && typologySecondMatched;
                    } else {
                      typologyMatched = typologyMatched || typologySecondMatched;
                    }
                  }
                  if (config.hasThird_typology) {
                    let typologyThirdMatched = false;
                    if (this.config.loadMainConfig.resultCollectionType == 'pattern' || this.config.loadMainConfig.method == 'dynamic'){
                      value = this._extractFromPattern(el, { type: config.typeThird_typology, pattern: config.patternThird_typology});
                    } else if (this.config.loadMainConfig.resultCollectionType == 'path') {
                      value = objectPath.get(deepParseJson(el), config.patternThird_typology).toString();
                    }
                    if (!config.matchThird_typology || config.matchThird_typology == 'eq' || config.matchThird_typology == 'ne') {
                      if (this._compare(value, config.valueThird_typology, config.matchThird_typology)) {
                        typologyThirdMatched = true;
                      }
                    } else if (config.matchThird_typology == 'contain' || config.matchThird_typology == 'start' || config.matchThird_typology == 'end') {
                      if (this._compare(value, config.valueThird_typology, config.matchThird_typology)) {
                        typologyThirdMatched = true;
                      }
                    } else if (config.matchThird_typology == 'lt' || config.matchThird_typology == 'gt' || config.matchThird_typology == 'lte' || config.matchThird_typology == 'gte') {
                      if (this._compare(value, config.valueThird_typology, config.matchThird_typology, 'number')) {
                        typologyThirdMatched = true;
                      }
                    } else if (config.matchThird_typology == 'none') {
                      if (value == null) {
                        typologyThirdMatched = true;
                      }
                    } else if (config.matchThird_typology == 'exist') {
                      if (value != null) {
                        typologyThirdMatched = true;
                      }
                    }
                    if (config.isAndThird_typology) {
                      typologyMatched = typologyMatched && typologyThirdMatched;
                    } else {
                      typologyMatched = typologyMatched || typologyThirdMatched;
                    }
                  }

									if (typologyMatched) {
										if (!config.typologyMatched) {
											config.typologyMatched = true;
										}
										if (config.matchedIndex == config.matchedCount) {
											config.mainContent = el;
										}
										config.matchedCount++;
									}
								}
							}

						});
					} catch (error) {
						console.log(error);
					}
				}

				if (this.config.loadDetailConfig) {
					try {
						await this.onExtractDetailPage({ data: config.mainContent, withContent: param.withContent, campaignOutput: config });
					} catch (error) {
					}
				}
			}

		} catch (error) {
			console.log(error);
		}
		if (this.fieldExtractor) {
			this.fieldExtractor.init();
		}
		this.loadingSubject.next(false);
	}
	async onExtractLink(param) {
		this.loadingSubject.next(true);
		try {
			if (!param.output) {
				throw {};
			}
			if (param.output.linkUrl) {
				const res = await this.configService.extractDetailContentFromServer({
					resultCollection: 'body',
					resultCollectionType: 'pattern',
					url: param.output.linkUrl,
					method: 'get'
				});
				if (res) {param.output.linkContent = res[0];}
			}

		} catch (error) {
			if (param.output) {
				param.output.linkContent = null;
			}
		}
		if (!(this.cdr as ViewRef).destroyed){
			this.cdr.detectChanges();
		}
		this.loadingSubject.next(false);
	}
	async onExtractDetailPage(param) { // output, data, withContent
		this.loadingSubject.next(true);
		let detailUrl; let detailContent;
		try {
			// if (!param.output || !param.data) {
			// 	throw {}
			// }
			let permalink;
			if (typeof param.data == 'object' && Array.isArray(param.data)) {
				try {
					each(param.data, data => {
						if (!data) {
							throw {};
						}
						if (this.config.loadMainConfig.resultCollectionType == 'pattern' || this.config.loadMainConfig.method == 'dynamic') {
							const result = this._extractFromPattern(data, {
								type: this.config.loadDetailConfig.permalinkCollectionType,
								pattern: this.config.loadDetailConfig.permalinkCollection
							}, 'link');
							if (result) {
								permalink = result;
								detailUrl =  this.config.loadDetailConfig.url.replace('{permalink}', permalink );
								throw {};
							} else {
							}
						} else if (this.config.loadMainConfig.resultCollectionType == 'path') {
							detailUrl = this._replaceSubString(this.config.loadDetailConfig.url, {...JSON.parse(data), permalink: objectPath.get(JSON.parse(data), this.config.loadDetailConfig.permalinkCollection)});
							permalink = objectPath.get(JSON.parse(data), this.config.loadDetailConfig.permalinkCollection);
						}
					});
				} catch (error) {
					console.log(error);
				}

			} else {
				const data = param.data;
				if (!data) {
					throw {};
				}
				if (this.config.loadMainConfig.resultCollectionType == 'pattern'  || this.config.loadMainConfig.method == 'dynamic') {
					const result = this._extractFromPattern(data, {
						type: this.config.loadDetailConfig.permalinkCollectionType,
						pattern: this.config.loadDetailConfig.permalinkCollection
					}, 'link');
					if (result) {
						permalink = result;
						detailUrl = this.config.loadDetailConfig.url.replace('{permalink}', permalink);
					} else {
					}
				} else if (this.config.loadMainConfig.resultCollectionType == 'path') {
					detailUrl = this._replaceSubString(this.config.loadDetailConfig.url, {...JSON.parse(data), permalink: objectPath.get(JSON.parse(data), this.config.loadDetailConfig.permalinkCollection)});
					permalink = objectPath.get(JSON.parse(data), this.config.loadDetailConfig.permalinkCollection);
				}
			}

			if (param.withContent && detailUrl) {
				const defaultDetailUrl = detailUrl.replace('{language}', this.config.defaultLanguage);
				const defaultDetailConfig = cloneDeep(this.config.loadDetailConfig);
				if (defaultDetailConfig.permalinkInputType == 'body' && defaultDetailConfig.body && permalink) {
					defaultDetailConfig.body = defaultDetailConfig.body.replace('{permalink}', permalink).replace('{language}', this.config.defaultLanguage);
				} else if (defaultDetailConfig.permalinkInputType == 'header' && defaultDetailConfig.headers && permalink) {
					defaultDetailConfig.headers = defaultDetailConfig.headers.replace('{permalink}', permalink).replace('{language}', this.config.defaultLanguage);
				}
				const res = await this.configService.extractDetailContentFromServer({
					...defaultDetailConfig,
					url: defaultDetailUrl
				});
				if (res) {detailContent = res[0];}
				try {
					for (let i = 0; i < this.selectedLanguages.length; i++) {
						const languageDetailUrl = detailUrl.replace('{language}', this.selectedLanguages[i].key);
						const languageDetailConfig = cloneDeep(this.config.loadDetailConfig);
						if (languageDetailConfig.permalinkInputType == 'body' && languageDetailConfig.body && permalink) {
							languageDetailConfig.body = languageDetailConfig.body.replace('{permalink}', permalink).replace('{language}', this.selectedLanguages[i].key);
						} else if (languageDetailConfig.permalinkInputType == 'header' && languageDetailConfig.headers && permalink) {
							languageDetailConfig.headers = languageDetailConfig.headers.replace('{permalink}', permalink).replace('{language}', this.selectedLanguages[i].key);
						}
						const res = await this.configService.extractDetailContentFromServer({
							...languageDetailConfig,
							url: languageDetailUrl
						});
						if (res) {
							if (param.output) {
								param.output['detailUrl_'+this.selectedLanguages[i].key] = languageDetailUrl;
								param.output['detailContent_'+this.selectedLanguages[i].key] = res[0];
							}
							if (param.campaignOutput) {
								param.campaignOutput['detailUrl_'+this.selectedLanguages[i].key] = languageDetailUrl;
								param.campaignOutput['detailContent_'+this.selectedLanguages[i].key] = res[0];
							}
						}
					}
				} catch (error) {
				}
			}

		} catch (error) {

		}

		if (param.output) {
			param.output.detailUrl = detailUrl;
			param.output.detailContent = detailContent;
		}

		if (param.campaignOutput) {
			param.campaignOutput.detailUrl = detailUrl;
			param.campaignOutput.detailContent = detailContent;
			if (this.config.type == 'company' && detailContent) {
				try {
					await this.onExtractCompanyCampaigns({ output: param.campaignOutput, config: this.config.companyFieldConfig.campaigns, data: detailContent});
				} catch (error) {
				}
			}
		}

		this.loadingSubject.next(false);

		if (!(this.cdr as ViewRef).destroyed){
			this.cdr.detectChanges();
		}
	}
	onExtractField(param) {
		this.loadingSubject.next(true);
		param.config.result = null;
		if (param.status && param.status.key && param.typology && param.typology.key && param.config) {
			const statusConfig = this.config.campaignStatusConfigs.find( el => el.status == param.status.key && el.typology == param.typology.key);
			if (statusConfig) {
				const fields = {};
					each (this.config.campaignFieldConfig, ( value, key) => {
						const config = value.find( el => el.status == param.status.key && el.typology == param.typology.key);
						if (config) {
							fields[key] = config.result;
						}
					});
				if (param.config.from == 'formula') {
					param.config.result = this._extractFromFormula(fields, param.config);
				} else if (param.config.from == 'combine') {
					param.config.result = this._extractFromCombine(fields, param.config);
				} else if (param.config.from == 'link') {
					if (statusConfig.linkContent) {
						try {
							param.config.result = this._extractFromPattern(statusConfig.linkContent, param.config, param.key);
							if (param.config.result != null) {

								if (param.key == 'tags') {
									if (param.config.result) {
										if (typeof param.config.result == 'object'){
											if (!Array.isArray(param.config.result)) {
												param.config.result = [];
											}
										} else if (param.config.result.indexOf('&') >= 0) {
											param.config.result = param.config.result.split('&').filter( t => t && t.trim() != '');
										} else if (typeof param.config.result == 'string' && param.config.result.trim() != '') {
											param.config.result = [param.config.result];
										} else {
											param.config.result = [];
										}
									}

								} else if (param.key == 'socials') {
									if (param.config.result) {
										if (typeof param.config.result == 'object'){
											if (!Array.isArray(param.config.result)) {
												param.config.result = Object.keys(param.config.result).map( k => param.config.result[k]).filter( c => c && c!= '');
											}
										} else {
											param.config.result = [];
										}
									}
								}
							}
							if (param.config.result && typeof param.config.result == 'object' && !(param.config.result instanceof Date)) {
								if (param.config.result.length) {
									param.config.result = JSON.stringify(param.config.result);
								}
							}
						} catch (error) {
							console.log(error);
						}
					}

				} else {
					const data = param.config.from == 'main' ? statusConfig.mainContent: statusConfig.detailContent;
					const loadConfig = param.config.from == 'main' ? this.config.loadMainConfig: this.config.loadDetailConfig;
					if (data) {
						try {
							if (loadConfig.resultCollectionType == 'pattern'  || loadConfig.method == 'dynamic') {
								param.config.result = this._extractFromPattern(data, param.config, param.key);
							} else if (loadConfig.resultCollectionType == 'path') {
								if (param.config.type == 'define') {
									param.config.result = this._replaceSubString(param.config.pattern, deepParseJson(data));
								} else {
									param.config.result = this._extractFromObject(data, param.config);
								}
							}
							if (param.config.result != null) {
								if (param.key == 'holdingTime') {
									if (param.config.dateFormat == 'number') {
										param.config.result = str2number(param.config.result, param.config.numberDecimalPoint);
									} else if (param.config.dateFormat != null && param.config.dateFormat.trim() != '') {
										param.config.result = str2date(param.config.result, param.config.dateFormat.toUpperCase(), this.config.dxDay, this.config.defaultLanguage);
										if (param.config.result) {
											param.config.result = moment(param.config.result).add(1, 'M').diff(moment().startOf('month'), 'months');
										}
									}
								} else if (param.key == 'tags') {
									// if (param.config.result) {
									// 	if (typeof param.config.result == 'object'){
									// 		if (!Array.isArray(param.config.result)) {
									// 			param.config.result = [];
									// 		}
									// 	} else if (param.config.result.indexOf('&') >= 0) {
									// 		param.config.result = param.config.result.split('&').filter( t => t && t.trim() != '');
									// 	} else if (param.config.result.trim() != '') {
									// 		param.config.result = [param.config.result];
									// 	} else {
									// 		param.config.result = [];
									// 	}
									// }

								} else if (param.key == 'socials') {
									// if (param.config.result) {
									// 	if (typeof param.config.result == 'object'){
									// 		if (!Array.isArray(param.config.result)) {
									// 			param.config.result = Object.keys(param.config.result).map( k => param.config.result[k]).filter( c => c && c!= '');
									// 		}
									// 	} else {
									// 		param.config.result = [];
									// 	}
									// }
								} else {
									const fld = this.campaignFields.find( el => el.key == param.key);
									if (fld) {
										if (fld.type == 'date') {param.config.result = str2date(param.config.result, param.config.dateFormat, this.config.dxDay, this.config.defaultLanguage);}
										else if (fld.type == 'number') {
											param.config.result = str2number(param.config.result, param.config.numberDecimalPoint);
											if (param.config.result != null && param.config.numberUnit) {
												const formula = `${param.config.result} * ${param.config.numberUnit}`;
												param.config.result = this._extractFromFormula(fields, { formula });
											}
										}
									}
								}
							}
							if (param.config.result && typeof param.config.result == 'object' && !(param.config.result instanceof Date)) {
								if (param.config.result.length) {
									param.config.result = JSON.stringify(param.config.result);
								}
							}
						} catch (error) {
							console.log(error);
						}

					}

				}

				if (param.key == 'link' && param.config.result && typeof param.config.result == 'string' && param.config.result.trim()!='') {
					statusConfig.linkUrl = (param.config.baseUrl || '') + param.config.result;
				}
			}
		}
		if (param.config.patternWithLanguage) {
			for (let i = 0 ; i < param.config.patternWithLanguage.length; i++) {
				const pwl = param.config.patternWithLanguage[i];
				param.config['result_'+pwl.language] = null;
				if (param.status && param.status.key && param.typology && param.typology.key && param.config && param.config.from == 'detail') {
					const statusConfig = this.config.campaignStatusConfigs.find( el => el.status == param.status.key && el.typology == param.typology.key);
					if (statusConfig) {
						const data = statusConfig['detailContent_'+pwl.language];
						const loadConfig = this.config.loadDetailConfig;
						if (data) {
							try {
								if (loadConfig.resultCollectionType == 'pattern'  || loadConfig.method == 'dynamic') {
									param.config['result_'+pwl.language] = this._extractFromPattern(data, {...param.config, pattern: pwl.pattern}, param.key);
								} else if (loadConfig.resultCollectionType == 'path') {
									if (param.config.type == 'define') {
										param.config['result_'+pwl.language] = this._replaceSubString(pwl.pattern, deepParseJson(data));
									} else {
										param.config['result_'+pwl.language] = this._extractFromObject(data, {...param.config, pattern: pwl.pattern});
									}
								}

							} catch (error) {
								console.log(error);
							}
						}
					}
				}
			}
		}
		this.loadingSubject.next(false);
	}
	async onExtractCompanyCampaigns(param) {
		this.loadingSubject.next(true);
		if (param.config) {
			const data = param.data? param.data : (param.config.from == 'main' ? this.config.companyFieldConfig.mainContent : this.config.companyFieldConfig.detailContent);
			const loadConfig = param.config.from == 'main' ? this.config.loadMainConfig : this.config.loadDetailConfig;
			let detailUrl; let detailContent;
			if (data) {
				try {
					if (loadConfig.resultCollectionType == 'pattern'  || loadConfig.method == 'dynamic') {
						detailUrl = this._extractFromPattern(data, param.config);
					} else if (loadConfig.resultCollectionType == 'path') {
						detailUrl = param.config.pattern ? objectPath.get(deepParseJson(data), param.config.pattern) : null;
					}
				} catch (error) {
					console.log(error);
				}

				if (detailUrl) {
					try {
						const res = await this.configService.extractDetailContentFromServer({
							resultCollection: 'body',
							resultCollectionType: 'pattern',
							url: detailUrl,
							method: 'get'
						});
						if (!res) {throw {};}
						detailContent = res[0];
					} catch (error) {
					}
				}
			}

			if (param.output) {
				param.output.detailUrl = detailUrl;
				param.output.detailContent = detailContent;
			}
		}
		this.loadingSubject.next(false);
	}
	async onExtractCompanyField(param) {
		this.loadingSubject.next(true);
		if (param.config) {
			const data = param.data? param.data : (param.config.from == 'main' ? this.config.companyFieldConfig.mainContent : this.config.companyFieldConfig.detailContent);
			const loadConfig = param.config.from == 'main' ? this.config.loadMainConfig : this.config.loadDetailConfig;
			if (data) {
				try {
					if (loadConfig.resultCollectionType == 'pattern' || loadConfig.method == 'dynamic') {
						param.config.result = this._extractFromPattern(data, param.config, param.key);
					} else if (loadConfig.resultCollectionType == 'path') {
						param.config.result = param.config.pattern ? objectPath.get(deepParseJson(data), param.config.pattern) : null;
					}
				} catch (error) {
					console.log(error);
				}
			}
		}
		this.loadingSubject.next(false);
	}

	_extractFromPattern(html, config, key = null){

		let result;
		const $dom = htmlDecoder('<html>').html(html);

		const type = config.type || 'text';

		if (key == 'tags' || key == 'socials' || key == 'campaigns' || key == 'pictures') {
			result = [];
			$dom.find(config.pattern).each(function(idx, el) {
				try {
					let value;
					if (type == 'text') {
						value = htmlDecoder(el).clone().find('>*').remove().end().text();
						if (key == 'tags' && value == '+') {
							value = htmlDecoder(el).clone().find('>*').remove().end().attr('title');
						}
					} else if (type == 'textWithChildren') {
						value = htmlDecoder(el).text();
					}  else if (type == 'backgroundImage') {
						let bi = htmlDecoder(el).css('background-image');
						if (!bi) {
							bi = htmlDecoder(el).css('background');
						}
						if (bi) {
							value = bi.replace(/^url|[\(]/g, '').replace(/[\)](.)*/g, '').replace(/\"/g, '').replace(/\'/g, '');
						}
					} else if (type == 'backgroundStyle') {
						const iteratorEL = htmlDecoder(el).html();
						value = iteratorEL.match(new RegExp('url\(([^\)]+)\)'))[0];
						if (value) {
							value = value.replace(/^url|[\(\)]/g, '').replace(/\"/g, '').replace(/\'/g, '');
						}
					} else {
						value = htmlDecoder(el).attr(type);
						if (!value) {value = htmlDecoder(el).attr('data-' + type);}
					}

					if (!value) {throw {};}

					value = value.trim();
					if (value == '') {throw {};}

					if (config.bySub) {
						let start = -2; let end = -2;
						if (config.startOfSub && config.startOfSub != '') {
              start = result.indexOf(config.startOfSub);
              if (config.endOfSub && config.endOfSub != '') {
                end = result.indexOf(config.endOfSub, start || 0);
              }
            } else {
              if (config.endOfSub && config.endOfSub != '') {
                end = result.indexOf(config.endOfSub);
              }
            }

						if (start >= 0) {
							start = config.startOfSub.length + start;
						}
						if (start == -2 && end == -2) {
						} else if (start == -1 || end == -1) {
							value = null;
							throw '';
						} else {
							if (start == -2) {
								start = 0;
							}
							if (end == -2) {
								value = value.substr(start).trim();
							} else if (end > start){
								value = value.substr(start, end - start).trim();
							}
						}
					}

					if (key == 'tags') {
						if (value.indexOf('&') > 0) {
							result = union(result, value.split('&').filter(e => e).map( e => e.trim()));
						} else {
              if (value.indexOf(',') > 0) {
                result = union(result, value.split(',').filter(e => e).map( e => e.trim()));
              } else {
                result = union(result, [value]);
              }
						}
					} else if (key == 'socials') {
						if (value.indexOf('facebook') >= 0 ||
							value.indexOf('twitter') >= 0 ||
							value.indexOf('linkedin') >= 0 ||
							value.indexOf('youtube') >= 0 ||
							value.indexOf('mailto') >= 0 ||
							value.indexOf('instagram') >= 0
						) {
							result = union(result, [value]);
						}
					} else if (key == 'campaigns') {
						result = union(result, [value]);
					} else if (key == 'pictures') {
						result = union(result, [(config.baseUrl || '') + value]);
					}
				} catch (error) {
					console.error(error);
				}
			});
		} else {
			try {

				let curEl;

				if (config.byPrev) {
					config.isMatchedPrev = false;
					const prevType = config.type_prev || 'text';
					const prevPattern = config.pattern_prev;
					const prevMatch = config.match_prev;
					const prevValue = config.value_prev;

					if (!prevPattern) {throw {};}

					let prevEl;
					$dom.find(prevPattern).each( (idx, el) =>{
						try {

							if (prevEl) {throw '';}
							let value;
							if (prevType == 'text') {
								value = htmlDecoder(el).clone().find('>*').remove().end().text();
								if (key == 'tags') {
									if (value == '+') {
										value = htmlDecoder(el).clone().find('>*').remove().end().attr('title');
									}
								}
							} else if (prevType == 'textWithChildren') {
								value = htmlDecoder(el).text();
							} else if (prevType) {
								value = htmlDecoder(el).attr(prevType);
							}

							if(value) {value = value.trim();}


							if (!prevMatch || prevMatch == 'eq' || prevMatch == 'ne') {
								if (this._compare( value, prevValue,)) {
									config.isMatchedPrev = true;
									prevEl = el;
								}
							} else if (prevMatch == 'contain' || prevMatch == 'start' || prevMatch == 'end' ) {
								if (this._compare(value, prevValue, prevMatch)) {
									config.isMatchedPrev = true;
									prevEl = el;
								}
							} else if (prevMatch == 'lt' || prevMatch == 'gt' || prevMatch == 'lte' || prevMatch == 'gte') {
								if (this._compare(value, prevValue, prevMatch, 'number')) {
									config.isMatchedPrev = true;
									prevEl = el;
								}
							} else if (prevMatch == 'none') {
								if (value == null) {
									config.isMatchedPrev = true;
									prevEl = el;
								}
							}

						} catch (error) {
							console.log(error);
						}


					});

					if (!config.isMatchedPrev || !prevEl) {throw {};}

					if (!config.pattern) {throw {};}

					// sub pattern

					const sp_index = config.pattern.indexOf(' ');
					const nextSelector = config.pattern.substr(0, sp_index).trim();
					const childSelector = config.pattern.substr(sp_index+1).trim();
					if (sp_index > 0) {
            if (config.isSibling) {
              curEl = htmlDecoder(prevEl).siblings(nextSelector).find(childSelector).first();
            } else {
              curEl = htmlDecoder(prevEl).nextAll(nextSelector).find(childSelector).first();
            }
					} else {
            if (config.isSibling) {
              curEl = htmlDecoder(prevEl).siblings(config.pattern).first();
            } else {
              curEl = htmlDecoder(prevEl).nextAll(config.pattern).first();

            }
					}
				} else {
					curEl = $dom.find(config.pattern).first();
				}
				if (curEl.length == 0) {throw {};}

				if (type == 'text') {
					result = curEl.clone().find('>*').remove().end().text();
					if (key == 'tags') {
						if (result == '+') {
							result = curEl.clone().find('>*').remove().end().attr('title');
						}
					}
				} else if (type == 'textWithChildren') {
					result = curEl.text();
				} else if (type == 'backgroundImage') {
					let bi = curEl.css('background-image');
					if (!bi) {
						bi = curEl.css('background');
					}
					if (bi) {
						result = bi.replace(/^url|[\(]/g, '').replace(/[\)](.)*/g, '').replace(/\"/g, '').replace(/\'/g, '');
					}
				} else if (type == 'backgroundStyle') {
					const iteratorEL = curEl.html();
					const value = iteratorEL.match(new RegExp('url\(([^\)]+)\)'))[0];
					if (value) {
						result = value.replace(/^url|[\(\)]/g, '').replace(/\"/g, '').replace(/\'/g, '');
					}
				} else if (type == 'html') {
					result = curEl.html();
				} else if (type == 'slug') {
					result = curEl.clone().find('>*').remove().end().text();
					if (key == 'tags') {
						if (result == '+') {
							result = curEl.clone().find('>*').remove().end().attr('title');
						}
					}
					if (result) {
						result = result.replace(/[^a-zA-Z0-9 ]+/g, '').trim();
						result = result.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
					}
				} else {
					result = curEl.attr(type);
					if (!result) {result = curEl.attr('data-' + type);}
				}

				if(result) {result = result.trim();}

				if (config.bySub) {
					let start = -2; let end = -2;
					if (config.startOfSub && config.startOfSub != '') {
						start = result.indexOf(config.startOfSub);
            if (config.endOfSub && config.endOfSub != '') {
              end = result.indexOf(config.endOfSub, start || 0);
            }
					} else {
            if (config.endOfSub && config.endOfSub != '') {
              end = result.indexOf(config.endOfSub);
            }
          }

					if (start >= 0) {
						start = config.startOfSub.length + start;
					}
					if (start == -2 && end == -2) {
					} else if (start == -1 && end == -1) {
						result = null;
						throw '';
					} else {
						if (start == -2) {
							start = 0;
						}
						if (end == -2) {
							result = result.substr(start).trim();
						} else if (end > start){
							result = result.substr(start, end - start).trim();
						}
					}
				}

			} catch (error) {
			}
		}
		if (key == 'tags' || key == 'socials' || key == 'pictures') {
			if (result && result.length > 0) {
				result = result.join('\n');
			}
		}

		if (result && key == 'link') {
			const nn = result.match(new RegExp('(https?:\/\/[^ \']*)'));
			if (nn && nn.length && nn[0]) {
				result = nn[0];
			} else {
				result = result.replace('document.location.href=', '')
        .replace('window.location=', '')
				.replace('document.location=', '')
				.replace('location.href=', '')
				.replace(/\"/g, '')
				.replace(/\'/g, '')
				.replace(/\;/g, '');
			}
		}
		return result;
	}
	_extractFromObject(data, config) {
		let result = config.pattern ? objectPath.get(deepParseJson(data), config.pattern) : null;
		if (result && config.bySub) {
			let start = -2; let end = -2;
			if (config.startOfSub && config.startOfSub != '') {
        start = result.indexOf(config.startOfSub);
        if (config.endOfSub && config.endOfSub != '') {
          end = result.indexOf(config.endOfSub, start || 0);
        }
      } else {
        if (config.endOfSub && config.endOfSub != '') {
          end = result.indexOf(config.endOfSub);
        }
      }


			if (start >= 0) {
				start = config.startOfSub.length + start;
			}
			if (start == -2 && end == -2) {
			} else if (start == -1 || end == -1) {
				result = null;
				throw '';
			} else {
				if (start == -2) {
					start = 0;
				}
				if (end == -2) {
					result = result.substr(start).trim();
				} else if (end > start){
					result = result.substr(start, end - start).trim();
				}
			}
		}
		return result;
	}
	_extractFromFormula(fields, config) {
		let result;
		try {

			if (!config.formula) {throw {};}
			const n = Parser.evaluate(config.formula, fields);
			if (n === Infinity || isNaN(n)) {throw {};}
        	result = n;
		} catch (error) {
			console.log(error);
		}
		return result;
	}
	_extractFromCombine(fields, config) {
		let result;
		try {

			if (!config.combine) {throw {};}

			result = config.combine;

			each(fields, (value, key) => {
				result = result.replace(`{${key}}`, value);
			});
		} catch (error) {
			console.log(error);
		}
		return result;
	}
	_compare(a, b, opr = 'eq', type = 'string') {
		let result;
		try {
			switch (opr) {
				case 'eq':
				{
					if (type == 'string') {
						result = a && b && a.toLowerCase() === b.toLowerCase();
					}
				}
				break;
        case 'ne':
				{
					if (type == 'string') {
						result = !(a && b && a.toLowerCase() === b.toLowerCase());
					}
				}
				break;
				case 'contain':
				{
					if (type == 'string') {
						result = a && b && a.toLowerCase().indexOf(b.toLowerCase()) >= 0;
					}
				}
				break;
				case 'start':
				{
					if (type == 'string') {
						result = a && b && a.toLowerCase().indexOf(b.toLowerCase()) == 0;
					}
				}
				break;
				case 'end':
				{
					if (type == 'string') {
						result = a && b && (a.toLowerCase().lastIndexOf(b.toLowerCase()) >= 0 && a.length - a.toLowerCase().lastIndexOf(b.toLowerCase()) == b.length);
					}
				}
				break;
				case 'lt':
				{
					if (type == 'number') {
						result = parseInt(a) < parseInt(b);
					}
				}
				break;
				case 'lte':
				{
					if (type == 'number') {
						result = parseInt(a) <= parseInt(b);
					}
				}
				break;
				case 'gt':
				{
					if (type == 'number') {
						result = parseInt(a) > parseInt(b);
					}
				}
				break;
				case 'gte':
				{
					if (type == 'number') {
						result = parseInt(a) >= parseInt(b);
					}
				}
				break;
			}
		} catch (error) {
		}
		return result;
	}
	onShowHtml(param) {
		const modalRef = this.modal.open(HtmlViewerDialog, { animation: false, size: 'xl'});
		modalRef.componentInstance.load(param);
	}

	onClickTab(param) {
		this.activeTab = param;
		if (this.activeTab.key == 'campaign') {
			for (var i = 0 ; i < this.statuses.length; i++) {
				if (!this.statuses[i].disabled) {
					try {
						if (!this.activeStatus || this.activeStatus.disabled) {
							this.activeStatus = this.statuses[i];
						}
					} catch (error) {
						console.log(error);
					}
				}
			}
			for (var i = 0 ; i < this.typologies.length; i++) {
				if (!this.typologies[i].disabled) {
					try {
						if (!this.activeTypology || this.activeTypology.disabled) {
							this.activeTypology = this.typologies[i];
						}
					} catch (error) {
						console.log(error);
					}
				}
			}
			setTimeout(async () => {
				if (this.preSelectExtractor) {
					for (let i = 0 ; i < this.statuses.length; i++) {
						for (let j = 0 ; j < this.typologies.length; j++) {
							const typology = this.typologies[j];
							const status = this.statuses[i];
							let config;
							try {
								if (this.config.campaignStatusConfigs && status && status.key && !status.disabled && typology && typology.key && !typology.disabled) {
									config = this.config.campaignStatusConfigs.find( el => el.typology == typology.key && el.status == status.key);
									if (config) {
										if (!config.match) {
											config.match = 'eq';
										}
									} else {
										const em_config = this.config.campaignStatusConfigs.find( el => el.typology == null && el.status == status.key);
										if (em_config) {
											const count = this.config.campaignStatusConfigs.push({
												...em_config,
												typology: typology.key,
												status: status.key,
												match: 'eq',
												isDefaultTypology: this.config.involvedCampaignTypologies.length == 1
											});
											config = this.config.campaignStatusConfigs[count - 1];
										} else {
											const count = this.config.campaignStatusConfigs.push({
												typology: typology.key,
												status: status.key,
												match: 'eq',
												isDefaultTypology: this.config.involvedCampaignTypologies.length == 1
											});
											config = this.config.campaignStatusConfigs[count - 1];
										}

									}
								}
							} catch (error) {
								console.log(error);
							}
							if (config)  {
								// await this.onExtractStatus({ config, typology, status, withContent: config.detailContent == null});
							}
						}
					}

				}
				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.detectChanges();
				}
			}, 100);
		}
		if (this.activeTab.key == 'company') {
			if (this.config.type != 'company') {return;}

			if (this.config.companyFieldConfig) {
				this.config.companyFieldConfig.mainContent = this.config.loadMainConfig.result;
				this.config.companyFieldConfig.detailUrl = this.config.loadDetailConfig.detailUrl;
				this.config.companyFieldConfig.detailContent = this.config.loadDetailConfig.detailContent;
				setTimeout(async () => {
					if (this.companyFieldExtractor) {
						this.companyFieldExtractor.init();
					}
					if (!(this.cdr as ViewRef).destroyed) {
						this.cdr.detectChanges();
					}
				}, 100);
			}
		}
	}
	getTabEnabled(tab) {
		if (!this.config) {return false;}

		let enabled = false;
		if (tab.key == 'campaign') {
			if (this.config.type == 'campaign') {
				if (this.config.loadMainConfig && this.config.loadMainConfig.result &&
					this.config.loadDetailConfig &&
					(!this.config.loadDetailConfig.url || this.config.loadDetailConfig.url.trim() == '' || this.config.loadDetailConfig.detailUrl) &&
					this.selectedCampaignStatuses.length > 0 && this.selectedCampaignTypologies.length > 0) {
					enabled = true;
				}
			} else if (this.config.type == 'company') {
				if (this.config.companyFieldConfig && this.config.companyFieldConfig.campaigns && this.config.companyFieldConfig.campaigns.detailContent && this.selectedCampaignStatuses.length > 0 && this.selectedCampaignTypologies.length > 0) {
					enabled = true;
				}
			}
		} else if (tab.key == 'company'){
			if (this.config.type != 'company') {
				return false;
			}
			if (this.config.loadMainConfig && this.config.loadMainConfig.result &&
				this.config.loadDetailConfig &&
				(!this.config.loadDetailConfig.url || this.config.loadDetailConfig.url.trim() == '' || this.config.loadDetailConfig.detailUrl)) {
				enabled = true;
			}
		} else if (tab.key =='main') {
			enabled = true;
		}
		return enabled;
	}
	_replaceSubString(_input, data) {
		try {
			if (!_input) {throw {};}
			if (!data) {throw {};}

			const keys = _input.match(/{([\w\d\.]+?)}/g);
			each(keys, key => {
				try {
					const path = key.replace('{', '').replace('}', '');
					const value = objectPath.get(data, path);
					if (value) {
						_input = _input.replace(key, value);
					}
				} catch (error) {

				}

			});

		} catch (error) {

		}

		return _input;
	}
}
