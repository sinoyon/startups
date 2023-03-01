import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { SocketService } from './socket.service';
import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from 'src/app/modules/auth';
import { environment } from 'src/environments/environment';
import { catchError, finalize } from 'rxjs/operators';

import { KTUtil} from '../../_metronic/kt/index';
import { TranslateService } from '@ngx-translate/core';

const API_URL = environment.apiUrl;

@Injectable({ providedIn: 'root'})

export class MessageService {

  messages$: Subject<any>;
  notification$: Subject<any>;
  userConnected$: Subject<any>;
  remoteUserConnection$: Subject<any>;
  scrapingProgress$: Subject<any>;
  chatAction$: Subject<any>;
  notifications$: BehaviorSubject<any[]>;

  isLoading$: Observable<boolean>;
	isLoadingSubject: BehaviorSubject<boolean>;

  private socketService: SocketService;

  user: any;

  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private translate: TranslateService
    ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
    this.messages$ = new Subject<any>();
    this.notification$ = new Subject<any>();
    this.notifications$ = new BehaviorSubject<any[]>([]);
    this.userConnected$ = new Subject<any>();
    this.remoteUserConnection$ = new Subject<any>();
    this.scrapingProgress$ = new Subject<any>();
    this.chatAction$ = new Subject<any>();

    this.auth.currentUserSubject.subscribe ( user => {
      if (user) {
        if (this.user && this.user._id != user._id) {
          if (this.socketService) {
            this.leave();
          };
          this.user = user;
          this.socketService = new SocketService('user/' + this.user._id);
          this.init();

        } else if (!this.user) {
          this.user = user;
          this.socketService = new SocketService('user/' + this.user._id);
          this.init();

        } else if (this.user._id == user._id) {
          this.user = user;
        }
      } else {
        if (this.socketService) {
          this.leave();
        };
        this.user = user;
      }
    });

    this.userConnected$.subscribe( el => {
      console.log('connected socket');
    });

    this.notification$.subscribe( param => {
      let alerts: any[] = this.notifications$.value;
      try {
        if (param.type != 'alert') {throw '';}

        if (param.subtype == 'chat') {
          if (param.action == 'read') {
            alerts = alerts.filter( item =>
              !(item.subtype == 'chat' && param._id == item._id));
          } else {
            if (!alerts.find( item => item.subtype == 'chat' && param._id == item._id)) {
              alerts.push({
                ...param,
                iconClass: param.subtype == 'chat' ? 'fa fa-rocketchat' : 'fa fa-question',
                time: param.data.createdAt,
              });
            }
          }
        } else if (param.subtype == 'notification') {
          const data = JSON.parse(param.data.data);
          const alert = alerts.find( el => el._id == param.data._id && el.subtype == 'notification');
          if (alert) {
            alert.read = param.read;
          } else {
            alerts.push({
              _id: param.data._id,
              title: this.translate.instant('NOTIFICATION.ALERT.' + param.data.type, data),
              action: data.detailPage || data.detailBlogPage,
              iconClass: param.subtype == 'chat' ? 'fa fa-rocketchat' : 'fa fa-question',
              pic: param.subtype == 'chat' ? null : data.pic,
              subtype: param.subtype,
              time: param.data.createdAt,
              read: param.read
            });
          }
        }

      } catch (error) {
        console.log(error);
      }

      this.notifications$.next(alerts);
    });
  }

  init() {

    this.socketService.chatMessages()
    .subscribe(
      message => {
        this.messages$.next(message);
      },
      error => console.log(error)
    );

    this.socketService.userConnections()
      .subscribe(
        message => {
          this.remoteUserConnection$.next(message);
        },
        error => console.log(error)
    );
    this.socketService.scrapingProgress()
      .subscribe(
        message => {
          this.scrapingProgress$.next(message);
        },
        error => console.log(error)
    );

    this.socketService.notification()
    .subscribe(
      message => {
        this.notification$.next({
          subtype: 'notification',
          type: 'alert',
          data: message
        });
      },
      error => console.log(error)
    );
    this.socketService.onConnect().subscribe(
      x => {},
      e => {
        console.log(e);
        if(this.user) {
          this.checkSocketByUserId(this.user._id).then( res => {
            console.log(res);
          });
        }
      },
      () => this.userConnected$.next(true)
    );

    this.socketService.onDisconnect().subscribe(
      x => {},
      e => {},
      () => this.userConnected$.next(false)
    );

    this.socketService.userChanged()
      .subscribe(
        message => {
          this.auth.getUserByToken().subscribe();
        },
        error => console.log(error)
    );
    this._loadUnreadNotifications().then( cn => {
      if (!cn) {this._loadAllNotifications();}
    });
  }

  leave(): void {
    this.socketService.socket.disconnect();
  }

  create(payload): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_URL}/messages`,
			payload,
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}

  getWithPagination(payload = null , projects = null): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_URL}/messages/me`,
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
  markAsRead(ids): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_URL}/messages/markAsRead`,
			{
        ids
			},
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
  }
  checkSocketByUserId(userId): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_URL}/users/checkSocketByUserId`,
			{
        userId
			},
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
  showDesktopNotification(param) {
    if (Notification.permission === 'granted') {
      const notification = new Notification(param.title, {
        body: param.body,
        icon: param.icon
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then( permission => {
        if (permission === 'granted') {
          const notification = new Notification(param.title, {
            body: param.body,
            icon: param.icon
          });
        }
      });
    }
  }
  getUnreadNotifications(): Promise<any[]> {
		this.isLoadingSubject.next(true);
		return this.http.post<any[]>(
			`${API_URL}/notifications/unread`, null,
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of([])),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
	}
  getNotificationWithPagination(payload = null , projects = null): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_URL}/notifications/me`,
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
  markNotificationAsRead(ids): Promise<any> {
		this.isLoadingSubject.next(true);
		return this.http.post<any>(
			`${API_URL}/notifications/markAsRead`,
			{
        ids
			},
			{
				headers: KTUtil.getAPIHeaders()
			}
		).pipe(
			catchError( err => of(undefined)),
			finalize(() => this.isLoadingSubject.next(false))
		).toPromise();
  }
  _markNotificationAsRead(ids) {
      const alerts: any[] = this.notifications$.value;

      alerts.forEach( el => {
        el.read = el.read || !ids || ids.length == 0 || ids.includes(el._id);
      });

      this.notifications$.next(alerts);
  }
  async _loadUnreadNotifications() {
		try {
      if (!this.user) {throw '';}
      this.notifications$.next([]);
			const res = await this.getUnreadNotifications();
			if (!res) {throw '';}

			res.forEach ( item => {
        this.notification$.next({
          subtype: 'notification',
          type: 'alert',
          data: item,
          read: false
        });
			});

      return res.length;

		} catch (error) {
			console.log(error);
		}
	}
  async _loadAllNotifications() {

		try {

      if (!this.user) {throw '';}
      this.notifications$.next([]);
			const res = await this.getNotificationWithPagination({
        filterModel: {
          users: {
            filterType: 'set',
            values: [this.user._id],
            isObject: true
          }
        },
        sortModel: [{ colId: 'createdAt', sort: 'DESC'}],
        startRow: 0,
        endRow: 0,
        pageSize: 200
      });
			if (!res) {throw '';}

			res.items.forEach ( item => {
        this.notification$.next({
          subtype: 'notification',
          type: 'alert',
          data: item,
          read: item.readBy && item.readBy.includes(this.user._id)
        });
			});

		} catch (error) {
			console.log(error);
		}
	}


}
