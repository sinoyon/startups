// Angular
import { Component, ViewChild, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, HostListener, Renderer2, HostBinding, Input, ViewRef, Output, EventEmitter } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { KTUtil } from '../../../_metronic/kt/index';

@Component({
	selector: 'app-card-slider',
	templateUrl: './card-slider.component.html',
	styleUrls: ['./card-slider.component.scss']
})
export class CardSliderComponent implements OnInit, OnDestroy {


	loadingSubject = new BehaviorSubject<boolean>(true);
	loading$: Observable<boolean>;
	loading = false;
	locale = 'it-IT';

	width = 1200;
	height = 200;
	length = 3;
	slideSize = 400;
	nextSlides = 0;
	prevSlides = 0;

	slideData = [];
	totalCount = 0;

  expanded = true;


	@Input() type = 'md';
	dragActionExceptSelector = '.cove-image';

	@ViewChild('slider', {static: true}) slider: ElementRef;
	@ViewChild('wrapper', {static: true}) wrapper: ElementRef;
	@ViewChild('slideItems', {static: true}) slideItems: ElementRef;
	@ViewChild('nextBtn', {static: true}) nextBtn: ElementRef;
	@ViewChild('prevBtn', {static: true}) prevBtn: ElementRef;

	@Output('videoClick') videoClickEvent = new EventEmitter<any>();
	@Output('followClick') followClickEvent = new EventEmitter<any>();
	@Output('walletClick') walletClickEvent = new EventEmitter<any>();
	@Output('detailClick') detailClickEvent = new EventEmitter<any>();
	@Output('externalClick') externalClickEvent = new EventEmitter<any>();
	@Output('select') selectEvent = new EventEmitter<any>();

	parent;

	constructor(
		private cdr: ChangeDetectorRef
		) {

		this.loading$ = this.loadingSubject.asObservable();
	}

