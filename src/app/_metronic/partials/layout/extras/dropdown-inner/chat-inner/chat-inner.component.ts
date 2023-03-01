import { TranslateService } from '@ngx-translate/core';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostBinding,
  Input,
  OnInit,
  ViewChild,
  ViewRef,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ResizeEvent } from 'angular-resizable-element';
import { setTime } from 'ngx-bootstrap/chronos/utils/date-setters';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { AuthService, UserModel } from 'src/app/modules/auth';
import { MessageService } from 'src/app/pages/common/message.service';
import { RoomService } from 'src/app/pages/common/room.service';
import { UserService } from 'src/app/pages/common/user.service';
import { ScrollComponent, DrawerComponent } from 'src/app/_metronic/kt/components';
import { environment } from 'src/environments/environment';


interface MessageModel {
  user: number;
  type: 'in' | 'out';
  text: string;
  time: string;
  template?: boolean;
}

const defaultMessages: Array<MessageModel> = [
  {
    user: 4,
    type: 'in',
    text: 'How likely are you to recommend our company to your friends and family ?',
    time: '2 mins',
  },
  {
    user: 2,
    type: 'out',
    text: 'Hey there, we’re just writing to let you know that you’ve been subscribed to a repository on GitHub.',
    time: '5 mins',
  },
  {
    user: 4,
    type: 'in',
    text: 'Ok, Understood!',
    time: '1 Hour',
  },
  {
    user: 2,
    type: 'out',
    text: 'You’ll receive notifications for all issues, pull requests!',
    time: '2 Hours',
  },
  {
    user: 4,
    type: 'in',
    text: 'You can unwatch this repository immediately by clicking here: <a href="https://keenthemes.com">Keenthemes.com</a>',
    time: '3 Hours',
  },
  {
    user: 2,
    type: 'out',
    text: 'Most purchased Business courses during this sale!',
    time: '4 Hours',
  },
  {
    user: 4,
    type: 'in',
    text: 'Company BBQ to celebrate the last quater achievements and goals. Food and drinks provided',
    time: '5 Hours',
  },
  {
    template: true,
    user: 2,
    type: 'out',
    text: '',
    time: 'Just now',
  },
  {
    template: true,
    user: 4,
    type: 'in',
    text: 'Right before vacation season we have the next Big Deal for you.',
    time: 'Just now',
  },
];

interface UserInfoModel {
  initials?: {
    label: string;
    state: 'warning' | 'danger' | 'primary' | 'success' | 'info';
  };
  name: string;
  avatar?: string;
  email: string;
  position: string;
  online: boolean;
}

const defaultUserInfos: Array<UserInfoModel> = [
  {
    name: 'Emma Smith',
    avatar: 'avatars/150-1.jpg',
    email: 'e.smith@kpmg.com.au',
    position: 'Art Director',
    online: false,
  },
  {
    name: 'Melody Macy',
    initials: { label: 'M', state: 'danger' },
    email: 'melody@altbox.com',
    position: 'Marketing Analytic',
    online: true,
  },
  {
    name: 'Max Smith',
    avatar: 'avatars/150-2.jpg',
    email: 'max@kt.com',
    position: 'Software Enginer',
    online: false,
  },
  {
    name: 'Sean Bean',
    avatar: 'avatars/150-4.jpg',
    email: 'sean@dellito.com',
    position: 'Web Developer',
    online: false,
  },
  {
    name: 'Brian Cox',
    avatar: 'avatars/150-15.jpg',
    email: 'brian@exchange.com',
    position: 'UI/UX Designer',
    online: false,
  },
  {
    name: 'Mikaela Collins',
    initials: { label: 'M', state: 'warning' },
    email: 'mikaela@pexcom.com',
    position: 'Head Of Marketing',
    online: true,
  },
  {
    name: 'Francis Mitcham',
    avatar: 'avatars/150-8.jpg',
    email: 'f.mitcham@kpmg.com.au',
    position: 'Software Arcitect',
    online: false,
  },

  {
    name: 'Olivia Wild',
    initials: { label: 'O', state: 'danger' },
    email: 'olivia@corpmail.com',
    position: 'System Admin',
    online: true,
  },
  {
    name: 'Neil Owen',
    initials: { label: 'N', state: 'primary' },
    email: 'owen.neil@gmail.com',
    position: 'Account Manager',
    online: true,
  },
  {
    name: 'Dan Wilson',
    avatar: 'avatars/150-6.jpg',
    email: 'dam@consilting.com',
    position: 'Web Desinger',
    online: false,
  },
  {
    name: 'Emma Bold',
    initials: { label: 'E', state: 'danger' },
    email: 'emma@intenso.com',
    position: 'Corporate Finance',
    online: true,
  },
  {
    name: 'Ana Crown',
    avatar: 'avatars/150-7.jpg',
    email: 'ana.cf@limtel.com',
    position: 'Customer Relationship',
    online: false,
  },
  {
    name: 'Robert Doe',
    initials: { label: 'A', state: 'info' },
    email: 'robert@benko.com',
    position: 'Marketing Executive',
    online: true,
  },
  {
    name: 'John Miller',
    avatar: 'avatars/150-17.jpg',
    email: 'miller@mapple.com',
    position: 'Project Manager',
    online: false,
  },
  {
    name: 'Lucy Kunic',
    initials: { label: 'L', state: 'success' },
    email: 'lucy.m@fentech.com',
    position: 'SEO Master',
    online: true,
  },
  {
    name: 'Ethan Wilder',
    avatar: 'avatars/150-10.jpg',
    email: 'ethan@loop.com.au',
    position: 'Accountant',
    online: true,
  },
];

