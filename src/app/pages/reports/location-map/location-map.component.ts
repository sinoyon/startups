import { campaign2htmlData } from 'src/app/pages/common/common';
import { reverse, sortBy } from 'lodash';
import { AdvertisementService } from './../../common/advertisement.service';
import { CampaignService } from './../../common/campaign.service';
import { Component, Input, OnInit, Output, EventEmitter, ViewChild, NgZone, ChangeDetectorRef, ViewRef } from '@angular/core';
import { MapsAPILoader, AgmMap, GoogleMapsAPIWrapper, AgmMarker } from '@agm/core';

declare let google: any;
interface Location {
  lat?: number;
  lng?: number;
  viewport?: Object;
  zoom?: number;
  address_level_1?: string;
  address_level_2?: string;
  address_country?: string;
  address_zip?: string;
  address_state?: string;
  markers: any[];
}

@Component({
  selector: 'app-location-map',
  templateUrl: './location-map.component.html',
  styleUrls: ['./location-map.component.scss']
})
export class LocationMapComponent implements OnInit {

    geocoder: any;
    public location: Location = {
      markers: [],
    };
    scaleSize;
    hoverMarkerInfoWindow;
    selectedMarkerInfoWindow;
    activeMarker;
    prevMarker;

    markersOfMap = {
		activeIndex: -1,
		activePage: 0,
		startPage: 0,
		totalPage: 0,
		pageSize: 4,
		countPage: 5,
		campaigns: [],
		pages: []
	};

    @Input() campaigns = [];
    @Input() wallets = [];
    @Input() user;
    @Input() locale = 'it-IT';
    @Input() fitBounds = true;
    @Output('select') selectEvent = new EventEmitter<any>();

    @Output('followClick') followClickEvent = new EventEmitter<any>();
	  @Output('walletClick') walletClickEvent = new EventEmitter<any>();
    @Output('externalClick') externalClickEvent = new EventEmitter<any>();
    @Output('detailClick') detailClickEvent = new EventEmitter<any>();
    @Output('videoClick') videoClickEvent = new EventEmitter<any>();

    @ViewChild(AgmMap, { static: true}) map: AgmMap;

    oldIcon: any;

    constructor(
      public mapsApiLoader: MapsAPILoader,
      private zone: NgZone,
      private cdr: ChangeDetectorRef,
      private campaignService: CampaignService,
      private advertisementService: AdvertisementService,
      private wrapper: GoogleMapsAPIWrapper
    ) {
      this.mapsApiLoader = mapsApiLoader;
      this.zone = zone;
      this.wrapper = wrapper;
      this.mapsApiLoader.load().then(() => {
        this.geocoder = new google.maps.Geocoder();
        this.scaleSize = new google.maps.Size(46,48);
      });
    }

    ngOnInit() {
    }

    setMarkers( param ) {
        this.activeMarker = null;
        this.location.markers = [];
        param.forEach( el => {
            const exist = this.location.markers.find( m => el.lat == m.lat && el.lng == m.lng );
            if (exist) {
                exist.count++;
                exist.campaignIds.push(el._id);
            } else {
                el = this.setIcon(el);
                this.location.markers.push({...el, count: 1, campaignIds: [el._id]});
            }
        });
        if (!this.fitBounds && this.location.markers.length) {
            this.location.lat = this.location.markers[0].lat;
            this.location.lng = this.location.markers[0].lng;
        }
        if (!(this.cdr as ViewRef).destroyed) {
            this.cdr.detectChanges();
        }
    }

    checkAdv( advs) {
        this.location.markers.forEach( el => {
            if (advs.find( el0 => el0._id == el._id)) {
                el.icon = './assets/media/misc/map-marker-sponsored.png';
                el.isAdv = true;
            }
        });
        this.location.markers = reverse(sortBy(this.location.markers, ['isAdv']));
        this.location.markers = sortBy(this.location.markers, ['count']);
    }

    updateOnMap() {
        let full_address: string = this.location.address_level_1 || '';
        if (this.location.address_level_2) {full_address = full_address + ' ' + this.location.address_level_2;}
        if (this.location.address_state) {full_address = full_address + ' ' + this.location.address_state;}
        if (this.location.address_country) {full_address = full_address + ' ' + this.location.address_country;}

        this.findLocation(full_address);
    }

    onMapClick(e) {
        this.clear();
    }

