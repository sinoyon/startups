import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LpTableService {

  pageContentWidthChanged$: Subject<number> = new Subject<number>();
  constructor() { }
}
