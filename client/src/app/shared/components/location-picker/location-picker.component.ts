import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as L from 'leaflet';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { AdLocation } from '../../../core/models/ad.model';
import { GeolocationRequestError, GeolocationService } from '../../../core/services/geolocation.service';
import { AddressSuggestion, NominatimService } from '../../../core/services/nominatim.service';
import { fixLeafletDefaultIcon } from '../../../core/utils/leaflet-icons.util';

const DEFAULT_CENTER: L.LatLngExpression = [32.0853, 34.7818]; // Tel Aviv-Yafo
const DEFAULT_ZOOM = 11;
const SELECTED_ZOOM = 15;

// Interactive "attach a location to this ad" picker used by the ad form
// (spec 6.4c): address search with suggestions, a draggable pin, and a
// "use my current location" shortcut. Built on Leaflet + OpenStreetMap
// (Nominatim for search/reverse-geocoding) - no API key, no billing account,
// unlike the Google Maps equivalent this replaced.
@Component({
  selector: 'app-location-picker',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './location-picker.component.html',
  styleUrl: './location-picker.component.scss',
})
export class LocationPickerComponent implements AfterViewInit {
  private readonly nominatim = inject(NominatimService);
  private readonly geolocation = inject(GeolocationService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('mapContainer') mapContainerRef?: ElementRef<HTMLDivElement>;

  initialLocation = input<AdLocation | null>(null);
  locationChanged = output<AdLocation | null>();

  readonly locatingInProgress = signal(false);
  readonly addressText = signal('');
  readonly markerPosition = signal<{ lat: number; lng: number } | null>(null);
  readonly suggestions = signal<AddressSuggestion[]>([]);
  readonly suggestionsOpen = signal(false);
  readonly searching = signal(false);

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  private readonly addressInput$ = new Subject<string>();

  constructor() {
    fixLeafletDefaultIcon();

    this.addressInput$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        switchMap((term) => {
          if (term.trim().length < 3) {
            this.searching.set(false);
            return Promise.resolve<AddressSuggestion[]>([]);
          }
          this.searching.set(true);
          return this.nominatim.searchAddress(term);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((results) => {
        this.searching.set(false);
        this.suggestions.set(results);
        this.suggestionsOpen.set(results.length > 0);
      });

    effect(() => {
      const initial = this.initialLocation();
      if (initial) {
        this.applyExternalLocation(initial);
      }
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  onAddressInput(value: string): void {
    this.addressText.set(value);
    this.addressInput$.next(value);
  }

  selectSuggestion(suggestion: AddressSuggestion): void {
    this.suggestionsOpen.set(false);
    this.applyPosition({ lat: suggestion.lat, lng: suggestion.lng }, suggestion.label, SELECTED_ZOOM);
  }

  closeSuggestions(): void {
    // Delayed slightly so a click on a suggestion registers before the list disappears.
    setTimeout(() => this.suggestionsOpen.set(false), 150);
  }

  async useCurrentLocation(): Promise<void> {
    this.locatingInProgress.set(true);
    try {
      const position = await this.geolocation.getCurrentPosition();
      await this.applyPositionWithReverseGeocode(position, SELECTED_ZOOM);
    } catch (err) {
      const reason = err instanceof GeolocationRequestError ? err.reason : 'unavailable';
      this.snackBar.open(this.describeGeolocationError(reason), 'סגור', { duration: 5000, direction: 'rtl' });
    } finally {
      this.locatingInProgress.set(false);
    }
  }

  clearLocation(): void {
    this.markerPosition.set(null);
    this.addressText.set('');
    if (this.marker) {
      this.marker.remove();
      this.marker = null;
    }
    this.locationChanged.emit(null);
  }

  private initMap(): void {
    if (!this.mapContainerRef || this.map) return;

    this.map = L.map(this.mapContainerRef.nativeElement, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      void this.applyPositionWithReverseGeocode({ lat: e.latlng.lat, lng: e.latlng.lng }, SELECTED_ZOOM);
    });

    const initial = this.initialLocation();
    if (initial) {
      this.applyExternalLocation(initial);
    }

    // The map container may not have had its final size when created
    // (e.g. still inside an *ngIf/animation); recalculate once after layout.
    setTimeout(() => this.map?.invalidateSize(), 0);
  }

  private applyExternalLocation(location: AdLocation): void {
    this.addressText.set(location.address);
    this.placeMarker(location.lat, location.lng);
    this.map?.setView([location.lat, location.lng], SELECTED_ZOOM);
  }

  private async applyPositionWithReverseGeocode(position: { lat: number; lng: number }, zoom: number): Promise<void> {
    const address = (await this.nominatim.reverseGeocode(position.lat, position.lng)) ?? this.addressText();
    this.applyPosition(position, address, zoom);
  }

  private applyPosition(position: { lat: number; lng: number }, address: string, zoom: number): void {
    this.addressText.set(address);
    this.placeMarker(position.lat, position.lng);
    this.map?.setView([position.lat, position.lng], zoom);
    this.locationChanged.emit({ address, lat: position.lat, lng: position.lng });
  }

  private placeMarker(lat: number, lng: number): void {
    this.markerPosition.set({ lat, lng });

    if (!this.map) return;

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
      return;
    }

    this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);
    this.marker.on('dragend', () => {
      const pos = this.marker!.getLatLng();
      void this.applyPositionWithReverseGeocode({ lat: pos.lat, lng: pos.lng }, this.map!.getZoom());
    });
  }

  private describeGeolocationError(reason: GeolocationRequestError['reason']): string {
    switch (reason) {
      case 'permission-denied':
        return 'הגישה למיקום נחסמה. ניתן לאפשר אותה מהגדרות הדפדפן ולנסות שוב.';
      case 'unsupported':
        return 'הדפדפן שלכם אינו תומך באיתור מיקום.';
      case 'timeout':
        return 'איתור המיקום ארך זמן רב מדי. נסו שוב.';
      default:
        return 'לא ניתן היה לאתר את המיקום הנוכחי.';
    }
  }
}