    findLocation(address) {
        if (!this.geocoder) {this.geocoder = new google.maps.Geocoder();}
        this.geocoder.geocode({
          address
        }, (results, status) => {
            console.log(results);
            if (status == google.maps.GeocoderStatus.OK) {
                for (let i = 0; i < results[0].address_components.length; i++) {
                    const types = results[0].address_components[i].types;

                    if (types.indexOf('locality') != -1) {
                        this.location.address_level_2 = results[0].address_components[i].long_name;
                    }
                    if (types.indexOf('country') != -1) {
                        this.location.address_country = results[0].address_components[i].long_name;
                    }
                    if (types.indexOf('postal_code') != -1) {
                        this.location.address_zip = results[0].address_components[i].long_name;
                    }
                    if (types.indexOf('administrative_area_level_1') != -1) {
                        this.location.address_state = results[0].address_components[i].long_name;
                    }
                }

                if (results[0].geometry.location) {
                this.location.lat = results[0].geometry.location.lat();
                this.location.lng = results[0].geometry.location.lng();
                // this.location.marker.lat = results[0].geometry.location.lat();
                // this.location.marker.lng = results[0].geometry.location.lng();
                // this.location.marker.draggable = true;
                this.location.viewport = results[0].geometry.viewport;
                }

                this.map.triggerResize();
            } else {
                alert('Sorry, this search produced no results.');
            }
        });
    }

    markerDragEnd(m: any) {
        // this.location.marker.lat = m.latLng.lat();
        // this.location.marker.lng = m.latLng.lng();
        this.findAddressByCoordinates();
    }

    findAddressByCoordinates() {
        this.geocoder.geocode({
          location: {
            // lat: this.location.marker.lat,
            // lng: this.location.marker.lng
          }
        }, (results, status) => {
          this.decomposeAddressComponents(results);
        });
    }

