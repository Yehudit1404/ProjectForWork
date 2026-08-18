import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, NgZone, ViewChild, computed, effect, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { Router } from '@angular/router';
import { Ad } from '../../../core/models/ad.model';
import { CategoryService } from '../../../core/services/category.service';
import { coloredDotIcon, fixLeafletDefaultIcon } from '../../../core/utils/leaflet-icons.util';

const ISRAEL_CENTER: L.LatLngExpression = [31.8, 35.0];
const ISRAEL_ZOOM = 8;

// Alternative "wow" view for the board (spec bonus, taken further): instead
// of scrolling a paged grid, this shows every ad that has a location as a
// clustered pin on one map - zoom out to see the whole country, zoom in to
// see individual streets, click a cluster to explode it, click a pin for a
// quick preview. Built on Leaflet + OpenStreetMap tiles, with clustering via
// the leaflet.markercluster plugin (no @angular wrapper exists for either).
@Component({
  selector: 'app-ads-map-view',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './ads-map-view.component.html',
  styleUrl: './ads-map-view.component.scss',
})
export class AdsMapViewComponent implements AfterViewInit {
  private readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);

  @ViewChild('mapContainer') mapContainerRef?: ElementRef<HTMLDivElement>;

  ads = input.required<Ad[]>();

  readonly adsWithLocation = computed(() => this.ads().filter((a) => !!a.location));
  readonly adsWithoutLocationCount = computed(() => this.ads().length - this.adsWithLocation().length);

  private map: L.Map | null = null;
  private clusterGroup: L.MarkerClusterGroup | null = null;

  constructor() {
    fixLeafletDefaultIcon();

    effect(() => {
      const ads = this.adsWithLocation();
      this.rebuildMarkers(ads);
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    if (!this.mapContainerRef || this.map) return;

    this.map = L.map(this.mapContainerRef.nativeElement, {
      center: ISRAEL_CENTER,
      zoom: ISRAEL_ZOOM,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this.map);

    this.clusterGroup = L.markerClusterGroup();
    this.map.addLayer(this.clusterGroup);

    setTimeout(() => this.map?.invalidateSize(), 0);
    this.rebuildMarkers(this.adsWithLocation());
  }

  private rebuildMarkers(ads: Ad[]): void {
    if (!this.map || !this.clusterGroup) return;

    this.clusterGroup.clearLayers();

    if (ads.length === 0) return;

    const markers = ads.map((ad) => {
      const marker = L.marker([ad.location!.lat, ad.location!.lng], {
        icon: coloredDotIcon(this.categoryService.colorOf(ad.category)),
      });

      const popupEl = this.buildPopupContent(ad);
      marker.bindPopup(popupEl);
      return marker;
    });

    this.clusterGroup.addLayers(markers);

    const bounds = L.latLngBounds(markers.map((m) => m.getLatLng()));
    if (ads.length === 1) {
      this.map.setView(bounds.getCenter(), 14);
    } else {
      this.map.fitBounds(bounds, { padding: [40, 40] });
    }
  }

  private buildPopupContent(ad: Ad): HTMLElement {
    const container = document.createElement('div');
    container.className = 'ad-popup';

    if (ad.imageBase64) {
      const img = document.createElement('img');
      img.src = ad.imageBase64;
      img.alt = ad.title;
      container.appendChild(img);
    }

    const body = document.createElement('div');
    body.className = 'ad-popup-body';

    const title = document.createElement('div');
    title.className = 'ad-popup-title';
    title.textContent = ad.title;
    body.appendChild(title);

    if (ad.price !== null && ad.price !== undefined) {
      const price = document.createElement('div');
      price.className = 'ad-popup-price';
      price.textContent = `₪${ad.price}`;
      body.appendChild(price);
    }

    const link = document.createElement('button');
    link.type = 'button';
    link.className = 'ad-popup-link';
    link.textContent = 'לצפייה במודעה';
    link.addEventListener('click', () => {
      // Leaflet popup DOM events fire outside NgZone - re-enter it so the
      // Router navigation actually triggers Angular change detection.
      this.ngZone.run(() => this.router.navigate(['/ads', ad.id]));
    });
    body.appendChild(link);

    container.appendChild(body);
    return container;
  }
}