	ngOnInit(): void {
		this.loadingSubject.next(false);

		const slider = this.slider.nativeElement;
			const sliderItems = this.slideItems.nativeElement;
			const prev = this.prevBtn.nativeElement;
			const next = this.nextBtn.nativeElement;
			const self = this;

		slide(slider, sliderItems, prev, next);

		function slide(wrapper, items, prev, next) {
			let posX1 = 0;
				let posX2 = 0;
				let posY1 = 0;
				let posY2 = 0;
				let posInitial;
				let posFinal;
				const threshold = 50;
				let index = 0;
				let allowShift = true;

			wrapper.classList.add('loaded');

			// if (KTUtil.isMobileDevice()) {
				items.onmousedown = dragStart;

				items.addEventListener('touchstart', dragStart);
				items.addEventListener('touchend', dragEnd);
				items.addEventListener('touchmove', dragAction);

			// }
			prev.addEventListener('click', function() {  shiftSlide(-1); });
			next.addEventListener('click', function() {  shiftSlide(1); });

			items.addEventListener('transitionend', checkIndex);

			function dragStart(e) {
				e = e || window.event;
				if (e.target.closest(self.dragActionExceptSelector)) {
					return;
				}
				// e.preventDefault();
				posInitial = items.offsetLeft;

				if (e.type == 'touchstart') {
					posX1 = e.touches[0].clientX;
					posY1 = e.touches[0].clientY;
				} else {
					posX1 = e.clientX;
					posY1 = e.clientY;
					document.onmouseup = dragEnd;
					document.onmousemove = dragAction;
				}
			}

			function dragAction(e) {
				e = e || window.event;
				if (e.target.closest(self.dragActionExceptSelector)) {
					return;
				}
				if (e.type == 'touchmove') {
					posX2 = posX1 - e.touches[0].clientX;
					posX1 = e.touches[0].clientX;
					posY2 = posY1 - e.touches[0].clientY;
					posY1 = e.touches[0].clientY;
				} else {
					posX2 = posX1 - e.clientX;
					posX1 = e.clientX;
					posY2 = posY1 - e.clientY;
					posY1 = e.clientY;
				}
				items.style.left = (items.offsetLeft - posX2) + 'px';
			}

			function dragEnd(e) {
				if (e.target.closest(self.dragActionExceptSelector)) {
					return;
				}
				posFinal = items.offsetLeft;
				if (posFinal - posInitial < -threshold) {
					shiftSlide(1, 'drag');
				} else if (posFinal - posInitial > threshold) {
					shiftSlide(-1, 'drag');
				} else {
					items.style.left = (posInitial) + 'px';
					if (Math.abs(posFinal - posInitial) == 0) {
						try {
							// if (e.target.closest('.btn-play')) {
								const s = e.target.closest('.slide');
								if (s) {
									const id = s.getAttribute('indexofdata');
									const data = self.slideData.find( d => d._id == id);
									if (data) {
										// self.videoClickEvent.emit(data);
									}
								}
							// }
						} catch (error) {
						}
					}
				}

				document.onmouseup = null;
				document.onmousemove = null;
			}

			function shiftSlide(dir, action = null) {

				items.classList.add('shifting');

				if (allowShift) {
					if (!action) { posInitial = items.offsetLeft; }

					if (dir == 1) {
						items.style.left = (posInitial - (self.nextSlides ? self.slideSize * self.nextSlides: 0)) + 'px';
						if (self.nextSlides) {index = 1;} else { allowShift = true; return;};

						if (self.length == 1) {
							const data = self.slideData[Math.max(self.prevSlides - 1, 0)];
							setTimeout(() => {
								self.selectEvent.emit(data);
							},100);
						}
					} else if (dir == -1) {
						items.style.left = (posInitial + (self.prevSlides ? self.slideSize * self.prevSlides: 0)) + 'px';
						if (self.prevSlides) {index = -1;} else { allowShift = true; return;};

						if (self.length == 1) {
							const data = self.slideData[0];
							setTimeout(() => {
								self.selectEvent.emit(data);
							}, 100);
						}
					}
				};

				allowShift = false;
			}

			async function checkIndex(){
				items.classList.remove('shifting');
				try {
					if (index == 1) {
						const prevSlides = self.nextSlides + self.prevSlides;
						if (prevSlides > self.length) {
							for (var i = 0 ; i < prevSlides - self.length; i++)
								{self.slideData.splice(0,1);}
						}
						self.prevSlides = prevSlides > self.length ? self.length : prevSlides;
						await self.loadNext(self);

					} else if (index == -1) {
						const nextSlides = self.nextSlides + self.prevSlides;
						if (nextSlides > self.length) {
							for (var i = 0 ; i < nextSlides - self.length; i++)
								{self.slideData.pop();}
						}
						self.nextSlides = nextSlides > self.length ? self.length : nextSlides;
						await self.loadPrev(self);
					}
				} catch (error) {
				}
				index = 0;
				if (!(self.cdr as ViewRef).destroyed){
					self.cdr.detectChanges();
				}

				if (self.prevSlides) {
					items.style.left = -(1 * self.slideSize * self.prevSlides) + 'px';
				} else {
					items.style.left = 0 + 'px';
				}
				allowShift = true;
			}
		}
	}
	async init(load = true) {

		const wrapper = this.slider.nativeElement;
			let wrapperWidth = wrapper.offsetWidth;
			const items = this.slideItems.nativeElement;
			const length = Math.max(Math.min(3, Math.floor(wrapperWidth / 350)), 1);

		if (load) {
			this.slideData = [];
			items.style.left = '0px';
			this.loadingSubject.next(true);
			try {
				await this.loadInitial(this);
			} catch (error) {
			}
			this.loadingSubject.next(false);
		}
		if (KTUtil.getViewPort().width > 400) {
			wrapperWidth -= 80;
		}
		this.slideSize = wrapperWidth / length;
		this.length = length;

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
	ngOnDestroy(): void {

	}
	loadNext: any = (param) => {
	};
	loadPrev: any = (param) => {
	};
	loadInitial: any = (param) => {
	};
	registerOnChange(initial = null, prev = null, next = null) {
		if (next) {this.loadNext = next;}
		if (initial) {this.loadInitial = initial;}
		if (prev) {this.loadPrev = prev;}
	}

  onExpandCard(param) {
    this.expanded = param;
  }
}
