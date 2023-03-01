import { Routes } from '@angular/router';

const Routing: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./pages.module').then((m) => m.PagesModule),
  }
];

export { Routing };
