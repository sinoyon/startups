import { BehaviorSubject } from 'rxjs';
import {Injectable} from '@angular/core';



@Injectable({
	providedIn: 'root'
})
export class CommonService {

  categories: any[] = [];

  filterOptions: BehaviorSubject<any> = new BehaviorSubject<any>([]);

  categoriesSubject: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);

  openLinkWithNewTab(param: string) {
    if (!param.includes('http')) {
      param = 'https://' + param
    }
    try {
      const url = new URL(param);
      window.open(url.href);
    } catch (error) {
      console.log(error);
    }
  }
}
