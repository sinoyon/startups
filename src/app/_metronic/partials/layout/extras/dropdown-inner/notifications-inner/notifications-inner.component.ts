import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Subscription } from 'rxjs/internal/Subscription';
import { MessageService } from 'src/app/pages/common/message.service';
import { date2string } from 'src/app/pages/common/common';

@Component({
  selector: 'app-notifications-inner',
  templateUrl: './notifications-inner.component.html',
})
export class NotificationsInnerComponent implements OnInit {

  locale = 'it-IT';
  alerts$: Observable<any>;
	user;
	all = false;

	get unread(): number {
		return this.messageService.notifications$.value.filter( el => !el.read).length;
	}


  private unsubscribe: Subscription[] = [];

  constructor(
		private messageService: MessageService) {

      this.alerts$ = this.messageService.notifications$.asObservable();
  }

  ngOnInit(): void {

  }
  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
  date2string(param) {
    return date2string(param, this.locale);
  }

	onAction(param) {
		if (!param.action || param.action == '') {return;}
		window.open(param.action);
		if (param.read) {return;}
		param.read = true;
		this.messageService.markNotificationAsRead([param._id]);
	}

	async onClickMarkAsRead(param){
    let ids;
    try {
      if (!param) {
        ids = this.messageService.notifications$.value.filter( el => el.subtype == 'notification' && !el.read).map( el => el._id);
      } else {
        ids = this.messageService.notifications$.value.filter( el => el.subtype == 'notification' && param._id == el._id).map( el => el._id);
      }
      if (!ids.length) {throw {};}

      await this.messageService.markNotificationAsRead(ids);
      this.messageService._markNotificationAsRead(ids);
    }catch (error) {

    }
    try{
      if (!param) {
        ids = this.messageService.notifications$.value.filter( el => el.subtype == 'chat' && !el.read).map( el => el._id);
      } else {
        ids = this.messageService.notifications$.value.filter( el => el.subtype == 'chat' && param._id == el._id).map( el => el._id);
      }
      if (!ids.length) {throw {};}
      await this.messageService.markAsRead(ids);
      this.messageService._markNotificationAsRead(ids);
    } catch (error) {

    }
	}
	showAll(isAll) {
		this.all = isAll;
		if (this.all) {
			this.messageService._loadAllNotifications();
		} else {
			this.messageService._loadUnreadNotifications();
		}
	}
}
