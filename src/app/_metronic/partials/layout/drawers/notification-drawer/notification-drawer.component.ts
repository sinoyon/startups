import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationCancel, NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DrawerComponent } from 'src/app/_metronic/kt/components';

@Component({
  selector: 'app-notification-drawer',
  templateUrl: './notification-drawer.component.html',
})
export class NotificationDrawerComponent implements OnInit, OnDestroy {

  private unsubscribe: Subscription[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.routingChanges();
  }

  routingChanges() {
    const routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd || event instanceof NavigationCancel) {
        this.pluginsReinitialization();
      }
    });
    this.unsubscribe.push(routerSubscription);
  }
  pluginsReinitialization() {
    setTimeout(() => {
      DrawerComponent.reinitialization();
    }, 140);
  }
  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
