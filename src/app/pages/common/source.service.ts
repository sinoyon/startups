import { HttpClient } from '@angular/common/http';
import {Injectable, Inject} from '@angular/core';

import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { QueryResultsModel } from './models/query-results.model';
import { KTUtil } from 'src/app/_metronic/kt';
import { ToastService } from './toast.service';

const API_DAEMON_URL = environment.apiMSUrl;

@Injectable({
	providedIn: 'root'
})
export class SourceService {

	isLoading$: Observable<boolean>;
	isLoadingSubject: BehaviorSubject<boolean>;
	constructor(
		private http: HttpClient,
		private toastService: ToastService
    ) {
		this.isLoadingSubject = new BehaviorSubject<boolean>(false);
		this.isLoading$ = this.isLoadingSubject.asObservable();
	}

	getWithPagination(payload = null , projects = null): Promise<QueryResultsModel> {
		this.isLoadingSubject.next(true);
		return this.http.post<QueryResultsModel>(
			`${API_DAEMON_URL}/sources/me`,
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
	getRootWithPagination(payload = null , projects = null): Promise<QueryResultsModel> {
		this.isLoadingSubject.next(true);
		return this.http.post<QueryResultsModel>(
			`${API_DAEMON_URL}/sources/getRoot`,
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
			`${API_DAEMON_URL}/sources/${id}`,
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	getByName(name): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.get<any>(
			`${API_DAEMON_URL}/sources/byName/${name}`,
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	create(payload): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_DAEMON_URL}/sources`,
			payload,
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
			`${API_DAEMON_URL}/sources`,
			payload,
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	deleteByIds(ids, withCampaign = false): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_DAEMON_URL}/sources/deleteByIds`,
			{ ids, withCampaign},
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	duplicate(id): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_DAEMON_URL}/sources/duplicate`,
			{ id},
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	startScraping(payload): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_DAEMON_URL}/daemons/startScrapingBySourceId`,
			payload,
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	extractCampaignSectionsFromServer(payload): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_DAEMON_URL}/daemons/extractCampaignSections`,
			payload,
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	extractMainContentFromServer(payload): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_DAEMON_URL}/daemons/extractMainContent`,
			payload,
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => {
				if (err && err.error.message == 'RUNNING NIGHTMARE') {
					this.toastService.show('Server is running, please edit later');
				}
				return of(undefined);
			}),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	extractDetailContentFromServer(payload): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_DAEMON_URL}/daemons/extractDetailContent`,
			payload,
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}

	getValueByPeriod(payload, param = {}): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_DAEMON_URL}/sources/getValueByPeriod`,
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
	getAnalytics(payload): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_DAEMON_URL}/sources/getAnalytics`,
			payload,
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	downloadCSV(payload): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post(
			`${API_DAEMON_URL}/sources/downloadCSV`,
			payload,
			{
				headers: KTUtil.getAPIHeaders(),
				responseType: 'text'
			}
		).pipe(
			catchError( err => {
				console.log(err);
				return of(undefined);
			}),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	downloadCampaignsXLS(payload): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post(
			`${API_DAEMON_URL}/sources/downloadCampaignsXLS`,
			payload,
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
	downloadReportXLS(payload): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post(
			`${API_DAEMON_URL}/sources/downloadReportXLS`,
			payload,
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
	uploadPicture(formData): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_DAEMON_URL}/sources/uploadPicture`,
			formData,
			{
				headers: KTUtil.getAPIHeaders(false)
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	getCountByState(payload): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_DAEMON_URL}/sources/getCountByState`,
			payload,
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
}