const messageFromClient: MessageModel = {
  user: 4,
  type: 'in',
  text: 'Thank you for your awesome support!',
  time: 'Just now',
};

@Component({
  selector: 'app-chat-inner',
  templateUrl: './chat-inner.component.html',
  styleUrls: ['./chat-inner.component.scss']
})
export class ChatInnerComponent implements OnInit {


  @Input() isDrawer = false;
  @HostBinding('class') class = 'card w-100 rounded-0';
  @HostBinding('id') id = 'kt_drawer_chat_messenger';

  loadingSubject = new BehaviorSubject<boolean>(true);
	loading$: Observable<boolean>;
	loading = false;
	locale = 'it-IT';
	loadResult: any[] = [];

  chatCanvas: DrawerComponent;

	user;

	favoriteQuery: any;
	chatsQuery: any;
	messageQuery: any;
	inside = false;
	selectedRoom;

	unreadRooms = [];
	registerForm: FormGroup;

	@ViewChild('scroll', {static: false}) scroll: ElementRef;

	unsubscribe: Subscription[] = [];
	constructor(
		private messageService: MessageService,
		private auth: AuthService,
		private userService: UserService,
		private roomService: RoomService,
		private fb: FormBuilder,
		private cdr: ChangeDetectorRef,
		private translate: TranslateService
	) {
	}

