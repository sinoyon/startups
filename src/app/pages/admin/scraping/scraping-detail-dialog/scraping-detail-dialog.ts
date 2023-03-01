import { AddCommentDialog } from './../../user/user-list/add-comment-dialog/add-comment.dialog';
// Angular
import { Component, OnInit, ViewChild, ChangeDetectionStrategy, OnDestroy, ViewRef, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription, BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { cloneDeep, union, sortedUniq, sortBy } from 'lodash';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { LpTableComponent } from 'src/app/pages/common/lp-table/lp-table.component';
import { AliasService } from 'src/app/pages/common/alias.service';
import { KTUtil } from 'src/app/_metronic/kt';
import { QueryResultsModel } from 'src/app/pages/common/models/query-results.model';
import { ThisReceiver } from '@angular/compiler';
import { date2string, tag2category } from 'src/app/pages/common/common';
import { SourceService } from 'src/app/pages/common/source.service';

@Component({
	selector: 'app-scraping-detail-dialog',
	templateUrl: './scraping-detail-dialog.html',
	styleUrls: ['./scraping-detail-dialog.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScrapingDetailDialog implements OnInit, OnDestroy {

	locale = 'it-IT';
	loadingSubject = new BehaviorSubject<boolean>(true);
	loading$: Observable<boolean>;

	columnDefs: any[] = [];
	dataType;
	items = [];
	warnings = [];
	selectedItem;
	isInfoOfDetail = false;
	infoKey;
	defaultPreviewKeys = [
		{ key: 'name', sort: 2},
		{ key: 'typology', sort: 2},
		{ key: 'link', sort: 2, type: 'url'},
		{ key: 'status', sort: 0},
		{ key: 'raised', sort: 0},
		{ key: 'startDate', sort: 0},
		{ key: 'endDate', sort: 0, type: 'array'},
		{ key: 'country', sort: 0},
		{ key: 'investorCount', sort: 0},
		{ key: 'tags', type: 'array', sort: 0},
		{ key: 'minimumGoal', sort: 0},
		{ key: 'maximumGoal', sort: 0},
		{ key: 'preMoneyEvaluation', sort: 0},
		{ key: 'minimumInvestment', sort: 0},
		{ key: 'description', detail: true, sort: 0},
		{ key: 'videoUrl', sort: 0},
		{ key: 'logo', sort: 0},
		{ key: 'roi', sort: 0},
		{ key: 'roiAnnual', sort: 0},
		{ key: 'pictures', type: 'array', detail: true, sort: 0},
		{ key: 'address', sort: 0},
		{ key: 'city', sort: 0},
		{ key: 'holdingTime', sort: 0}
	];
	previewKeys = [
	];

	tabs: any[] = [
		{
			title: 'Scraped',
			state: 'scraped'
		},
		{
			title: 'Updated',
			state: 'updated'
		},
		{
			title: 'Created',
			state: 'created',
		},
		{
			title: 'Error',
			state: 'error',
		},
		{
			title: 'Warning',
			state: 'warning',
		}
	];

	activeTab;

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
    {key: 'france', title: 'France'},
	];
	selectedCampaignCountries = [];
	selectedCampaignTypologies = [];
	multiSelectSettings = {
		singleSelection: false,
		idField: 'key',
		textField: 'title',
		selectAllText: 'Select All',
		enableCheckAll: true,
		unSelectAllText: 'UnSelect All',
		itemsShowLimit: 3,
		allowSearchFilter: false
	};

	isEmptyTable = false;
	@ViewChild('tableCtrl', {static: true}) tableCtrl: LpTableComponent;

	categories = [];

	get scraped(): number {
		return this.items.filter( el => el.state == 'scraped').length;
	}
	get updated(): number {
		return this.items.filter( el => el.state == 'updated').length;
	}
	get created(): number {
		return this.items.filter( el => el.state == 'created').length;
	}
	get error(): number {
		return this.items.filter( el => el.state == 'error').length;
	}
	get warning(): number {
		return this.items.filter( el => el.state == 'warning').length;
	}

	get companyEquityCampaigns(): any {
		return this.getIncreasedValue('company equity');
	}
	get companyLendingCampaigns(): any {
		return this.getIncreasedValue('company lending');
	}
	get realEstateEquityCampaigns(): any {
		return this.getIncreasedValue('real estate equity');
	}
	get realEstateLendingCampaigns(): any {
		return this.getIncreasedValue('real estate lending');
	}

	private unsubscribe: Subscription[] = [];

	constructor(
			private activatedRoute: ActivatedRoute,
			private cdr: ChangeDetectorRef,
			private router: Router,
			private translate: TranslateService,
			public activeModal: NgbActiveModal,
			private aliasService: AliasService,
			private modal: NgbModal,
			private sourceService: SourceService
			) {

		this.loading$ = this.loadingSubject.asObservable();
	}

	ngOnInit() {
		this.unsubscribe.push(this.translate.onLangChange.subscribe( lang => {
			this.updateByTranslate(lang.lang);
		}));

		this.loadCategories().then();

		this.updateByTranslate(this.translate.currentLang);
		document.addEventListener('keyup', (e: any) => {
			if (this.selectedItem) {
				if (e.key == 'ArrowRight') {
					this.viewCampaignDetail(true);
				} else if (e.key == 'ArrowLeft') {
					this.viewCampaignDetail(false);
				} else if (e.key == 'Escape') {
					this.activeModal.close();
				}
			}
		});

		this.selectedCampaignTypologies = this.typologies;
		// this.selectedCampaignCountries = this.countries;
	}

	async loadCategories() {

		try {
			const payload = {
				filterModel: {
				  type: {
					filterType: 'text',
					filter: 'campaign.tag'
				  },
				  ignore: {
					  filterType: 'ne',
					  value: true
				  }
				},
				startRow: 0,
				endRow: 0,
				pageSize: 1000,
				totalCount: 0,
				result: []
			};
			const res = await this.aliasService.get(payload, { self: 'names'});
			if (res) {
				this.categories = res.items;
			}
		} catch (error) {

		}
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
		// this.defineColumns();
	}

	defineColumns() {
		const isMobile = KTUtil.isMobileDevice();
		let columnDefs: any[] = [];
		if (this.activeTab.state == 'scraped') {
			columnDefs = [
				{ headerName: this.translate.instant('Source') ,
					action: 'VIEW',
					field: 'sourceName',
					editable: false,  minWidth: 200
				},
				{ headerName: this.translate.instant('Started At'),
						cellRenderer: (param) => {
						if (param.data && param.data.startedAt) {
							return this.getDateTimeFromDate(param.data.startedAt);
						}
					}, field: 'startedAt', editable: false
				},
				{ headerName: this.translate.instant('Finished At'),
					cellRenderer: (param) => {
						if (param.data && param.data.finishedAt) {
							return this.getDateTimeFromDate(param.data.finishedAt);
						}
					}, field: 'finishedAt', editable: false
				},
				{ headerName: this.translate.instant('Duration') , field: 'duration', editable: false,  },
				{ headerName: this.translate.instant('Warning') , field: 'warning', editable: false,  },
				{ headerName: this.translate.instant('Error') , field: 'errors', editable: false,  },
				{
					action: 'ENTER_IN',	width: 42, fixed: true, pinned: isMobile? null: 'right', editable: false, sortable: false,
					cellRenderer:  param => {
						if (param.data) {
							return `<a target="_blank" href="${window.location.origin + '/crowdfunding/source/' + param.data.sourceName}"><i class="fa fa-link" style="color: blue"></i></a>`;
						}
					}
				},
				{
					action: 'ENTER',	width: 42, fixed: true, pinned: isMobile? null: 'right', editable: false, sortable: false,
					cellRenderer:  param => {
						if (param.data) {
							return `<i class="fa fa-link" style="${param.data.sourceLink? '': 'opacity: 0.4; cursor: not-allowed'}"></i>`;
						}
					},
					tooltip: param => {
						if (param && param.data && param.data.sourceLink){
							return param.data.sourceLink;
						}
					}
				}
			];
		} else if (this.activeTab.state == 'updated') {
			columnDefs = [
				{ headerName: this.translate.instant('Name') ,
					action: 'VIEW',
					field: 'name',
					editable: false,  minWidth: 200
				},
				{ headerName: this.translate.instant('Source') ,
					action: 'VIEW',
					field: 'sourceName',
					editable: false,  minWidth: 200
				},
				{ headerName: this.translate.instant('Typology'),field: 'typology', editable: false, sortable: false,
					cellRenderer: (param) => {
						if (param.data && param.data.typology) {
							switch (param.data.typology) {
								case 'company equity':
									return `<span class="badge badge-success rounded-0 text-uppercase">Company equity</span>`;
								case 'company lending':
									return `<span class="badge badge-light-success rounded-0 text-uppercase">Company lending</span>`;
								case 'real estate equity':
									return `<span class="badge badge-primary rounded-0 text-uppercase">Real estate equity</span>`;
								case 'real estate lending':
									return `<span class="badge badge-light-primary rounded-0 text-uppercase">Real estate lending</span>`;
								case 'minibond':
									return `<span class="badge badge-warning rounded-0 text-uppercase">Minibond</span>`;
								default:
									break;
							}
						}
					},
				},
				{ headerName: this.translate.instant('Country') , field: 'country', editable: false,  },
				{ headerName: this.translate.instant('Money Raised') ,filter: false, field: 'raised', editable: false,
					cellRenderer: param => {
						if (param.data && param.data.raised!= null) {
							const contentHtml = `<span>${this.addCommas(param.data.raised) + ' €'}</span>`;
							return contentHtml;
						}
					},
					action: 'VIEW'
				},
				{ headerName: this.translate.instant('Previous Money Raised') ,filter: false, field: 'prevRaised', editable: false,
					cellRenderer: param => {
						if (param.data && param.data.prevRaised!= null) {
							const contentHtml = `<span>${this.addCommas(param.data.prevRaised) + ' €'}</span>`;
							return contentHtml;
						}
					},
					action: 'VIEW',
				},
				{ headerName: this.translate.instant('Number of Investors') ,filter: false, field: 'investorCount', editable: false,
					cellRenderer: param => {
						if (param.data && param.data.investorCount!= null) {
							const contentHtml = `<span>${this.addCommas(param.data.investorCount)}</span>`;
							return contentHtml;
						}
					},
					action: 'VIEW',
				},
				{ headerName: this.translate.instant('Previous Number of Investors') ,filter: false, field: 'prevInvestorCount', editable: false,
					cellRenderer: param => {
						if (param.data && param.data.prevInvestorCount!= null) {
							const contentHtml = `<span>${this.addCommas(param.data.prevInvestorCount)}</span>`;
							return contentHtml;
						}
					},
					action: 'VIEW',
				},
				{ headerName: this.translate.instant('Updated') ,
					action: 'VIEW',
					field: 'updatedCount',
					 editable: false,
					cellClass: !isMobile? 'last-column-cell custom-cell': 'custom-cell'
				},
				{
					action: 'VIEW',	width: 42, fixed: true, pinned: isMobile? null: 'right', editable: false, sortable: false,
					cellRenderer:  param => '<i class="la la-eye"></i>',
					cellClass: isMobile? 'last-column-cell custom-cell': 'custom-cell'
				}
			];
		} else if (this.activeTab.state == 'created') {
			columnDefs = [
				{ headerName: this.translate.instant('Name') ,
					action: 'VIEW',
					field: 'name',
					editable: false,  minWidth: 200,
				},
				{ headerName: this.translate.instant('Source') ,
					action: 'VIEW',
					field: 'sourceName',
					editable: false,  minWidth: 200
				},
				{ headerName: this.translate.instant('Typology'),field: 'typology',  editable: false, sortable: false,
					cellRenderer: (param) => {
						if (param.data && param.data.typology) {
							switch (param.data.typology) {
								case 'company equity':
									return `<span class="badge badge-success rounded-0 text-uppercase">Company equity</span>`;
								case 'company lending':
									return `<span class="badge badge-light-success rounded-0 text-uppercase">Company lending</span>`;
								case 'real estate equity':
									return `<span class="badge badge-primary rounded-0 text-uppercase">Real estate equity</span>`;
								case 'real estate lending':
									return `<span class="badge badge-light-primary rounded-0 text-uppercase">Real estate lending</span>`;
								case 'minibond':
									return `<span class="badge badge-warning rounded-0 text-uppercase">Minibond</span>`;
								default:
									break;
							}
						}
					},
				},
				{ headerName: this.translate.instant('Country') , field: 'country', editable: false,
				cellClass: !isMobile? 'last-column-cell custom-cell': 'custom-cell'},
				{
					action: 'VIEW',	width: 42, fixed: true, pinned: isMobile? null: 'right', editable: false, sortable: false,
					cellRenderer:  param => '<i class="la la-eye"></i>',
					cellClass: isMobile? 'last-column-cell custom-cell': 'custom-cell'
				}
			];
		} else if (this.activeTab.state == 'warning') {
			columnDefs = [
				{ headerName: this.translate.instant('Source') ,
					action: 'VIEW',
					field: 'sourceName',
					editable: false,  minWidth: 200
				},
				{ headerName: this.translate.instant('Involves Campaign status of source'),field: 'involvedCampaignStatusesOfSource', editable: false, sortable: false,
					action: 'VIEW',
					cellRenderer: (param) => {
						if (param.data && param.data.involvedCampaignStatusesOfSource) {
							return param.data.involvedCampaignStatusesOfSource.map( status => {
								switch (status) {
									case '1_ongoing':
										return `<span class="badge badge-success rounded-0 text-uppercase">ongoing</span>`;
									case '2_comingsoon':
										return `<span class="badge badge-warning rounded-0 text-uppercase">coming soon</span>`;
									case '3_funded':
										return `<span class="badge badge-light-primary rounded-0 text-uppercase">closed funded</span>`;
									case '4_closed':
										return `<span class="badge badge-secondary rounded-0 text-uppercase">closed not funded</span>`;
									case '5_extra':
										return `<span class="badge badge-info rounded-0 text-uppercase">closing</span>`;
									case '6_refunded':
										return `<span class="badge badge-light-success rounded-0 text-uppercase">refunded</span>`;
									default:
										break;
								}
							}).join(' ');
						}
					}
				},
				{ headerName: this.translate.instant('Type') ,
					action: 'VIEW',
					field: 'type',
					editable: false,  minWidth: 200
				},
				{
					headerName: this.translate.instant('Comments'), field: 'sourceComment', editable: false, hide: this.activeTab?.state != 'error',
					cellRenderer: (param) => {
						if (param.data) {
							let result = '';
	
							const commentHtml = `<span>
							${this.convertToPlain(param.data.sourceComment || '')}</span>`;
							result = commentHtml;

							const commentButtonHtml = `<span id="theEditCommentButton" class="action" ><i class='la la-pen'></i></span>`;

							setTimeout(() => {
								const commentButton = param.eGridCell.querySelector('#theEditCommentButton');
								if (commentButton) {
									commentButton.addEventListener('click', () => {
										this.onClickEditComment(param.data);
									});
								}
							}, 10);
							if (param.data) {
								result += commentButtonHtml;
							}
							
							return result;
						}
					}
	
				},
				{ headerName: this.translate.instant('Content') ,
					action: 'VIEW',
					field: 'value',
					editable: false,
					cellClass: !isMobile? 'last-column-cell custom-cell': 'custom-cell'
				},
				{
					action: 'VIEW',	width: 42, fixed: true, pinned: isMobile? null: 'right', editable: false, sortable: false,
					cellRenderer:  param => '<i class="la la-eye"></i>',
					cellClass: isMobile? 'last-column-cell custom-cell': 'custom-cell'
				},
        {
          action: 'EDIT',	width: 42, fixed: true, pinned: 'right', editable: false, sortable: false,
          cellRenderer:  param => '<i class="la la-pen"></i>'
        },
				{
					action: 'ENTER_IN',	width: 42, fixed: true, pinned: isMobile? null: 'right', editable: false, sortable: false,
					cellRenderer:  param => {
						if (param.data) {
							return `<a target="_blank" href="${window.location.origin + '/crowdfunding/source/' + param.data.sourceName}"><i class="fa fa-link" style="color: blue"></i></a>`;
						}
					}
				},
				{
					action: 'ENTER',	width: 42, fixed: true, pinned: isMobile? null: 'right', editable: false, sortable: false,
					cellRenderer:  param => {
						if (param.data) {
							return `<i class="fa fa-link" style="${param.data.sourceLink? '': 'opacity: 0.4; cursor: not-allowed'}"></i>`;
						}
					},
					tooltip: param => {
						if (param && param.data && param.data.sourceLink){
							return param.data.sourceLink;
						}
					}
				}
			];
		} else if (this.activeTab.state == 'error') {
			columnDefs = [
				{ headerName: this.translate.instant('Source') ,
					field: 'sourceName',
					editable: false,  minWidth: 200
				},
				{ headerName: this.translate.instant('Involves Campaign status of source'),field: 'involvedCampaignStatusesOfSource', editable: false, sortable: false,
					cellRenderer: (param) => {
						if (param.data && param.data.involvedCampaignStatusesOfSource) {
							return param.data.involvedCampaignStatusesOfSource.map( status => {
								switch (status) {
									case '1_ongoing':
										return `<span class="badge badge-success rounded-0 text-uppercase">ongoing</span>`;
									case '2_comingsoon':
										return `<span class="badge badge-warning rounded-0 text-uppercase">coming soon</span>`;
									case '3_funded':
										return `<span class="badge badge-light-primary rounded-0 text-uppercase">closed funded</span>`;
									case '4_closed':
										return `<span class="badge badge-secondary rounded-0 text-uppercase">closed not funded</span>`;
									case '5_extra':
										return `<span class="badge badge-info rounded-0 text-uppercase">closing</span>`;
									case '6_refunded':
										return `<span class="badge badge-light-success rounded-0 text-uppercase">refunded</span>`;
									default:
										break;
								}
							}).join(' ');
						}
					}
				},
				{ headerName: this.translate.instant('Type') ,
					field: 'type',
					editable: false,  minWidth: 200
				},
				{
					headerName: this.translate.instant('Comments'), field: 'sourceComment', editable: false, hide: this.activeTab?.state != 'error',
					cellRenderer: (param) => {
						if (param.data) {
							let result = '';
	
							const commentHtml = `<span>
							${this.convertToPlain(param.data.sourceComment || '')}</span>`;
							result = commentHtml;

							const commentButtonHtml = `<span id="theEditCommentButton" class="action" ><i class='la la-pen'></i></span>`;

							setTimeout(() => {
								const commentButton = param.eGridCell.querySelector('#theEditCommentButton');
								if (commentButton) {
									commentButton.addEventListener('click', () => {
										this.onClickEditComment(param.data);
									});
								}
							}, 10);
							if (param.data) {
								result += commentButtonHtml;
							}
							
							return result;
						}
					}
	
				},
				{ headerName: this.translate.instant('Content') ,
					field: 'value',
					editable: false,
					cellClass: !isMobile? 'last-column-cell custom-cell': 'custom-cell'
				},
        {
          action: 'EDIT',	width: 42, fixed: true, pinned: 'right', editable: false, sortable: false,
          cellRenderer:  param => '<i class="la la-pen"></i>'
        },
				{
					action: 'ENTER_IN',	width: 42, fixed: true, pinned: isMobile? null: 'right', editable: false, sortable: false,
					cellRenderer:  param => {
						if (param.data) {
							return `<a target="_blank" href="${window.location.origin + '/crowdfunding/source/' + param.data.sourceName}"><i class="fa fa-link" style="color: blue"></i></a>`;
						}
					}
				},
				{
					action: 'ENTER',	width: 42, fixed: true, pinned: isMobile? null: 'right', editable: false, sortable: false,
					cellRenderer:  param => {
						if (param.data) {
							return `<i class="fa fa-link" style="${param.data.sourceLink? '': 'opacity: 0.4; cursor: not-allowed'}"></i>`;
						}
					},
					tooltip: param => {
						if (param && param.data && param.data.sourceLink){
							return param.data.sourceLink;
						}
					}
				}
			];
		}
		this.columnDefs = columnDefs;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
		this.tableCtrl.willRefreshTable.next('COLUMNS');
		this.tableCtrl.willRefreshTable.next('ROWS');
	}

	async onPaginationChanged(param) {
		this.tableCtrl.isLoading.next(true);

		const payload = cloneDeep(param.payload);
		const isFiltered = Object.keys(payload.filterModel).length > 0;
		const filter = {};
		Object.keys(payload.filterModel).forEach( key => {
			const field = key.replace(/_\d/, '');
			if (payload.filterModel[key].filterType == 'text'){
				filter[field] = payload.filterModel[key].filter;
			} else if ( payload.filterModel[key].filterType == 'date') {
				const m = moment(payload.filterModel[key].dateFrom);
				filter[field] = {
					gte: m.toDate().getTime(),
					lt: m.hour(23).minute(59).second(59).toDate().getTime()
				};
			}
		});

		const result = new QueryResultsModel(
			this.items.filter((item, index) => {
				if (this.activeTab.state == 'updated' || this.activeTab.state == 'created') {
					try {
						if (item.campaign && item.campaign.typology) {
							if (!this.selectedCampaignTypologies.reduce( (carry, ltr) => carry || item.campaign.typology.indexOf(ltr.key) >= 0, false)) {
								return false;
							}
						}
						if (item.campaign && item.involvedCampaignCountries) {
							if (!this.selectedCampaignCountries.reduce( (carry, ltr) => carry || item.involvedCampaignCountries.includes(ltr.key), false)) {
								return false;
							}
						}
					} catch (error) {
						console.log(error);
					}

				} else if (this.activeTab.state == 'scraped') {
					if (item.involvedCampaignCountries) {
						if (!this.selectedCampaignCountries.reduce( (carry, ltr) => carry || item.involvedCampaignCountries.includes(ltr.key), false)) {
							return false;
						}
					}
				} else {
					try {
						if (!this.selectedCampaignTypologies.reduce( (carry, ltr) => carry || item.involvedCampaignTypologiesOfSource.filter( el => el.indexOf(ltr.key) >= 0).length > 0, false)) {
							return false;
						}
						if (!this.selectedCampaignCountries.reduce( (carry, ltr) => carry || item.involvedCampaignCountriesOfSource.includes(ltr.key), false)) {
							return false;
						}
					} catch (error) {
						console.log(error);
					}
				}
				if (this.activeTab) {
					return this.activeTab.state == item.state;
				} else {
					return true;
				}
			}).map( item => {
				item.updatedCount = item.updatedFields ? item.updatedFields.length: 0;
				if (this.activeTab.state == 'updated' || this.activeTab.state == 'created') {
					item = {...(item.campaign || {}), ...item, campaign: undefined};
					if (item.updatedFields) {
						const prevRaised = item.updatedFields.find(el => el.key == 'raised');
						if (prevRaised) {
							item.prevRaised = prevRaised.prev;
							item.raised = prevRaised.current;
						} else {
							item.prevRaised = item.raised;
						}
						const prevInvestorCount = item.updatedFields.find(el => el.key == 'investorCount');
						if (prevInvestorCount) {
							item.prevInvestorCount = prevInvestorCount.prev;
							item.investorCount = prevInvestorCount.current;
						} else {
							item.prevInvestorCount = item.investorCount;
						}
					}
					switch (item.typology) {
						case 'company equity':
							item._sort = 1;
							break;
						case 'real estate equity':
							item._sort = 2;
							break;
						case 'company lending':
							item._sort = 3;
							break;
						case 'real estate lending':
							item._sort = 4;
							break;
						default:
							item._sort = 5;
					}
				} else if (this.activeTab.state == 'scraped') {

				}
			return item;
		}));

		if (this.activeTab.state == 'updated' || this.activeTab.state == 'created') {
			result.items = sortBy(result.items, ['_sort']);
		}

		const ditems = result.items.slice(payload.startRow, payload.endRow > result.totalCount ? result.totalCount : payload.pageSize);

		if (result) {
			this.isEmptyTable = !isFiltered && this.items.length == 0;
			param.cb(ditems, result.totalCount);
		} else {
			param.cb([], 0);
		}
		this.loadingSubject.next(false);
	}

	async onAction(param) {

		const ids = param.payload;
		const node = this.tableCtrl.gridApi.getRowNode(ids[0]);
		if (ids.length == 1) {
			if (node) {
				node.setSelected(this.tableCtrl.originSelectedRowIds.includes(ids[0]));
			}
		}

		if (param.type == 'VIEW') {
			if (this.activeTab.state == 'updated' || this.activeTab.state == 'created') {
				if (node.data) {
					this.viewCampaignDetail(node.data);
				}
			} else if (this.activeTab.state == 'warning') {
				this.viewWarningDetail(node.data);
			}
		} else if (param.type == 'EDIT') {
      if (this.activeTab.state == 'warning' || this.activeTab.state == 'error') {
        this.activeModal.dismiss();
        if (node.data.value) {
          const m = node.data.value.match(new RegExp('\((\\d) config\)'));
          if (m && m.length) {
            this.router.navigate(['/admin/sources/edit/' + node.data.sourceId], {queryParams: {config:m[m.length-1]}});
          } else {
            this.router.navigate(['/admin/sources/edit/' + node.data.sourceId]);
          }
        }
			}
    } else if (param.type == 'ENTER') {
			if (node && node.data && node.data.sourceLink) {
				window.open(node.data.sourceLink);
			}
		}
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
	onBack() {
		if (this.selectedItem) {
			if (this.isInfoOfDetail && this.infoKey) {
				this.isInfoOfDetail = false;
				this.infoKey = null;
			} else {
				this.selectedItem = null;
			}
			this.tableCtrl.willRefreshTable.next('COLUMNS');
		}
	}
	convertHtml(key, value, short = false){
		try {
			if (value) {
				const data = cloneDeep(value);
				switch(key) {
					case 'status':
						return data.split('_')[1];
					case 'endDate':
					case 'startDate':
						return date2string(data, this.locale, 'day');
          case 'previousEndDates':
            return data? data.map( el => date2string(el.value, this.locale, 'day')): [];
					case 'description':
						if (short) {
							return data.substring(0, 100) + (data.length > 100 ? '...': '');
						} else {
							return data;
						}
					case 'tags':
						{
							if (typeof data == 'object' && data.length > 0) {
								return data.map( el => this.categories.find( ell => ell._id == el))
								.filter( el => el).map( el => tag2category(el));
							} else {
								return [];
							}
						}
						break;
					case 'raised':
					case 'minimumGoal':
					case 'maximumGoal':
					case 'preMoneyEvaluation':
					case 'minimumInvestment':
						return this.addCommas(data);
					default:
						return data;
				}

			} else {
				return null;
			}
		} catch (error) {
		}
	}
	addCommas(nStr) {
		if (nStr == null) {
			return '';
		}
		if (typeof nStr != 'string') {
			nStr = Math.round((nStr + Number.EPSILON) * 100) / 100;
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

	viewCampaignDetail(param = true) {

		// param is next

		this.previewKeys = cloneDeep(this.defaultPreviewKeys);

		let data;
		if (param === true) {
			let isSelected = false; let selectedIndex;
			try {
				this.tableCtrl.gridApi.forEachNode( (node, index) => {

					if (node.data && node.data) {
						if (isSelected) {
							data = cloneDeep(node.data);
							if (index < this.tableCtrl.gridApi.paginationGetRowCount() - 1) {
								data.hasNext = true;
							}
							data.hasPrev = true;
							throw {};
						}
						if (this.selectedItem && node.data._id == this.selectedItem._id) {
							isSelected = true;
							selectedIndex = index;
						}
					}
				});
				if (isSelected && !data) {
					if (selectedIndex < this.tableCtrl.gridApi.paginationGetRowCount() - 1) {
						this.tableCtrl.gridApi.paginationGoToPage(this.tableCtrl.gridApi.paginationGetCurrentPage() + 1);
						setTimeout(() => {
							this.viewCampaignDetail(true);
						},100);
					}
				}
			} catch (error) {

			}

		} else if (param === false) {
			let preSelected;
			try {
				this.tableCtrl.gridApi.forEachNode( (node, index )=> {
					if (node.data && node.data) {
						if (this.selectedItem && node.data._id == this.selectedItem._id) {
							data = cloneDeep(preSelected);
							if (index > 1) {
								data.hasPrev = true;
							}
							data.hasNext = true;
							throw {};
						}
						preSelected = node.data;
					}
				});
			} catch (error) {

			}
		} else {
			try {
				data = cloneDeep(param);
				this.tableCtrl.gridApi.forEachNode( (node, index )=> {
					if (node.data && node.data && node.data._id == data._id) {
						if (index > 0) {
							data.hasPrev = true;
						}
						if (index < this.tableCtrl.gridApi.paginationGetRowCount() - 1){
							data.hasNext = true;
						}
						throw {};
					}
				});
			} catch (error) {
			}
		}

		if (data) {
			this.selectedItem = {};
			this.selectedItem._id = data._id;
			this.selectedItem.detailLink = window.location.origin + '/crowdfunding/' + data.systemTitle;
			this.selectedItem.originLink = data.link;
			this.previewKeys.forEach( el => {
				this.selectedItem[el.key] = {
					current: this.convertHtml(el.key, data[el.key]) || 'N/D',
				};
				if (el.detail) {
					this.selectedItem[el.key].currentShort = this.convertHtml(el.key, data[el.key], true);
				}
			});
      this.selectedItem.endDate.current = union(
        this.selectedItem.endDate.current ? [this.selectedItem.endDate.current]: ['N/D'],
        (data.previousEndDates || []).map( el => `(${date2string(el.value, this.locale, 'day')})`)
        );

			if (data.updatedFields) {
				data.updatedFields.forEach( item => {
					if (this.selectedItem[item.key]) {
						this.selectedItem[item.key].current = this.convertHtml(item.key ,item.current) || 'N/D';
						this.selectedItem[item.key].prev = this.convertHtml(item.key ,item.prev) || 'N/D';
						if (item.key == 'raised' || item.key == 'investorCount') {
							if (item.current && item.prev) {
								this.selectedItem[item.key].dx = `${item.current > item.prev ? '+': ''}${this.addCommas(item.current - item.prev)}`;
							}
						}
            if (item.key == 'endDate') {
              this.selectedItem[item.key].current = [this.selectedItem[item.key].current];
              this.selectedItem[item.key].prev = [this.selectedItem[item.key].prev];
            }
						const key = this.previewKeys.find(el => el.key == item.key);
						key.sort = 1;
						if (key && key.detail) {
							this.selectedItem[item.key].prevShort = this.convertHtml(item.key, item.prev, true);
						}
						this.selectedItem[item.key].class = 'bg-success text-white';
					}
				});
			}
			this.selectedItem.hasPrev = data.hasPrev;
			this.selectedItem.hasNext = data.hasNext;
			this.previewKeys.sort( (a,b) => {
				if (a.sort > b.sort) {
					return -1;
				} else if (a.sort == b.sort) {
					return 0;
				} else
					{return 1;}
			});
			this.cdr.detectChanges();
		}
	}
	viewWarningDetail(param = true) {

		// param is next

		let data;
		if (param === true) {
			let isSelected = false; let selectedIndex;
			try {
				this.tableCtrl.gridApi.forEachNode( (node, index) => {
					if (node.data && node.data.content) {
						if (isSelected) {
							data = cloneDeep(node.data);
							if (index < this.tableCtrl.gridApi.paginationGetRowCount() - 1) {
								data.hasNext = true;
							}
							data.hasPrev = true;
							throw {};
						}
						if (this.selectedItem && node.data.sourceId == this.selectedItem.sourceId) {
							isSelected = true;
							selectedIndex = index;
						}
					}
				});
				if (isSelected && !data) {
					if (selectedIndex < this.tableCtrl.gridApi.paginationGetRowCount() - 1) {
						this.tableCtrl.gridApi.paginationGoToPage(this.tableCtrl.gridApi.paginationGetCurrentPage() + 1);
						setTimeout(() => {
							this.viewWarningDetail(true);
						},100);
					}
				}
			} catch (error) {

			}

		} else if (param === false) {
			let preSelected;
			try {
				this.tableCtrl.gridApi.forEachNode( (node, index )=> {
					if (node.data && node.data.content) {
						if (this.selectedItem && node.data.sourceId == this.selectedItem.sourceId) {
							data = cloneDeep(preSelected);
							if (index > 1) {
								data.hasPrev = true;
							}
							data.hasNext = true;
							throw {};
						}
						preSelected = node.data;
					}
				});
			} catch (error) {

			}
		} else {
			try {
				data = cloneDeep(param);
				this.tableCtrl.gridApi.forEachNode( (node, index )=> {
					if (node.data && node.data.content && data.content && node.data.sourceId == data.sourceId) {
						if (index > 0) {
							data.hasPrev = true;
						}
						if (index < this.tableCtrl.gridApi.paginationGetRowCount() - 1){
							data.hasNext = true;
						}
						throw {};
					}
				});
			} catch (error) {
			}
		}

		if (data && data.content) {
			this.selectedItem = {};
			this.selectedItem.sourceId = data.sourceId;
			this.selectedItem.sourceName = data.sourceName;
			this.selectedItem.content = data.content;

			this.selectedItem.hasPrev = data.hasPrev;
			this.selectedItem.hasNext = data.hasNext;

			console.log(this.selectedItem);
			this.cdr.detectChanges();
		}
	}
	onKeyUp(e) {
		console.log(e);
	}
	onClickTab(item) {
		if (!item) {return;}
		this.activeTab = item;
		if (!(this.cdr as ViewRef).destroyed){
			this.cdr.detectChanges();
		}
		this.defineColumns();
		this.tableCtrl.onDeSelectAllButton();
		this.tableCtrl.willRefreshTable.next('DATA');
	}

	onSelectCampaignTypology(e) {
		this.tableCtrl.willRefreshTable.next('DATA');
	}
	onSelectCampaignCountry(e) {
		this.tableCtrl.willRefreshTable.next('DATA');
	}

	getIncreasedValue(typology) {
		return this.activeTab ? this.items.filter( el => el.state == this.activeTab.state && el.campaign && el.campaign.typology == typology)
		.reduce((carry, item) => {
			if (this.activeTab.state == 'created') {
				carry.raised += item.campaign.raised || 0;
				carry.investorCount += item.campaign.investorCount || 0;
			} else if (this.activeTab.state == 'updated') {
				const raised = item.updatedFields.find( el => el.key == 'raised');
				if (raised) {
					carry.raised += raised.current != null && raised.prev != null ? raised.current - raised.prev : 0;
				}
				const investorCount = item.updatedFields.find( el => el.key == 'investorCount');
				if (investorCount) {
					carry.investorCount += investorCount.current != null && investorCount.prev != null ? investorCount.current - investorCount.prev : 0;
				}
			}
			return carry;
		}, { raised: 0, investorCount: 0}): { raised: 0, investorCount: 0};
	}

	convertToPlain(html) {
		const tempDivElement = document.createElement('div');
		tempDivElement.innerHTML = html;
		const text = tempDivElement.textContent || tempDivElement.innerText || '';
		return text.substr(0, 40) + (text.length > 40 ? '...' : '');
	}

	async onClickEditComment(param) {
		const modalRef = this.modal.open(AddCommentDialog, { animation: false });
		modalRef.componentInstance.comment = param.sourceComment;
		const subscr = modalRef.closed.subscribe(async e => {
			if (e) {
				param.sourceComment = e;
				await this.sourceService.update({ _id: param.sourceId, comment: e });
				this.tableCtrl.willRefreshTable.next('DATA');
			} else {
				param.sourceComment = '';
				await this.sourceService.update({ _id: param.sourceId, comment: '' });
				this.tableCtrl.willRefreshTable.next('DATA');
			}
			setTimeout(() => subscr.unsubscribe(), 100);
		});
	}
}
