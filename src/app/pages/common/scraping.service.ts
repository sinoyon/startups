import { HttpClient } from '@angular/common/http';
import {Injectable, Inject} from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { KTUtil } from 'src/app/_metronic/kt';
import { environment } from 'src/environments/environment';
import { QueryResultsModel } from './models/query-results.model';
import { countries } from './constant';

const API_DAEMON_URL = environment.apiMSUrl;

@Injectable({
	providedIn: 'root'
})
export class ScrapingService {

	isLoading$: Observable<boolean>;
	isLoadingSubject: BehaviorSubject<boolean>;

	constructor(
		private http: HttpClient,
    ) {
		this.isLoadingSubject = new BehaviorSubject<boolean>(false);
		this.isLoading$ = this.isLoadingSubject.asObservable();
	}
	getWithPagination(payload = null , countries = null): Promise<QueryResultsModel> {
		this.isLoadingSubject.next(true);
		return this.http.post<QueryResultsModel>(
			`${API_DAEMON_URL}/daemons/me`,
			{
				...KTUtil.getAPIPaginationFromTblData(payload),
				countries
			},
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
  getBackupWithPagination(payload = null , countries = null): Promise<QueryResultsModel> {
		this.isLoadingSubject.next(true);
		return this.http.post<QueryResultsModel>(
			`${API_DAEMON_URL}/daemons/backup/me`,
			{
				...KTUtil.getAPIPaginationFromTblData(payload),
				countries
			},
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	getProgress(payload = null): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_DAEMON_URL}/daemons/progress`,
			payload,
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	start(countries = []): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_DAEMON_URL}/daemons/start`,
			{countries},
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	stop(): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_DAEMON_URL}/daemons/stop`,
			{},
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
			`${API_DAEMON_URL}/daemons/${id}`,
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
  getBackupById(id): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.get<any>(
			`${API_DAEMON_URL}/daemons/backup/${id}`,
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
			`${API_DAEMON_URL}/daemons/deleteByIds`,
			{ ids },
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
  backup(): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_DAEMON_URL}/daemons/backup`,{},
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
}
