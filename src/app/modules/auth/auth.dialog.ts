import { Component, Inject, OnInit } from '@angular/core';

@Component({
  selector: 'app-auth-dialog',
  templateUrl: './auth.dialog.html',
  styleUrls: ['./auth.dialog.scss']
})
export class AuthDialog implements OnInit {

  today: Date = new Date();
  page = 'login';

  constructor() {
      this.page = 'login';
  }

  ngOnInit(): void {
  }

  close() {
  }
}
