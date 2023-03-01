import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import {ChangeDetectorRef, Component, Injectable, TemplateRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts: any[] = [];
  toasts$ = new Subject();
  show(textOrTpl: string | TemplateRef<any>, options: any = {}) {
    this.toasts.push({ textOrTpl, ...options });
    this.toasts$.next();
  }

  remove(toast) {
    this.toasts = this.toasts.filter(t => t !== toast);
  }
}


@Component({
  selector: 'app-toasts',
  template: `
    <ngb-toast
      *ngFor="let toast of toastService.toasts"
      [class]="(toast.classname || '') + 'bg-warning rounded-0'"
      [autohide]="true"
      [delay]="toast.delay || 5000"
      (hidden)="toastService.remove(toast)"
    >
      <ng-template [ngIf]="isTemplate(toast)" [ngIfElse]="text">
        <ng-template [ngTemplateOutlet]="toast.textOrTpl"></ng-template>
      </ng-template>

      <ng-template #text>
        <a class="d-flex flex-column cursor-pointer"  (click)="action(toast)">
          <div class="fs-5 text-dark">{{ toast.textOrTpl }}</div>
          <div class="fw-bolder fs-5 mt-1 text-white" *ngIf="toast.desc"> {{ toast.desc }}</div>
        </a>
      </ng-template>
    </ngb-toast>
  `,
  host: {'[class.ngb-toasts]': 'true'}
})
export class ToastsContainer {
  constructor(public toastService: ToastService, private router: Router, private cdr: ChangeDetectorRef) {
    this.toastService.toasts$.subscribe(() => this.cdr.detectChanges());
  }

  action(toast) {
    if (toast.action) {
      this.router.navigate([toast.action]);
    }
    this.toastService.remove(toast);
  }
  isTemplate(toast) { return toast.textOrTpl instanceof TemplateRef; }
}
