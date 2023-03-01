import { CommonService } from 'src/app/pages/common/common.service';
import { Component, OnInit } from '@angular/core';

import { OwlOptions } from 'ngx-owl-carousel-o';
import { Platform } from '@angular/cdk/platform';

@Component({
  selector: 'app-carousel-slider',
  templateUrl: './carousel-slider.component.html',
  styleUrls: ['./carousel-slider.component.scss']
})
export class CarouselSliderComponent implements OnInit {

  customOptions: OwlOptions = {
    loop: true,
    mouseDrag: true,
    touchDrag: false,
    pullDrag: false,
    dots: false,
    navSpeed: 700,
    navText: ['<<', '>>'],
    responsive: {
      0: {
        items: 1
      },
      400: {
        items: 2
      },
      740: {
        items: 3
      },
      940: {
        items: 4
      }
    },
    nav: false,
    autoWidth: true,
		// autoHeight: true,
    center: true,
    autoplay: true,
    autoplaySpeed: 700,
    // autoplayTimeout: 3,
    // autoplayHoverPause: false,
    // autoplayMouseleaveTimeout: 3,
  };

  slidesStore = [];

  isMobile = false;

  constructor(
    private comService: CommonService,
    private platform: Platform
  ) { 
    this.isMobile = platform.ANDROID || platform.IOS;
    if (this.isMobile) {
      this.customOptions.nav = true;
    } else {
      this.customOptions.nav = false;
    }
  }

  ngOnInit(): void {
  }

  showLink($event, slide) {
    $event.preventDefault();
    if (slide) {
      this.comService.openLinkWithNewTab(slide.link);
    }
  }

}
