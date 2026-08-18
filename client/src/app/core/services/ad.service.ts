import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Ad, AdQuery, CreateAdRequest, PagedResult, UpdateAdRequest } from '../models/ad.model';
import { IdentityService } from './identity.service';

// The single point of contact with the /api/ads REST endpoints (spec 5.4).
// Nothing else in the app is allowed to call HttpClient for ad data directly.
@Injectable({ providedIn: 'root' })
export class AdService {
  private readonly http = inject(HttpClient);
  private readonly identity = inject(IdentityService);
  private readonly baseUrl = `${environment.apiBaseUrl}/ads`;

  getAll(query: AdQuery): Observable<PagedResult<Ad>> {
    let params = new HttpParams();
    if (query.search) params = params.set('search', query.search);
    if (query.category) params = params.set('category', query.category);
    if (query.ownerId) params = params.set('ownerId', query.ownerId);
    if (query.lat !== undefined) params = params.set('lat', query.lat);
    if (query.lng !== undefined) params = params.set('lng', query.lng);
    if (query.radiusKm !== undefined) params = params.set('radiusKm', query.radiusKm);
    if (query.sortBy) params = params.set('sortBy', query.sortBy);
    if (query.page !== undefined) params = params.set('page', query.page);
    if (query.pageSize !== undefined) params = params.set('pageSize', query.pageSize);

    return this.http.get<PagedResult<Ad>>(this.baseUrl, { params });
  }

  getById(id: string): Observable<Ad> {
    return this.http.get<Ad>(`${this.baseUrl}/${id}`);
  }

  create(input: Omit<CreateAdRequest, 'ownerId' | 'ownerName'>): Observable<Ad> {
    const request: CreateAdRequest = {
      ...input,
      ownerId: this.identity.ownerId(),
      ownerName: this.identity.ownerName() ?? 'אנונימי',
    };
    return this.http.post<Ad>(this.baseUrl, request);
  }

  update(id: string, request: UpdateAdRequest): Observable<Ad> {
    return this.http.put<Ad>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