	ngOnInit(): void {
		this.unsubscribe.push(this.auth.currentUserSubject.subscribe ( async user => {
			if (user && (!this.user || this.user._id != user._id)) {
				this.user = user;
				if (!(this.cdr as ViewRef).destroyed){
					this.cdr.detach();
				}
				try {
					if (!user.isAdmin) {
						const room = await this.roomService.createWithAdmin(user._id);
						await this.setSelectedRoom(room);
					} else {
						await this.loadUnreadRooms();
						this.initRoomQuery();
						await this.loadRooms();
					}
				} catch (error) {
				}
				if (!(this.cdr as ViewRef).destroyed){
					this.cdr.reattach();
					this.cdr.detectChanges();
				}
			} else if (!user) {
				this.user = null;
			}
		}));
		this.unsubscribe.push(this.messageService.chatAction$.subscribe( param => {
			this.onContactWithSupport();
		}));
		this.registerForm = this.fb.group({
			firstName: [''],
			lastName: [''],
			email: ['', Validators.compose([
				Validators.email,
			]),
			],
		});
		this.loadingSubject.subscribe( _incomingValue => {
			this.loading = _incomingValue;
		});
		this.loadingSubject.next(false);

		document.addEventListener('keydown', (e: any) => {
			if (e.target.tagName == 'MAIN') {
				if (e.key == 'Enter' && e.shiftKey == false) {
					e.stopPropagation();
					e.preventDefault();
					const message = e.target.innerText;
					this.insertMessage(message).then();
					e.target.innerHTML = '';
				}
			}
		});
		document.addEventListener('keyup', (e: any) => {
			if (e.target.tagName == 'MAIN') {
				const sendButton = document.getElementById('send_chat_message_button');
				if (sendButton) {
					if (e.target.innerText.trim() != '') {
						sendButton.style.display = 'flex';
					} else if (e.key == 'Enter' && e.shiftKey == false){
						sendButton.style.display = 'none';
					} else {
						sendButton.style.display = 'none';
					}
				}
			}
		});

		this.unsubscribe.push(this.messageService.messages$.subscribe( async message => {
			try {
				const item = {...message};
				if (!(this.chatCanvas && this.chatCanvas.element.classList.contains('drawer-on'))) {
					this.messageService.showDesktopNotification({
						title: this.translate.instant('OTHERS.Startupswallet chat message have been received'),
						body: item.message
					});
				}
				if (this.messageQuery && this.selectedRoom && this.selectedRoom._id == item.room &&this.selectedRoom.type != 'people') {
					const user = this.selectedRoom.users.find( el => el._id == item.from);
					const nextItem = this.messageQuery.result[0];
					item.from = user;
					item.start = !nextItem || (nextItem.from._id != item.from._id);
					item.me = item.from._id == this.user._id;
					item.from.pic = item.from.pic || './assets/media/users/default.jpg';
					item.createdTime = this.getDateTimeFromDate(item.createdAt);
					this.messageQuery.result.splice(0,0, item);
					if (!(this.cdr as ViewRef).destroyed){
						this.cdr.detectChanges();
					}
					if (this.chatCanvas && this.chatCanvas.element.classList.contains('drawer-on')) {
						await this.messageService.markAsRead([this.selectedRoom._id]);
					} else {
						this.messageService.notification$.next({
							_id: item.room,
							title: this.translate.instant('OTHERS.Chat messages have been received'),
							subtype: 'chat',
							type: 'alert',
							data: item
						});
					}
				} else if (this.inside && this.selectedRoom && this.selectedRoom._id != item.room) {
 					this.messageService.notification$.next({
						_id: item.room,
						title: this.translate.instant('OTHERS.Chat messages have been received'),
						subtype: 'chat',
						type: 'alert',
						data: item
					});
				} else if (!this.inside){
					if (!(this.cdr as ViewRef).destroyed){
						this.cdr.detach();
					}
					try {
						await this.loadUnreadRooms();
						this.initRoomQuery();
						await this.loadRooms('chats');
					} catch (error) {

					}

					if (!(this.cdr as ViewRef).destroyed){
						this.cdr.reattach();
						this.cdr.detectChanges();
					}


				}
			} catch (error) {
				console.log(error);
			}

		}));


    setTimeout(()=> {
      this.chatCanvas = DrawerComponent.getInstance( document.getElementById('kt_drawer_chat'));
      if (this.chatCanvas) {
        this.chatCanvas.on('kt.drawer.shown', async (e) => {
          if (this.selectedRoom && this.selectedRoom._id && this.user) {
            this.messageService.notification$.next({
              _id: this.selectedRoom._id,
              subtype: 'chat',
              type: 'alert',
              action: 'read'
            });
            await this.messageService.markAsRead([this.selectedRoom._id]);
          }
        });
      }
    },1000);

		this.unsubscribe.push(this.messageService.remoteUserConnection$.subscribe( param => {
			if (this.selectedRoom && this.selectedRoom.users) {
				if (this.selectedRoom.type == 'private') {
					const user = this.selectedRoom.users.find( el => el._id != this.user._id);
					if (user && param.userId == user._id) {
						this.selectedRoom.active = param.connected;
						if (!(this.cdr as ViewRef).destroyed) {
							this.cdr.detectChanges();
						}
					}
				}
			}
		}));

	}
	ngAfterViewInit(): void {

	}
	ngOnDestroy(): void {
		this.unsubscribe.forEach( u => u.unsubscribe());
	}

