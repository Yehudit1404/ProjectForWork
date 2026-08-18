export interface AdLocation {
  address: string;
  lat: number;
  lng: number;
}

export interface Ad {
  id: string;
  title: string;
  description: string;
  category: string;
  price?: number | null;
  imageBase64?: string | null;
  ownerId: string;
  ownerName: string;
  location?: AdLocation | null;
  createdAt: string;
  updatedAt: string;
  distanceKm?: number | null;
}

export interface CreateAdRequest {
  title: string;
  description: string;
  category: string;
  price?: number | null;
  imageBase64?: string | null;
  ownerId: string;
  ownerName: string;
  location?: AdLocation | null;
}

export interface UpdateAdRequest {
  title: string;
  description: string;
  category: string;
  price?: number | null;
  imageBase64?: string | null;
  location?: AdLocation | null;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export type SortBy = 'newest' | 'distance';

export interface AdQuery {
  search?: string;
  category?: string;
  ownerId?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  sortBy?: SortBy;
  page?: number;
  pageSize?: number;
}
