import { HttpClient } from '@angular/common/http';
import {Injectable} from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

import { KTUtil } from '../../_metronic/kt/index';

const API_MS_URL = environment.apiMSUrl;


@Injectable({
	providedIn: 'root'
})
export class CompanyService {

	isLoading$: Observable<boolean>;
	isLoadingSubject: BehaviorSubject<boolean>;

	constructor(
		private http: HttpClient
    ) {

		this.isLoadingSubject = new BehaviorSubject<boolean>(false);
		this.isLoading$ = this.isLoadingSubject.asObservable();
	}
	get(payload = null , projects = null): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/companies/me`,
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

	getDuplicated(payload = null , projects = null): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/companies/getDuplicated`,
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
			`${API_MS_URL}/companies/${id}`,
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
			`${API_MS_URL}/companies`,
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
			`${API_MS_URL}/companies`,
			payload,
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	search(payload): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/companies/search`,
			payload,
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	saveWithCampaign(companyPayload, campaignIds): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/companies/refreshByCampaign`,
			{ companyPayload, campaignIds} ,
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
			`${API_MS_URL}/companies/updateByIds`,
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
			`${API_MS_URL}/companies/deleteByIds`,
			{ ids},
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	reScrapCompanies(ids): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/companies/reScrapCompanies`,
			{ ids, all: ids ? false: true},
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	getCountByState(): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/companies/getCountByState`,
			null,
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
}