	async insertMessage(message) {

		if (message.trim() == '') {
			return;
		}
		// this.loadingSubject.next(true);
		try
		{
			const item = await this.messageService.create({
				message,
				from: this.user._id,
				room: this.selectedRoom._id,
				type: 'CHAT_MESSAGE'
			});

			if (this.messageQuery) {
				const nextItem = this.messageQuery.result[0];
				item.from = { ...this.user};
				item.start = !nextItem || (nextItem.from._id != item.from._id);
				item.me = item.from._id == this.user._id;
				item.from.pic = item.from.pic || './assets/media/users/default.jpg';
				item.createdTime = this.getDateTimeFromDate(item.createdAt);
				this.messageQuery.result.splice(0,0, item);
			}
		} catch (error) {
			console.log(error);
		}
		if (!(this.cdr as ViewRef).destroyed){
			this.cdr.detectChanges();
		}
		this.scroll.nativeElement.scrollTop = 0;
		// this.loadingSubject.next(false);
	}

	initMessageQuery(roomId = null) {
		this.messageQuery = {
			filterModel: {
				type: {
					filterType: 'eq',
					value: 'CHAT_MESSAGE'
				},
				room: {
					filterType: 'eq',
					value: roomId || this.selectedRoom._id
				}
			},
			sortModel: [{ colId: 'createdAt', sort: 'desc'}],
			startRow: 0,
			pageSize: 10,
			endRow: 10,
			result: []
		};
	}
	async loadRoomMessages(isFirst = true) {
		this.loadingSubject.next(true);
		try {

			const res = await this.messageService.getWithPagination(this.messageQuery);

			if (!isFirst && res.items.length > 0) {
				const nextItem = res.items[0];
				const item = this.messageQuery.result[this.messageQuery.result.length - 1];
				if (item.from && nextItem.from) {
					item.start = nextItem.from._id != item.from._id;
				}
			}
			for ( let i = 0 ; i < res.items.length; i++) {
				const nextItem = res.items[i + 1];
				const item = res.items[i];
				if (item.from) {
					item.start = !nextItem || !nextItem.from ||(nextItem.from._id != item.from._id);
					item.me = item.from._id == this.user._id;
					item.from.pic = item.from.pic || './assets/media/users/default.jpg';
				}
				item.createdTime = this.getDateTimeFromDate(item.createdAt);
				this.messageQuery.result.push(item);
				if (isFirst) {
					this.messageQuery.totalCount = res.totalCount;
				}
			}
			if (!(this.cdr as ViewRef).destroyed){
				this.cdr.detectChanges();
			}

			if (isFirst) {
				this.scroll.nativeElement.scrollTop = 0;
			} else {
        const messageEl = document.querySelector('[data-kt-element="messages"]') as HTMLElement;
        setTimeout(() => {
          messageEl.scrollTop = messageEl.offsetHeight - messageEl.scrollHeight;
        });
			}
		} catch (error) {
			console.log(error);
		}
		this.loadingSubject.next(false);
	}
	initRoomQuery() {
		this.favoriteQuery = {
			filterModel: {
				users: {
					filterType: 'set',
					values: [this.user._id]
				},
				favorite: {
					filterType: 'eq',
					value: true
				}
			},
			sortModel: [
				{ colId: 'lastContacted', sort: 'desc'}
			],
			startRow: 0,
			endRow: 0,
			pageSize: 5,
			totalCount: 0,
			result: []
		};
		this.chatsQuery = {
			filterModel: {
				users: {
					filterType: 'set',
					values: [this.user._id]
				},
				favorite: {
					filterType: 'ne',
					value: true
				}
			},
			sortModel: [
				{ colId: 'lastContacted', sort: 'desc'}
			],
			startRow: 0,
			endRow: 0,
			pageSize: 10,
			totalCount: 0,
			result: []
		};
	}

