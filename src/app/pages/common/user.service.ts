import { HttpClient } from '@angular/common/http';
import {Injectable, Inject} from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

import { getAPIPaginationFromTblData, getAPIHeaders} from '../../_metronic/kt/_utils/index';

const API_URL = environment.apiUrl;

@Injectable({
	providedIn: 'root'
})
export class UserService {

	isLoading$: Observable<boolean>;
	isLoadingSubject: BehaviorSubject<boolean>;

	constructor(
		private http: HttpClient,
    ) {
		this.isLoadingSubject = new BehaviorSubject<boolean>(false);
		this.isLoading$ = this.isLoadingSubject.asObservable();
	}

	get(payload = null , projects = null, withWallet = false): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_URL}/users/me`,
			{
				...getAPIPaginationFromTblData(payload),
				projects,
				withWallet
			},
			{
				headers: getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	getById(id): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.get<any>(
			`${API_URL}/users/${id}`,
			{
				headers: getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	getRoles(payload = null , projects = null): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_URL}/users/roles/me`,
			{
				...getAPIPaginationFromTblData(payload),
				projects,
			},
			{
				headers: getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	getRoleById(id): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.get<any>(
			`${API_URL}/users/roles/${id}`,
			{
				headers: getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	create(payload): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_URL}/users`,
			payload,
			{
				headers: getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	update(payload): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.put<any>(
			`${API_URL}/users`,
			payload,
			{
				headers: getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	createRole(payload): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_URL}/users/roles`,
			payload,
			{
				headers: getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	updateRole(payload): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.put<any>(
			`${API_URL}/users/roles`,
			payload,
			{
				headers: getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	deleteByIds(ids): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_URL}/users/deleteByIds`,
			{ ids},
			{
				headers: getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	deleteRolesByIds(ids): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_URL}/users/roles/deleteByIds`,
			{ ids},
			{
				headers: getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	check(payload): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_URL}/users/check`,
			payload,
			{
				headers: getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	getConnectionDates(payload): Promise<any[]> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_URL}/users/getConnectionDates`,
			payload,
			{
				headers: getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	sendVerifyEmail(ids): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_URL}/users/sendVerifyEmail`,
			{ ids },
			{
				headers: getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}

	uploadPicture(formData): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_URL}/users/uploadPicture`,
			formData,
			{
				headers: getAPIHeaders(false)
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	getValueByPeriod(payload = null , param = {}): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_URL}/users/getValueByPeriod`,
			{
				...getAPIPaginationFromTblData(payload),
				...param
			},
			{
				headers: getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	getAnalyticsByPeriod(payload = null , param = {}): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_URL}/users/getAnalyticsByPeriod`,
			{
				...getAPIPaginationFromTblData(payload),
				...param
			},
			{
				headers: getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	getCountByState(): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_URL}/users/getCountByState`,
			null,
			{
				headers: getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
}
