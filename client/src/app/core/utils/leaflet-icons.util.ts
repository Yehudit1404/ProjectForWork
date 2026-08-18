import * as L from 'leaflet';

let defaultIconFixed = false;

// Leaflet's default marker icon references relative image paths that break
// once bundled - the images are copied into public/leaflet/ (served as
// static assets, see angular.json) and pointed at explicitly here, once,
// before any marker is created.
export function fixLeafletDefaultIcon(): void {
  if (defaultIconFixed) return;
  defaultIconFixed = true;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'leaflet/marker-icon-2x.png',
    iconUrl: 'leaflet/marker-icon.png',
    shadowUrl: 'leaflet/marker-shadow.png',
  });
}

// A small colored circle marker (used on the "all ads" map view) so each pin
// visually matches its category color, the same palette used everywhere
// else in the app (category badges, board filter chips).
export function coloredDotIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: 'ad-map-dot-icon',
    html: `<span style="background:${color}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}