	async loadRooms(type = null) {
		this.loadingSubject.next(true);
		// try {
		// 	if (type == null || type == 'favorites'){
		// 		const res = await this.roomService.getRooms(this.favoriteQuery);
		// 		res.items.forEach(item => {
		// 			const user = item.users.find( el => el._id != this.user._id);
		// 			this.favoriteQuery.result.push({
		// 				...item,
		// 				name: item.type == 'private' && user ? user.fullName : item.name,
		// 				pic: (item.type == 'private' && user ? user.pic : item.pic) || './assets/media/users/default.jpg',
		// 			});
		// 		});
		// 		this.favoriteQuery.startRow += res.items.length;
		// 		this.favoriteQuery.endRow += res.items.length;
		// 		this.favoriteQuery.totalCount = res.totalCount;
		// 	}

		// } catch (error) {

		// }

		try {
			if (type == null || type == 'chats') {
				const res = await this.roomService.getWithPagination(this.chatsQuery);
				res.items.forEach(item => {
					const user = item.users.find( el => el._id != this.user._id);
					this.chatsQuery.result.push({
						...item,
						name: item.type == 'private' && user ? (user.firstName + ' ' + user.lastName) : item.name,
						pic: (item.type == 'private' && user ? user.pic : item.pic) || './assets/media/users/default.jpg',
						hidden: this.unreadRooms.find(el => el._id == item._id)
					});
				});
				this.chatsQuery.startRow += res.items.length;
				this.chatsQuery.endRow += res.items.length;
				this.chatsQuery.totalCount = res.totalCount;

			}
		} catch (error) {
			console.log(error);
		}
		this.loadingSubject.next(false);
	}

	async loadUnreadRooms() {
		this.loadingSubject.next(true);
		try {

			const res = await this.roomService.getUnreadRooms(this.user._id);
			this.unreadRooms = res.map( item => {
				const user = item.users.find( el => el._id != this.user._id);
				if (user) {
					return {
						...item,
						name: item.type == 'private'? (user.firstName + ' ' + user.lastName) : item.name,
						pic: (item.type == 'private'? user.pic : item.pic) || './assets/media/users/default.jpg'
					};
				} else {
					return null;
				}

			}).filter( item => item);
		} catch (error) {
			console.log(error);
		}
		this.loadingSubject.next(false);
		this.unreadRooms.forEach ( item => {
			this.messageService.notification$.next({
				_id: item._id,
				title: this.translate.instant('OTHERS.Chat messages have been received from') + ' ' + item.name,
				subtype: 'chat',
				type: 'alert',
				data: item.lastMessage
			});
		});
	}

	async onClickSearchResultItem(item){
		if (item.type == 'people' ) {
			this.loadingSubject.next(true);
			let res;
			try {
				res = await this.roomService.getWithPagination({
					filterModel: {
						users: {
							filterType: 'all',
							values: [this.user._id, item._id]
						},
						type: {
							filterType: 'eq',
							value: 'private'
						}
					},
					sortModel: [],
					pageSize: 10,
					startRow: 0,
					endRow: 10
				});

			} catch (error) {
			}
			this.loadingSubject.next(false);

			if (res && res.items.length > 0) {
				this.setSelectedRoom(res.items[0]);
			} else if (res) {
				this.setSelectedRoom(item, 'people');
			}

		} else {
			this.setSelectedRoom(item);
		}
	}
	async onBackToList(){
    if (!this.inside) {return;}
		this.inside = false;
		this.selectedRoom = null;

		try {
			// if (!(this.cdr as ViewRef).destroyed){
			// 	this.cdr.detach();
			// }
			await this.loadUnreadRooms();
			this.initRoomQuery();
			await this.loadRooms('chats');
		} catch (error) {

		}
		if (!(this.cdr as ViewRef).destroyed){
			// this.cdr.reattach();
			this.cdr.detectChanges();
		}
    setTimeout(() => {
      ScrollComponent.createInstances('#kt_drawer_chat_messenger_body [data-kt-scroll="true"]');
      window.dispatchEvent(new Event('resize'));
    }, 0);
	}
	async onNewContact() {
		if (this.selectedRoom && this.selectedRoom.type == 'people') {
			try {
				const payload = {
					users: [this.selectedRoom._id, this.user._id],
					name: this.selectedRoom.name + ' ' + (this.user.firstName + ' ' + this.user.lastName),
					type: 'private',
					favorite: false
				};
				this.loadingSubject.next(true);
				const room = await this.roomService.create(payload);
				this.loadingSubject.next(false);
				this.setSelectedRoom(room);

				await this.insertMessage('Hi');

			} catch (error) {
				this.loadingSubject.next(false);
			}
		}
	}
	async setSelectedRoom(data, type = 'room') {
		this.loadingSubject.next(true);
		if (type == 'room') {
			try {
				const room = await this.roomService.getById(data._id);

				if (room.type == 'private') {
					const user = room.users.find( el => el._id != this.user._id);
					if (user) {
						room.name = user.firstName + ' ' + user.lastName;
						room.active = user.connected;
					}
				}

				this.selectedRoom = room;
				this.inside = true;
			} catch (error) {

			}

			if (!(this.cdr as ViewRef).destroyed){
				this.cdr.detectChanges();
			}

			try {
				this.initMessageQuery();
				await this.loadRoomMessages();
				await this.messageService.markAsRead([this.selectedRoom._id]);
			} catch (error) {

			}

			this.messageService.notification$.next({
				_id: this.selectedRoom._id,
				subtype: 'chat',
				type: 'alert',
				action: 'read'
			});
		} else if (type == 'people') {
			this.selectedRoom = {
				...data,
				name: data.firstName + ' ' + data.lastName
			};
			this.inside = true;
			this.initMessageQuery();

			if (!(this.cdr as ViewRef).destroyed){
				this.cdr.detectChanges();
			}
		}
		this.loadingSubject.next(false);
    setTimeout(() => {
      ScrollComponent.createInstances('#kt_drawer_chat_messenger_body [data-kt-scroll="true"]');
      window.dispatchEvent(new Event('resize'));
    }, 0);
	}

