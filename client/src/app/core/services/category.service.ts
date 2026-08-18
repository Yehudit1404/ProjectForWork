import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category } from '../models/category.model';

// Fallback used only if the API call fails before the real list loads, so
// the UI never has to render with zero categories.
const FALLBACK_CATEGORIES: Category[] = [
  { id: 'BuySell', name: 'מכירה ויד שנייה', color: '#D6336C', priceRelevant: true, icon: 'sell' },
  { id: 'Rentals', name: 'השכרות', color: '#7B1FA2', priceRelevant: true, icon: 'key' },
  { id: 'Events', name: 'אירועים', color: '#1976D2', priceRelevant: false, icon: 'event' },
  { id: 'Travel', name: 'טיולים ופנאי', color: '#2E7D32', priceRelevant: false, icon: 'luggage' },
  { id: 'General', name: 'כללי', color: '#616161', priceRelevant: false, icon: 'category' },
];

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly categoriesSignal = signal<Category[]>(FALLBACK_CATEGORIES);
  private loaded = false;

  readonly categories = this.categoriesSignal.asReadonly();

  async ensureLoaded(): Promise<void> {
    if (this.loaded) {
      return;
    }
    try {
      const result = await firstValueFrom(this.http.get<Category[]>(`${environment.apiBaseUrl}/categories`));
      this.categoriesSignal.set(result);
      this.loaded = true;
    } catch {
      // Keep the fallback list - the board should still be usable.
    }
  }

  byId(categoryId: string): Category | undefined {
    return this.categoriesSignal().find((c) => c.id === categoryId);
  }

  colorOf(categoryId: string): string {
    return this.byId(categoryId)?.color ?? '#616161';
  }

  nameOf(categoryId: string): string {
    return this.byId(categoryId)?.name ?? categoryId;
  }

  iconOf(categoryId: string): string {
    return this.byId(categoryId)?.icon ?? 'category';
  }
}
