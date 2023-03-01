// Angular
import { Platform } from '@angular/cdk/platform';
import { Component, Output, EventEmitter, ViewChild, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, HostListener, Renderer2, HostBinding, Input, ViewRef } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { AdvertisementService } from 'src/app/pages/common/advertisement.service';
import { CampaignService } from 'src/app/pages/common/campaign.service';
import { KTUtil } from '../../../../_metronic/kt/index';
import { str2videoUrl } from '../../../common/common';

declare var YT;
declare var Vimeo;

@Component({
	selector: 'app-video-component',
	templateUrl: './video.component.html',
	styleUrls: ['./video.component.scss']
})
export class VideoComponent implements OnInit, OnDestroy {


	loadingSubject = new BehaviorSubject<boolean>(true);
	loading$: Observable<boolean>;
	locale = 'it-IT';
	@Input() user;
	@Output('close') closeEvent = new EventEmitter<any>();

	@ViewChild('cardSlider', { static: true }) cardSlider;
	@ViewChild('sliderContainer', { static: true }) sliderContainer;

	@Input() campaigns = [];
	@Input() totalCount;
	@Input() loadMoreCb;

	@Output('videoClick') videoClickEvent = new EventEmitter<any>();
	@Output('followClick') followClickEvent = new EventEmitter<any>();
	@Output('walletClick') walletClickEvent = new EventEmitter<any>();
	@Output('detailClick') detailClickEvent = new EventEmitter<any>();
	@Output('externalClick') externalClickEvent = new EventEmitter<any>();

	parent;
	selectedCampaign;

	isMobile = false;

	otherVideos: any[] = [];

	playId = 0;

	constructor(
		private cdr: ChangeDetectorRef,
		private campaignService: CampaignService,
		private advertisementService: AdvertisementService,
		private platform: Platform
	) {

		this.loading$ = this.loadingSubject.asObservable();

		this.isMobile = this.platform.ANDROID || this.platform.IOS;
	}


	ngOnInit(): void {
		this.loadingSubject.next(false);
		this.initSlider();
	}
	ngOnDestroy(): void {

	}

	init(param) {
		const { parent, campaign } = param;
		this.parent = parent;
		this.onSelectCampaign(campaign);
	}

