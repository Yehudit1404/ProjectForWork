import { Injectable } from '@angular/core';

export interface GeoPosition {
  lat: number;
  lng: number;
}

export type GeolocationErrorReason = 'unsupported' | 'permission-denied' | 'unavailable' | 'timeout';

export class GeolocationRequestError extends Error {
  constructor(public reason: GeolocationErrorReason) {
    super(reason);
  }
}

// Thin wrapper around the browser Geolocation API used both by the board's
// "ads near me" filter and the ad form's "use my current location" button
// (spec 5.4 / 6.1 / 6.4).
@Injectable({ providedIn: 'root' })
export class GeolocationService {
  getCurrentPosition(): Promise<GeoPosition> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new GeolocationRequestError('unsupported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            reject(new GeolocationRequestError('permission-denied'));
          } else if (error.code === error.TIMEOUT) {
            reject(new GeolocationRequestError('timeout'));
          } else {
            reject(new GeolocationRequestError('unavailable'));
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    });
  }
}
