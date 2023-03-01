import { Component, OnDestroy, OnInit } from '@angular/core';
import { Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit, OnDestroy {

  today: Date = new Date();

  constructor(private meta: Meta) { }

  ngOnInit() {
		this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow'});
	}

	ngOnDestroy() {
		this.meta.removeTag('name=\'robots\'');
	}

}
