// Angular
import { Component, Output, EventEmitter, ViewChild, OnInit, OnDestroy, ChangeDetectorRef, ElementRef } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounce } from 'lodash';
import { AuthService } from 'src/app/modules/auth';
import { UserService } from 'src/app/pages/common/user.service';
import { RoomService } from 'src/app/pages/common/room.service';


@Component({
	selector: 'app-chat-search',
	templateUrl: './search.component.html',
	styleUrls: ['./search.component.scss']
})
export class ChatSearchComponent implements OnInit, OnDestroy {

	constructor(
		private auth: AuthService,
		private userService: UserService,
		private roomService: RoomService,
		private cdr: ChangeDetectorRef) {


		this.auth.currentUserSubject.subscribe ( user => {
			if (user) {
				this.user = user;
				this.updateSearchQuery('');
				this.search().then( () => {
				  this.cdr.markForCheck();
				});
			}
		});

		this.activeTab = this.tabs[0];

		this.loading$ = this.loadingSubject.asObservable();
	}

	results: [];

	peopleSearchQuery: any;
	contactSearchQuery: any;
	groupSearchQuery: any;

	keyword = '';
	changedKeyword = false;

	loadingSubject = new BehaviorSubject<boolean>(true);
	loading$: Observable<boolean>;
	loading = false;
	locale = 'it-IT';

	user;

	tabs = [
		{ label: 'OTHERS.all', value: 'all'},
		{ label: 'OTHERS.addressbook', value: 'people'},
		{ label: 'OTHERS.Conversations', value: 'contact'}
	];
	activeTab;

	@ViewChild('searchInput', {static: true}) searchInput: ElementRef;

	@Output() clickItem = new EventEmitter<any>();
	onSearch = debounce(async (e) => {
		const value = e.target.value;

		if (!this.loadingSubject.getValue()) {
			setTimeout(async () => {
				const keyword = value;
				try {
					this.updateSearchQuery(keyword);
					await this.search();
				} catch (error) {

				}
				this.cdr.markForCheck();
			}, 0);
		} else {
			if (value != this.keyword) {
				this.changedKeyword = true;
			}
		}
		this.keyword = value;
	}, 500);

	ngOnInit(): void {
		this.loadingSubject.subscribe( _incomingValue => {
			this.loading = _incomingValue;
			if (!_incomingValue && this.changedKeyword) {
				this.changedKeyword = false;
				setTimeout(async () => {
					this.updateSearchQuery(this.keyword);
					await this.search();
					this.cdr.markForCheck();
				}, 10);
			}
		});
		this.loadingSubject.next(false);
	}
	ngOnDestroy(): void {

	}

	updateSearchQuery(keyword) {
		this.peopleSearchQuery = {
			filterModel: {
				firstName: {
					filterType: 'text',
					filter: keyword
				},
				_id: {
					filterType: 'set_r',
					values: [this.user._id]
				}
			},
			sortModel: [
				{ colId: 'firstName', sort: 'asc'}, { colId: 'lastName', sort: 'asc'}
			],
			startRow: 0,
			endRow: 0,
			pageSize: 5,
			totalCount: 0,
			result: []
		};
		this.contactSearchQuery = {
			filterModel: {
				name: {
					filterType: 'text',
					filter: keyword
				},
				users: {
					filterType: 'set',
					values: [this.user._id]
				},
				type: {
					filterType: 'eq',
					value: 'private'
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
		this.groupSearchQuery = {
			filterModel: {
				name: {
					filterType: 'text',
					filter: keyword
				},
				type: {
					filterType: 'eq',
					value: 'group'
				},
				users: {
					filterType: 'set',
					values: [this.user._id]
				},
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
	}

	async search(type = null) {
		if (type) {
			this.activeTab = this.tabs.find( el => el.value == type);
		}
		this.loadingSubject.next(true);
		try {

			if (type == null || type == 'people') {
				const res = await this.userService.get(this.peopleSearchQuery);
				res.items.forEach(item => {
					this.peopleSearchQuery.result.push({
						...item,
						pic: item.pic || 'assets/media/users/default.jpg',
						name: item.firstName + ' ' + item.lastName,
						type: 'people'
					});
				});
				this.peopleSearchQuery.startRow += res.items.length;
				this.peopleSearchQuery.endRow += res.items.length;
				this.peopleSearchQuery.totalCount = res.totalCount;
			}

		} catch (error) {

		}

		try {

			if (type == null || type == 'contact') {
				const res = await this.roomService.getWithPagination(this.contactSearchQuery);
				res.items.forEach(item => {
					const user = item.users.find( el => el._id != this.user._id);
					this.contactSearchQuery.result.push({
						pic: item.pic || 'assets/media/users/default.jpg',
						name: user.firstName + ' ' + user.lastName
					});
				});
				this.contactSearchQuery.startRow += res.items.length;
				this.contactSearchQuery.endRow += res.items.length;
				this.contactSearchQuery.totalCount = res.totalCount;
			}

		} catch (error) {

		}

		// try {

		// 	if (type == null || type == 'group') {
		// 		const res = await this.roomService.getRooms(this.groupSearchQuery);
		// 		res.items.forEach(item => {
		// 			this.groupSearchQuery.result.push({
		// 				pic: `<img src="${item.pic || 'assets/media/users/default.jpg'}" alt="">`,
		// 				text: item.name,
		// 			});
		// 		});
		// 		this.groupSearchQuery.startRow += res.items.length;
		// 		this.groupSearchQuery.endRow += res.items.length;
		// 		this.groupSearchQuery.totalCount = res.totalCount;
		// 	}

		// } catch (error) {

		// }

		this.loadingSubject.next(false);
	}

	async clear(e) {
		if (this.keyword != '') {
			this.changedKeyword = true;
			this.keyword = '';
			if (!this.loadingSubject.getValue()) {
				this.loadingSubject.next(false);
			}
		}
		this.searchInput.nativeElement.value = '';
	}
	onClickItem(item) {
		this.clickItem.emit(item);
	}
	onClickTab(tab) {
		this.activeTab = tab;
	}
}