	async onSelectCampaign(param) {
		console.log(param);
		this.selectedCampaign = param;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
		await this.cardSlider.init(true);
		if (param) {
			const frameContainer = document.querySelector('#video_view #video-container .frame-container');
			if (frameContainer && str2videoUrl(param.videoUrl)) {
				const videoFrame = document.createElement('iframe');
				videoFrame.allow = 'autoplay';
				videoFrame.setAttribute('allowfullscreen', '');
				videoFrame.setAttribute('id', 'ik_player_iframe');
				videoFrame.src = str2videoUrl(param.videoUrl);

				frameContainer.innerHTML = '';
				frameContainer.appendChild(videoFrame);
				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.detectChanges();
				}

				let self = this;

				if ((param.videoUrl as string).includes('youtube')) {
					var ik_player = new YT.Player('ik_player_iframe');
					//subscribe to events
					ik_player.addEventListener("onReady", () => {

					});
					ik_player.addEventListener("onStateChange", (event) => {
						console.log('iframe event = ', event);
						if (event.data === YT.PlayerState.ENDED) {
							console.log('youtube = ', self.cardSlider.slideData);
							if (self.playId < self.cardSlider.slideData.length) {
								self.onSelectCampaign(self.cardSlider.slideData[self.playId]);
								self.playId++;
							} else {
								self.playId = 0;
								self.onSelectCampaign(self.cardSlider.slideData[self.playId]);
							}
						}
					});
				}


				if ((param.videoUrl as string).includes('vimeo')) {
					var player = new Vimeo.Player(videoFrame);
					player.on('ended', () => {
						console.log('vimeo = ', self.cardSlider.slideData);
						if (self.playId < self.cardSlider.slideData.length) {
							self.onSelectCampaign(self.cardSlider.slideData[self.playId]);
							self.playId++;
						} else {
							self.playId = 0;
							self.onSelectCampaign(self.cardSlider.slideData[self.playId]);
						}
					});
				}

			}

			try {
				if (param.advId) {
					await this.advertisementService.action(param.advId, 'video', 'slider');
				}
				await this.campaignService.action(param._id, 'video', 'slider');
			} catch (error) {
				console.log(error);
			}
		}

	}

	initSlider() {

		const self = this;

		const getPrevSlide = async slider => {
			let result;
			const data = slider.slideData.length > 0 ? slider.slideData[0] : self.selectedCampaign;
			const selectedIndex = self.selectedCampaign ? (self.campaigns.reduce((carry, item, index) => {
				if (carry >= 0) return carry;
				if (item._id == self.selectedCampaign._id) {
					return index
				}
			}, -1)) : -1;
			if (data) {
				let curIndex = self.campaigns.reduce((carry, item, index) => {
					if (carry >= 0) return carry;
					if (item._id == data._id) {
						return index
					}
				}, -1);
				if (curIndex > 0) {
					curIndex--;
					try {
						while (curIndex >= 0) {
							if (self.campaigns[curIndex].videoUrl && curIndex != selectedIndex) {
								result = self.campaigns[curIndex];
								throw {};
							}
							curIndex--;
						}
					} catch (error) {
					}
				}
			}
			return result;
		};

		const getNextSlide = async slider => {
			let result;
			const data = slider.slideData.length > 0 ? slider.slideData[slider.slideData.length - 1] : self.selectedCampaign;
			const totalCount = self.totalCount || self.campaigns.length;
			const selectedIndex = self.selectedCampaign ? self.campaigns.reduce((carry, item, index) => {
				if (carry >= 0) return carry;
				if (item._id == self.selectedCampaign._id) {
					return index
				}
			}, -1) : -1;
			if (data) {
				let curIndex = self.campaigns.reduce((carry, item, index) => {
					if (carry >= 0) return carry;
					if (item._id == data._id) {
						return index
					}
				}, -1);
				if (curIndex >= 0) {
					curIndex++;
					try {
						while (curIndex < totalCount) {
							if (curIndex >= self.campaigns.length) {
								if (self.parent) {
									await self.parent.C();
								}
							}

							if (curIndex >= self.campaigns.length) {
								throw {};
							}
							if (self.campaigns[curIndex].videoUrl && curIndex != selectedIndex) {

								result = self.campaigns[curIndex];
								throw {};
							}
							curIndex++;
						}
					} catch (error) {

					}
				}
			}
			return result;
		};

		const initSlide = async param => {
			param.prevSlides = 0;
			param.nextSlides = 0;
			param.slideData = [];
			let count = param.length * 2;
			for (var i = 0; i < count; i++) {
				try {
					const data = await getNextSlide(param);
					if (data) {
						param.slideData.push(data);
					}
				} catch (error) {
				}
			}
			param.nextSlides = Math.max((param.slideData.length - param.length), 0);
			count = param.slideData.length == 0 ? param.length * 2 : param.length;
			for (var i = 0; i < count; i++) {
				try {
					const data = await getPrevSlide(param);
					if (data) {
						param.slideData.unshift(data);
						param.prevSlides++;
					}
				} catch (error) {

				}
			}
			if (param.slideData.length <= param.length) {
				param.nextSlides = 0;
				param.prevSlides = 0;
			}
		};

		const prevSlide = async param => { // prev
			param.prevSlides = 0;
			try {
				for (let i = 0; i < param.length; i++) {
					const data = await getPrevSlide(param);
					if (data) {
						param.slideData.unshift(data);
						param.prevSlides++;
					}
				}

			} catch (error) {
			}
		};

		const nextSlide = async param => { // next
			param.nextSlides = 0;
			try {
				for (let i = 0; i < param.length; i++) {

					const data = await getNextSlide(param);
					if (data) {
						param.slideData.push(data);
						param.nextSlides++;
					}
				}
			} catch (error) {
			}
		};

		this.cardSlider.registerOnChange(initSlide, prevSlide, nextSlide);

	}

	onClose() {
		const frameContainer = document.querySelector('#video_view #video-container .frame-container');
		if (frameContainer) {
			frameContainer.innerHTML = '';
		}
		this.closeEvent.emit();
	}
}
