import { Injectable } from '@angular/core';

export interface AddressSuggestion {
  label: string;
  lat: number;
  lng: number;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

// Free, key-free geocoding backed by OpenStreetMap's Nominatim service - the
// replacement for Google Places Autocomplete / Geocoding API, chosen so the
// location bonus works with zero signup and no billing account (see the
// README's "Google Maps API key" section for the trade-offs). Per Nominatim's
// usage policy for browser apps: keep requests light (debounced, capped at
// 5 results) and rely on the browser's own Referer header to identify us -
// this is not meant for high-volume/production traffic.
@Injectable({ providedIn: 'root' })
export class NominatimService {
  async searchAddress(query: string): Promise<AddressSuggestion[]> {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      return [];
    }

    const url = `${NOMINATIM_BASE}/search?format=jsonv2&limit=5&q=${encodeURIComponent(trimmed)}`;
    try {
      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!response.ok) return [];
      const results = (await response.json()) as NominatimResult[];
      return results.map((r) => ({
        label: r.display_name,
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
      }));
    } catch {
      return [];
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    const url = `${NOMINATIM_BASE}/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    try {
      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!response.ok) return null;
      const result = (await response.json()) as NominatimResult;
      return result.display_name ?? null;
    } catch {
      return null;
    }
  }
}
