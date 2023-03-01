import { HttpClient } from '@angular/common/http';
import {Injectable, Inject} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

import { KTUtil } from '../../_metronic/kt/index';

const API_MS_URL = environment.apiMSUrl;

@Injectable({
	providedIn: 'root'
})
export class CampaignService {

	isLoading$: Observable<boolean>;
	isLoadingSubject: BehaviorSubject<boolean>;

	search$: Subject<any> = new Subject<any>();


	constructor(
		private http: HttpClient,
		private meta: Meta,
		private titleService: Title,
    ) {

		this.isLoadingSubject = new BehaviorSubject<boolean>(false);
		this.isLoading$ = this.isLoadingSubject.asObservable();

	}
	generateTags(param) {
		const config = {
		  title: 'Aggregators Equity Crowdfunding',
		  ogTitle: 'Aggergatore crowdfunding',
		  description: 'Investi in Startup, PMI e/o in progetti immobiliari attraverso l’aggregatore di lending , minibond ed equity crowdfunding dei principali portali italiani',
		  ogDescription: 'Aggregatore di campagne per investimenti in startup e PMI Italiane tramite equity crowdfunding provenienti dai portali crowdfundme, mamacrowd, backdoor,  wearestarting, 200crowd, opstar, nextequity, thebestequity, forcrowd, lita, extrafunding, ecomill iscritti alla consob',
		  slug: '',
		  image: './assets/media/misc/og-image.png',

		  ...param
		};
		this.titleService.setTitle(config.title);
		this.meta.updateTag({ name: 'description', content: config.description });
		this.meta.updateTag({ property: 'og:type', content: 'article' });
		this.meta.updateTag({ property: 'og:site_name', content: 'content' });
		this.meta.updateTag({ property: 'og:title', content: config.ogTitle });
		this.meta.updateTag({ property: 'og:description', content: config.ogDescription });
		this.meta.updateTag({ property: 'og:image', content: config.image });
		this.meta.updateTag({ property: 'og:url', content: `https://startupswallet.com/crowdfunding/${config.slug}` });
	}

	getFCampaigns(payload = null , projects = null): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/campaigns/getFollows`,
			{
				...KTUtil.getAPIPaginationFromTblData(payload),
				projects
			},
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}

	get(payload = null , projects = null): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/campaigns/me`,
			{
				...KTUtil.getAPIPaginationFromTblData(payload),
				projects
			},
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	getDuplicated(payload = null , projects = null, withCheckLink = false): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/campaigns/getDuplicated`,
			{
				...KTUtil.getAPIPaginationFromTblData(payload),
				projects,
				withCheckLink
			},
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}

	noValid(payload = null , projects = null): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/campaigns/novalid`,
			{
				...KTUtil.getAPIPaginationFromTblData(payload),
				projects
			},
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}

	getById(id): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.get<any>(
			`${API_MS_URL}/campaigns/${id}`,
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	getBySystemTitle(systemTitle): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.get<any>(
			`${API_MS_URL}/campaigns/getBySystemTitle/${systemTitle}`,
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	update(payload): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.put<any>(
			`${API_MS_URL}/campaigns`,
			payload,
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	updateByIds(payload): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/campaigns/updateByIds`,
			payload,
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	confirmCompany(payload): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/campaigns/confirmCompany`,
			payload,
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	deleteByIds(ids): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/campaigns/deleteByIds`,
			{ ids},
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	restoreSourceByIds(ids): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/campaigns/restoreSourceByIds`,
			{ ids},
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	mergeByIds(ids, mainId): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/campaigns/mergeByIds`,
			{ ids, mainId },
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	generateLocationByIds(ids): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/campaigns/updateLocationByIds`,
			{ ids },
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	getCountByState(typologies, countries, withCheckLink = false): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/campaigns/getCountByState`,
			{ typologies, countries, withCheckLink },
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	getCSR(payload): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/campaigns/getCSR`,
			payload,
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	getActiveCategories(): Promise<any[]> {
		this.isLoadingSubject.next(true);
		return this.http.post<any[]>(
			`${API_MS_URL}/campaigns/getActiveCategories`,
			null,
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	follow(campaignId, userId, follow = true): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/campaigns/follow`,
			{ campaignId, userId, follow},
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	action(campaignId, type, from = null): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/campaigns/action`,
			{ campaignId, type, from},
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	getLatLng(payload = null): Promise<any[]> {
		this.isLoadingSubject.next(true);
		return this.http.post<any[]>(
			`${API_MS_URL}/campaigns/getLatLng`,
			{
				...KTUtil.getAPIPaginationFromTblData(payload)
			},
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	getValueForLocationByPeriod(payload, param = {}): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/campaigns/getValueForLocationByPeriod`,
			{
				...KTUtil.getAPIPaginationFromTblData(payload),
				...param
			},
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	downloadReportXLS(payload = null , param = {}): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post(
			`${API_MS_URL}/campaigns/downloadReportXLS`,
			{
				...KTUtil.getAPIPaginationFromTblData(payload),
				...param
			},
			{
				headers: KTUtil.getAPIHeaders(),
				responseType: 'blob'
			}
		).pipe(
			catchError( err => {
				console.log(err);
				return of(undefined);
			}),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	downloadCampaignXLS(payload = null , param = {}): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post(
			`${API_MS_URL}/campaigns/downloadCampaignXLS`,
			{
				...KTUtil.getAPIPaginationFromTblData(payload),
				...param
			},
			{
				headers: KTUtil.getAPIHeaders(),
				responseType: 'blob'
			}
		).pipe(
			catchError( err => {
				console.log(err);
				return of(undefined);
			}),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	downloadLocationReportXLS(payload = {}, param = {}): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post(
			`${API_MS_URL}/campaigns/downloadLocationReportXLS`,
			{
				...KTUtil.getAPIPaginationFromTblData(payload),
				...param
			},
			{
				headers: KTUtil.getAPIHeaders(),
				responseType: 'blob'
			}
		).pipe(
			catchError( err => {
				console.log(err);
				return of(undefined);
			}),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	getValueByPeriod(payload = null , param = {}): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/campaigns/getValueByPeriod`,
			{
				...KTUtil.getAPIPaginationFromTblData(payload),
				...param
			},
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	getAnalyticsByPeriod(payload = null , param = {}): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/campaigns/getAnalyticsByPeriod`,
			{
				...KTUtil.getAPIPaginationFromTblData(payload),
				...param
			},
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	getDuplicatedById(campaignId): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/campaigns/getDuplicatedById`,
			{ campaignId },
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	mergeBySource(sourceId): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/campaigns/mergeBySource`,
			{ sourceId },
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
  getRegions(payload = null, param = {} ): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/campaigns/getRegions`,
			{
				...KTUtil.getAPIPaginationFromTblData(payload),
        ...param
			},
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}

	getFromLocation(payload = null , projects = null): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/campaigns/getFromLocation`,
			{
				...KTUtil.getAPIPaginationFromTblData(payload),
				projects
			},
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
}
