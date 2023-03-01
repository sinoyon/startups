import { Injectable, OnDestroy } from '@angular/core';
import { Observable, BehaviorSubject, of, Subscription, Subject } from 'rxjs';
import { map, catchError, switchMap, finalize } from 'rxjs/operators';
import { UserModel } from '../_models/user.model';
import { AuthModel } from '../_models/auth.model';
import { AuthHTTPService } from './auth-http';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { intersection, union } from 'lodash';

export type UserType = UserModel | undefined;

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {

  userCountry = 'italy';
  // private fields
  private unsubscribe: Subscription[] = []; // Read more: => https://brianflove.com/2016/12/11/anguar-2-unsubscribe-observables/
  private authLocalStorageToken = `${environment.USERDATA_KEY}`;

  // public fields
  currentUser$: Observable<UserModel>;
  isLoading$: Observable<boolean>;
  currentUserSubject: BehaviorSubject<UserModel>;
  isLoadingSubject: BehaviorSubject<boolean>;

  currentPermissions: string[];

  dialogSubject: Subject<any>;

  get currentUserValue(): UserModel {
    return this.currentUserSubject.value;
  }

  set currentUserValue(user: UserModel) {
    this.currentUserSubject.next(user);
  }

  constructor(
    private authHttpService: AuthHTTPService,
    private router: Router
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.currentUserSubject = new BehaviorSubject<UserModel>(undefined);
    this.currentUser$ = this.currentUserSubject.asObservable();
    this.isLoading$ = this.isLoadingSubject.asObservable();
    this.dialogSubject = new Subject<any>();
    // const subscr = this.getUserByToken().subscribe();
    // this.unsubscribe.push(subscr);

    this.currentUserSubject.subscribe( user => {
      if (user) {
        const requiredTypologyPermission = ['crowdfunding data'];
        this.currentPermissions = [];
        if (user.hasRole) {
          user.roles.forEach ( role => {
            role.permissions.forEach( pm => {
              if (!this.currentPermissions.includes(pm.permission) && (pm.readable || pm.writable || pm.downloadable)) {
                if (requiredTypologyPermission.includes(pm.permission)) {
                  if (pm.typology.length) {
                    this.currentPermissions.push(pm.permission);
                  }
                } else {
                  this.currentPermissions.push(pm.permission);
                }
              }
            });
          });
        } else {
          user.permissions.forEach( pm => {
            if (!this.currentPermissions.includes(pm.permission) && (pm.readable || pm.writable || pm.downloadable)) {
              if (requiredTypologyPermission.includes(pm.permission)) {
                if (pm.typology.length) {
                  this.currentPermissions.push(pm.permission);
                }
              } else {
                this.currentPermissions.push(pm.permission);
              }
            }
          });
        }
      }
    });
  }

  hasPermission(name, allow = 'readable') {
    const user = this.currentUserSubject.value;
    const result = {countries: [], typologies: [], allowed: false, admin: false};
    try {
      if (user.isAdmin) {
        return {
          countries: user.countries,
          typologies: ['company equity', 'company lending', 'real estate lending', 'real estate equity', 'minibond'],
          allowed: true,
          admin: true
        };
      }
      if (user.hasRole) {
        user.roles.forEach ( role => {
          role.permissions.forEach( pm => {
            if (name != pm.permission) {return;}
            if (pm[allow]) {
              result.allowed = true;
              result.countries = union(result.countries, pm.country);
              result.typologies = union(result.typologies, pm.typology);
            }
          });
        });
      } else {
        user.permissions.forEach( pm => {
          if (name != pm.permission) {return;}
            if (pm[allow]) {
              result.allowed = true;
              result.countries = union(result.countries, pm.country);
              result.typologies = union(result.typologies, pm.typology);
            }
        });
      }
    } catch (error) {

    }
    return result;
  }

  // public methods
  login(email: string, password: string): Observable<UserModel> {
    this.isLoadingSubject.next(true);
    return this.authHttpService.login(email, password).pipe(
      map((auth: AuthModel) => {
        const result = this.setAuthFromLocalStorage(auth);
        return result;
      }),
      switchMap(() => this.getUserByToken()),
      catchError((err) => of(undefined)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  logout(withRedirect = true) {
    localStorage.removeItem(this.authLocalStorageToken);
    this.currentUserSubject.next(null);
    if (withRedirect) {
      this.router.navigate(['/']);
    }
  }

  getUserByToken(): Observable<UserModel> {
    const auth = this.getAuthFromLocalStorage();
    if (!auth || !auth.accessToken) {
      return of(undefined);
    }

    this.isLoadingSubject.next(true);
    return this.authHttpService.getUserByToken(auth.accessToken).pipe(
      map((user: UserModel) => {
        if (user) {
          this.currentUserSubject.next(user);
        } else {
          this.logout();
        }
        return user;
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  getById(id): Observable<UserModel> {
    return this.authHttpService.getUserById(id).pipe(
      map((user: UserModel) => {
        if (user) {
          return user;
        }
      }),
      finalize(() => {})
    );
  }

  // need create new user then login
  registration(user: UserModel): Observable<any> {
    this.isLoadingSubject.next(true);
    return this.authHttpService.createUser(user).pipe(
      map((auth: AuthModel) => {
        const result = this.setAuthFromLocalStorage(auth);
        return result;
      }),
      switchMap(() => this.getUserByToken()),
      catchError((err) => {
        console.error('err', err);
        return of(undefined);
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  forgotPassword(email: string): Observable<boolean> {
    this.isLoadingSubject.next(true);
    return this.authHttpService
      .forgotPassword(email)
      .pipe(
        catchError((err) => {
          console.error('err', err);
          return of(undefined);
        }),
        finalize(() => this.isLoadingSubject.next(false)));
  }

  verifyEmail(token: string): Observable<UserModel> {
    this.isLoadingSubject.next(true);
    return this.authHttpService
      .verifyEmail(token)
      .pipe(
        map((auth: AuthModel) => {
          const result = this.setAuthFromLocalStorage(auth);
          return result;
        }),
        switchMap(() => this.getUserByToken()),
        catchError((err) => {
          console.error('err', err);
          return of(undefined);
        }),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }
  resetPassword(password: string, token: string): Observable<UserModel> {
    this.isLoadingSubject.next(true);
    return this.authHttpService
      .resetPassword(password, token)
      .pipe(
        map((auth: AuthModel) => {
          const result = this.setAuthFromLocalStorage(auth);
          return result;
        }),
        switchMap(() => this.getUserByToken()),
        catchError((err) => {
          console.error('err', err);
          return of(undefined);
        }),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  setAuthFromLocalStorage(auth: AuthModel): boolean {
    // store auth accessToken/refreshToken/epiresIn in local storage to keep user logged in between page refreshes
    if (auth && auth.accessToken) {
      localStorage.setItem(this.authLocalStorageToken, JSON.stringify(auth));
      return true;
    }
    return false;
  }

  getAuthFromLocalStorage(): AuthModel {
    try {
      const authData = JSON.parse(
        localStorage.getItem(this.authLocalStorageToken)
      );
      return authData;
    } catch (error) {
      console.log(error);
      localStorage.removeItem(this.authLocalStorageToken);
      return undefined;
    }
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }

  loginWithLinkedIn(code, redirect_uri): Observable<UserModel> {
    this.isLoadingSubject.next(true);
    return this.authHttpService.loginWithLinkedIn(code, redirect_uri).pipe(
      map((auth: AuthModel) => {
        const result = this.setAuthFromLocalStorage(auth);
        return result;
      }),
      switchMap(() => this.getUserByToken()),
      catchError((err) => {
        console.error('err', err);
        return of(undefined);
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
  registrationWithLinkedIn(payload): Observable<UserModel> {
    this.isLoadingSubject.next(true);
    return this.authHttpService.registrationWithLinkedIn(payload).pipe(
      map((auth: AuthModel) => {
        const result = this.setAuthFromLocalStorage(auth);
        return result;
      }),
      switchMap(() => this.getUserByToken()),
      catchError((err) => {
        console.error('err', err);
        return of(undefined);
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
}
