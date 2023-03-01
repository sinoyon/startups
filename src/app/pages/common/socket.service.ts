
import { Observable } from 'rxjs';
import { io } from 'socket.io-client';
import { environment } from 'src/environments/environment';

export class SocketService{
  private host: string = environment.wsUrl;
  socket;

  constructor(private name: string) {
    const socketUrl = this.host + '/' + this.name;
    this.socket = io(socketUrl, {path: '/api/socket.io'});
  }

  userChanged(): Observable<any> {
    return Observable.create(observer => {
      this.socket.on('USER_CHANGED', (item: any) => observer.next(item));
    });
  }

  // Get chat message observable
  chatMessages(): Observable<any> {
    return Observable.create(observer => {
      this.socket.on('CHAT_MESSAGE', (item: any) => observer.next(item));
    });
  }
  // Get user connection observable
  userConnections(): Observable<any> {
    return Observable.create(observer => {
      this.socket.on('USER_CONNECTION', (item: any) => observer.next(item));
    });
  }

  // Get scraping connection observable
  scrapingProgress(): Observable<any> {
    return Observable.create(observer => {
      this.socket.on('SCRAPING_PROGRESS', (item: any) => observer.next(item));
    });
  }

  // Get scraping connection observable
  notification(): Observable<any> {
    return Observable.create(observer => {
      this.socket.on('NOTIFICATION', (item: any) => observer.next(item));
    });
  }

  // Request initial list when connected
  list(): void {
    this.socket.emit('list');
  }


  // Create signal
  create(params: any) {
    this.socket.emit('create', params);
  }

  // Remove signal
  remove(params: any) {
    this.socket.emit('remove', params);
  }

  onConnect(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('connect', () => observer.complete());
    });
  }

  onDisconnect(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('disconnect', () => observer.complete());
    });
  }
}