    decomposeAddressComponents(addressArray) {
        if (addressArray.length == 0) {return false;}
        const address = addressArray[0].address_components;

        for(const element of address) {
            if (element.length == 0 && !element.types) {continue;}

            if (element.types.indexOf('street_number') > -1) {
                this.location.address_level_1 = element.long_name;
                continue;
            }
            if (element.types.indexOf('route') > -1) {
                this.location.address_level_1 += ', ' + element.long_name;
                continue;
            }
            if (element.types.indexOf('locality') > -1) {
                this.location.address_level_2 = element.long_name;
                continue;
            }
            if (element.types.indexOf('administrative_area_level_1') > -1) {
                this.location.address_state = element.long_name;
                continue;
            }
            if (element.types.indexOf('country') > -1) {
                this.location.address_country = element.long_name;
                continue;
            }
            if (element.types.indexOf('postal_code') > -1) {
                this.location.address_zip = element.long_name;
                continue;
            }
        }
    }
	onClickNextOfMarkers() {
		if (this.markersOfMap.totalPage > this.markersOfMap.startPage + this.markersOfMap.countPage) {
			this.markersOfMap.startPage += this.markersOfMap.countPage;
			this.markersOfMap.activePage = this.markersOfMap.startPage;
		}
	}
	onClickPrevOfMarkers() {
		this.markersOfMap.startPage -= this.markersOfMap.countPage;
		if (this.markersOfMap.startPage < 0) {this.markersOfMap.startPage = 0;}
		this.markersOfMap.activePage = this.markersOfMap.startPage + this.markersOfMap.countPage - 1;
	}
	onClickPageOfMarkers(page) {
		this.markersOfMap.activePage = page;
	}
	onClickMapListItem(index) {
		this.markersOfMap.activeIndex = index;
		this.cdr.detectChanges();
	}
	onClickCloseMarkerSelection(active = false) {
		if (active) {
			this.markersOfMap.activeIndex = -1;
			if (this.markersOfMap.campaigns.length == 1) {
				this.clear();
			}
		} else {
			this.markersOfMap.startPage = 0;
			this.markersOfMap.activeIndex = -1;
			this.markersOfMap.totalPage = 0;
			this.markersOfMap.pages = [];
			this.markersOfMap.campaigns = [];
			this.clear();
		}
	}
    async onClickMarker(marker, w) {
        if (this.selectedMarkerInfoWindow && this.selectedMarkerInfoWindow != w) {
            const prev = this.selectedMarkerInfoWindow;
            setTimeout(() => {
                prev.close();
            });
        }
        if (this.prevMarker && this.prevMarker != marker) {
            this.prevMarker.icon = this.oldIcon;
        }
        this.selectedMarkerInfoWindow = w;
        this.activeMarker = marker;
        this.prevMarker = marker;
        try {

			if (marker.count == 1) {
				const data = await this.campaignService.getById(marker._id);
				if (data) {
					this.markersOfMap.startPage = 0;
					this.markersOfMap.activeIndex = 0;
					this.markersOfMap.totalPage = 0;
					this.markersOfMap.pages = [];
					this.markersOfMap.campaigns = [campaign2htmlData(data, this.wallets, this.user)];
				}
			} else if (marker.count > 1) {
				const res = await this.campaignService.get({
					filterModel: {
						_id: {
							filterType: 'set',
							values: marker.campaignIds,
							isObject: true
						}
					},
					endRow: 0,
					pageSize: 100,
					sortModel: [{ colId: 'status', sort: 'asc'}],
					startRow: 0,

				}, {
					self: 'name description systemTitle logo logoSM backgroundSM background leftDays endDate startDate videoUrl raised status investorCount minimumGoal maximumGoal follows link typology roi roiAnnual holdingTime city address lat lng fullCity fullAddress minimumInvestment preMoneyEvaluation',
					company: 'name tags campaigns, article',
					source: 'link name'
				});
				if (!res) {throw {};}
				this.markersOfMap.campaigns = res.items.map( el => campaign2htmlData(el, this.wallets, this.user));
				this.markersOfMap.totalPage = Math.ceil(this.markersOfMap.campaigns.length / this.markersOfMap.pageSize);
				this.markersOfMap.startPage = 0;
				this.markersOfMap.activeIndex = -1;
				this.markersOfMap.activePage = 0;
				this.markersOfMap.pages = Array.from(Array(this.markersOfMap.totalPage).keys());
			}
		} catch (error) {
			console.log(error);
		}

        if (!(this.cdr as ViewRef).destroyed) {
            this.cdr.detectChanges();
        }
    }
    clear() {
        if (this.selectedMarkerInfoWindow) {
            this.selectedMarkerInfoWindow.close();
        }
        if (this.prevMarker) {
            this.prevMarker.icon = this.oldIcon;
        }
        this.activeMarker = null;
        this.selectedMarkerInfoWindow = null;
    }
    onCloseInfoWindow(infoMarker) {
    }
    onMouseOver(marker, w) {
        if (this.hoverMarkerInfoWindow && this.hoverMarkerInfoWindow != w && this.selectedMarkerInfoWindow != this.hoverMarkerInfoWindow) {
            const prev = this.hoverMarkerInfoWindow;
            setTimeout(() => {
                prev.close();
            });
        }
        this.hoverMarkerInfoWindow = w;
        this.hoverMarkerInfoWindow.open();

        if (this.prevMarker != marker) {
            if (this.prevMarker) {
                this.prevMarker.icon = this.oldIcon;
            }
            this.prevMarker = null;
        }

        this.oldIcon = marker.icon;
        marker.icon = './assets/media/misc/map-marker.png';

        this.cdr.detectChanges();
    }
    onMouseOut(marker, w) {
        if (this.hoverMarkerInfoWindow == w && this.selectedMarkerInfoWindow != w) {
            this.hoverMarkerInfoWindow.close();
            this.hoverMarkerInfoWindow = null;

            marker.icon = this.oldIcon;
            // this.oldIcon = null;

            this.cdr.detectChanges();
        }
    }

    setIcon(campaign) {
        switch( campaign.status) {
            case '3_funded':
                campaign.icon = './assets/media/misc/map-marker-sponsored.png';
                break;
            case '4_closed':
                campaign.icon = './assets/media/misc/map-marker.png';
                break;
            case '2_comingsoon':
                campaign.icon = './assets/media/misc/map-marker-yellow.png';
                break;
            case '1_ongoing':
                campaign.icon = './assets/media/misc/map-marker-green.png';
                break;
            case '5_extra':
                campaign.icon = './assets/media/misc/map-marker.png';
                break;
            case '6_refunded':
                campaign.icon = './assets/media/misc/map-marker-sponsored.png';
                break;
            default:
                campaign.hidden = true;
        }
        return campaign;
    }

}
