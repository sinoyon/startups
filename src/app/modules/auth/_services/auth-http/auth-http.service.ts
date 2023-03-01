import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserModel } from '../../_models/user.model';
import { environment } from '../../../../../environments/environment';
import { AuthModel } from '../../_models/auth.model';

const API_USERS_URL = `${environment.apiUrl}/users`;

@Injectable({
  providedIn: 'root',
})
export class AuthHTTPService {
  constructor(private http: HttpClient) { }

  // public methods
  login(email: string, password: string): Observable<any> {
    return this.http.post<AuthModel>(`${API_USERS_URL}/login`,   { email, password });
  }

  loginWithLinkedIn(code: string, redirect_uri): Observable<any> {
    return this.http.post<AuthModel>(`${API_USERS_URL}/loginWithLinkedIn`,   { code, redirect_uri });
  }

  registrationWithLinkedIn(payload): Observable<any> {
    return this.http.post<AuthModel>(`${API_USERS_URL}/createWithLinkedIn`,   payload);
  }

  // CREATE =>  POST: add a new user to the server
  createUser(user: UserModel): Observable<UserModel> {
    return this.http.post<UserModel>(API_USERS_URL, user);
  }

  // Your server should check email => If email exists send link to the user and return true | If email doesn't exist return false
  forgotPassword(email: string): Observable<boolean> {
    return this.http.post<boolean>(`${API_USERS_URL}/forgot`, {
      email,
    });
  }
  verifyEmail(token): Observable<UserModel> {
    if (!token) {return of(null);}

    let httpHeaders = new HttpHeaders();
    httpHeaders = httpHeaders.set('authorization', 'Bearer ' + token);

    return this.http.post<UserModel>(`${API_USERS_URL}/verifyEmail`, {}, { headers: httpHeaders });
  }
  resetPassword(password, token): Observable<UserModel> {
    if (!token) {return of(null);}

    let httpHeaders = new HttpHeaders();
    httpHeaders = httpHeaders.set('authorization', 'Bearer ' + token);

    return this.http.post<UserModel>(`${API_USERS_URL}/resetPassword`, { password }, { headers: httpHeaders });
  }

  getUserByToken(token): Observable<UserModel> {
    const httpHeaders = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.post<UserModel>(`${API_USERS_URL}/getByToken`,{}, {
      headers: httpHeaders,
    });
  }

  getUserById(id): Observable<UserModel> {
    return this.http.post<UserModel>(`${API_USERS_URL}/getById`, { id: id });
  }
}