	async loadRoomMessagesMore() {
		try {
			let lastDate;
			if (this.messageQuery && this.messageQuery.result.length > 0) {
				lastDate = this.messageQuery.result[this.messageQuery.result.length - 1].createdAt;
				this.messageQuery.filterModel.createdAt = {
					filterType: 'lt',
					value: lastDate
				};
			};
			await this.loadRoomMessages(false);
		} catch (error) {

		}
	}
	getDateTimeFromDate(param): string {
    try {
      const date = new Date(param);
      const today = new Date();
      if (date.getDate() === today.getDate()
      && date.getMonth() === today.getMonth()
      && date.getFullYear() === today.getFullYear()) {
        return date.toLocaleString(this.locale, {
          hour: '2-digit',
          minute: '2-digit'
        });
      } else {
        return date.toLocaleString(this.locale, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {

    }
	}
	isControlHasError(controlName: string, validationType: string): boolean {
		const control = this.registerForm.controls[controlName];
		if (!control) {
			return false;
		}

		const result = control.hasError(validationType) && (control.dirty || control.touched);
		return result;
	}
	async startChat() {
    // DrawerComponent.hideAll();
    // return;
		const controls = this.registerForm.controls;

		// check form
		if (this.registerForm.invalid) {
			Object.keys(controls).forEach(controlName =>
				controls[controlName].markAsTouched()
			);
			return;
		}

		const _user: UserModel = new UserModel();
		_user.email = controls.email.value;
		_user.firstName = controls.firstName.value;
		_user.lastName = controls.lastName.value;
    _user.platform = environment.platform;
		_user.roles = [];
		this.loadingSubject.next(true);
		try {
			const res = await this.userService.check(_user);
			if (res && res.accessToken) {
        this.chatCanvas.hide();
				this.auth.setAuthFromLocalStorage(res);
        const subscr = this.auth.getUserByToken().subscribe( user => {
          setTimeout(() => {
            this.chatCanvas.show();
            subscr.unsubscribe();
          },300);
        });
			}
		} catch (error) {

		}
		this.loadingSubject.next(false);

	}
	onCanvasEvent(name) {
		console.log(name);
	}
	onClickSend() {
		const el = document.getElementById('chat_message_input');
		if (el) {
			this.insertMessage(el.innerText);
			el.innerHTML = '';
		}
	}
	async onContactWithSupport() {
		this.chatCanvas.show();
		try {
			if (this.user) {
				const room = await this.roomService.createWithAdmin(this.user._id);
				await this.setSelectedRoom(room);
			}
		} catch (error) {
		}
	}
  getMessageCssClass(item: any): string {
    return `p-5 rounded text-dark fw-bold mw-lg-400px bg-light-${
      item.me ? 'primary' : 'success'
    } text-${item.me ? 'end' : 'start'} ${!item.start? 'mt-n8': ''}`;
  }
  get f() {
    return this.registerForm.controls;
  }
}
