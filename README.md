# Neighborhood Classifieds Board

SPA classifieds board with search/filtering (including by location) and full CRUD against a REST API. Built per [`docs/spec.md`](./docs/spec.md).

**Stack:** Angular 18 (standalone) + Angular Material + Leaflet · C# / ASP.NET Core 8 Web API · ads stored in a single JSON file (`server/Data/Storage/ads.json`), no database.

Maps use OpenStreetMap/Leaflet + Nominatim instead of Google Maps — no API key or billing account needed, works out of the box.

## Structure

```
client/   Angular client
server/   Web API
docs/     spec document
```

## Run

```bash
cd server && dotnet run       # http://localhost:5093, Swagger at /swagger
cd client && npm install && npm start   # http://localhost:4200
```

First server run seeds `ads.json` with sample listings. If you change the server port, update `apiBaseUrl` in `client/src/environments/environment.ts` and `Cors:AllowedOrigins` in `server/appsettings.json`.

## API

| Method | Route | Notes |
|---|---|---|
| GET | `/api/ads` | supports `search`, `category`, `ownerId`, `lat`, `lng`, `radiusKm`, `sortBy`, `page`, `pageSize` |
| GET | `/api/ads/{id}` | |
| POST | `/api/ads` | |
| PUT | `/api/ads/{id}` | owner only, via `X-Owner-Id` header |
| DELETE | `/api/ads/{id}` | owner only |
| GET | `/api/categories` | |

Full schemas in Swagger.

## Identity

No signup/login. A unique id is generated in the browser and stored in `localStorage`, sent with every request so the server can scope edit/delete to the ad's owner. Rationale in spec section 4.8.

## Extras beyond the base spec

Map view of all located ads (clustered), dark mode, page/card animations, locally-generated seed images (`server/Data/SeedImages/`).
