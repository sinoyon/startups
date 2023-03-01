import { HttpClient } from '@angular/common/http';
import {Injectable, Inject} from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { environment } from 'src/environments/environment';


import { KTUtil} from '../../_metronic/kt/index';

const API_MS_URL = environment.apiMSUrl;


@Injectable({
	providedIn: 'root'
})
export class AliasService {

	isLoading$: Observable<boolean>;
	isLoadingSubject: BehaviorSubject<boolean>;

	constructor(
		private http: HttpClient,
    ) {

		this.isLoadingSubject = new BehaviorSubject<boolean>(false);
		this.isLoading$ = this.isLoadingSubject.asObservable();
	}
	getFollowCategories(payload = null , projects = null, withInvolved = false): Promise<any> {
		return this.http.post<any>(
			`${API_MS_URL}/aliases/followCategories`,
			{
				...KTUtil.getAPIPaginationFromTblData(payload),
				projects,
				withInvolved
			},
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => {})
		).toPromise();
	}
	getAliasByName(name): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.get<any>(
			`${API_MS_URL}/aliases/byName/${name}`,
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	get(payload = null , projects = null, withInvolved = false): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/aliases/me`,
			{
				...KTUtil.getAPIPaginationFromTblData(payload),
				projects,
				withInvolved
			},
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	getDuplicated(payload = null , projects = null, withInvolved = false): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/aliases/getDuplicated`,
			{
				...KTUtil.getAPIPaginationFromTblData(payload),
				projects,
				withInvolved
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
			`${API_MS_URL}/aliases/${id}`,
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
			`${API_MS_URL}/aliases`,
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
			`${API_MS_URL}/aliases`,
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
			`${API_MS_URL}/aliases/deleteByIds`,
			{ ids},
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	merge(ids, mainId, name): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/aliases/merge`,
			{ ids, mainId, name},
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
  transform(ids, fromLanguage, toLanguage): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/aliases/transform`,
			{ ids, fromLanguage, toLanguage},
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	confirmByIds(ids): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/aliases/confirmByIds`,
			{ ids},
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	refresh(): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/aliases/refresh`,
			null,
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
			`${API_MS_URL}/aliases/getCountByState`,
			null,
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	getFavoriteCategories(userId): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/aliases/getFavoriteCategories`,
			{userId},
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	follow(userId, follow = true , id = null): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/aliases/follow`,
			{ userId, id, follow },
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	uploadPicture(formData): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/aliases/uploadPicture`,
			formData,
			{
				headers: KTUtil.getAPIHeaders(false)
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
	getValueByPeriod(payload, param = {}): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/aliases/getValueByPeriod`,
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
	getAnalyticsByPeriod(payload, param = {}): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_MS_URL}/aliases/getAnalyticsByPeriod`,
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
	downloadReportXLS(payload = {}, param = {}): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post(
			`${API_MS_URL}/aliases/downloadReportXLS`,
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
	async getTagIdsByName(param) {
		try {
			const res = await this.get({
				filterModel: {
					'names.value': {
						filterType: 'text',
						filter: param
					},
					ignore: {
						filterType: 'ne',
						value: true
					},
					type: {
						filterType: 'eq',
						value: 'campaign.tag'
					}
				},
				sortModel: [
					{ colId: 'name', sort: 'asc'}
				],
				startRow: 0,
				endRow: 0,
				pageSize: 100,
			});

			if (!res) {throw {};}

			return res.items.map( el => el._id);
		} catch (error) {

		}

		return [];
	}
}
