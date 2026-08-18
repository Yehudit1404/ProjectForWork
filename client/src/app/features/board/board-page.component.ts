import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { Ad, AdQuery } from '../../core/models/ad.model';
import { AdService } from '../../core/services/ad.service';
import { CategoryService } from '../../core/services/category.service';
import { GeoPosition, GeolocationRequestError, GeolocationService } from '../../core/services/geolocation.service';
import { AdCardComponent } from '../../shared/components/ad-card/ad-card.component';
import { AdsMapViewComponent } from '../../shared/components/ads-map-view/ads-map-view.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';

const ALL_CATEGORIES = 'All';
const PAGE_SIZE = 12;
const MAP_VIEW_PAGE_SIZE = 300;
type ViewMode = 'grid' | 'map';

@Component({
  selector: 'app-board-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatButtonToggleModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    AdCardComponent,
    AdsMapViewComponent,
    LoadingSkeletonComponent,
    EmptyStateComponent,
  ],
  templateUrl: './board-page.component.html',
  styleUrl: './board-page.component.scss',
})
export class BoardPageComponent implements OnInit {
  private readonly adService = inject(AdService);
  private readonly categoryService = inject(CategoryService);
  private readonly geolocation = inject(GeolocationService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly categories = this.categoryService.categories;
  readonly allCategoriesId = ALL_CATEGORIES;

  readonly ads = signal<Ad[]>([]);
  readonly loading = signal(true);
  readonly totalCount = signal(0);
  readonly page = signal(0); // zero-based, for mat-paginator
  readonly pageSize = PAGE_SIZE;

  readonly searchTerm = signal('');
  readonly selectedCategory = signal<string>(ALL_CATEGORIES);

  readonly nearbyEnabled = signal(false);
  readonly nearbyLoading = signal(false);
  readonly radiusKm = signal(10);
  readonly sortByDistance = signal(false);
  private currentPosition: GeoPosition | null = null;

  readonly viewMode = signal<ViewMode>('grid');
  readonly mapAds = signal<Ad[]>([]);
  readonly mapLoading = signal(false);

  private readonly searchInput$ = new Subject<string>();

  ngOnInit(): void {
    this.searchInput$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((term) => {
        this.searchTerm.set(term);
        this.page.set(0);
        this.refresh();
      });

    this.refresh();
  }

  onSearchInput(value: string): void {
    this.searchInput$.next(value);
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.searchInput$.next('');
  }

  selectCategory(categoryId: string): void {
    this.selectedCategory.set(categoryId);
    this.page.set(0);
    this.refresh();
  }

  async toggleNearby(enabled: boolean): Promise<void> {
    if (!enabled) {
      this.nearbyEnabled.set(false);
      this.sortByDistance.set(false);
      this.currentPosition = null;
      this.page.set(0);
      this.refresh();
      return;
    }

    this.nearbyLoading.set(true);
    try {
      this.currentPosition = await this.geolocation.getCurrentPosition();
      this.nearbyEnabled.set(true);
      this.page.set(0);
      this.refresh();
    } catch (err) {
      const reason = err instanceof GeolocationRequestError ? err.reason : 'unavailable';
      this.snackBar.open(this.describeGeoError(reason), 'סגור', { duration: 5000, direction: 'rtl' });
    } finally {
      this.nearbyLoading.set(false);
    }
  }

  onRadiusChange(value: number): void {
    this.radiusKm.set(value);
    this.page.set(0);
    this.refresh();
  }

  onSortByDistanceChange(value: boolean): void {
    this.sortByDistance.set(value);
    this.refresh();
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex);
    this.refresh();
  }

  goToNewAd(): void {
    this.router.navigate(['/ads/new']);
  }

  onEditRequested(ad: Ad): void {
    this.router.navigate(['/ads', ad.id, 'edit']);
  }

  onDeleteRequested(ad: Ad): void {
    const data: ConfirmDialogData = {
      title: `למחוק את המודעה "${ad.title}"?`,
      message: 'פעולה זו אינה הפיכה.',
      confirmLabel: 'מחק',
      danger: true,
    };

    this.dialog
      .open(ConfirmDialogComponent, { data, width: '420px' })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) return;
        this.adService.delete(ad.id).subscribe(() => {
          this.snackBar.open('המודעה נמחקה בהצלחה', 'סגור', { duration: 3000, direction: 'rtl' });
          this.refresh();
        });
      });
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
    if (mode === 'map') {
      this.refreshMapAds();
    }
  }

  private buildBaseQuery(): AdQuery {
    const query: AdQuery = {
      search: this.searchTerm() || undefined,
      category: this.selectedCategory() !== ALL_CATEGORIES ? this.selectedCategory() : undefined,
    };

    if (this.nearbyEnabled() && this.currentPosition) {
      query.lat = this.currentPosition.lat;
      query.lng = this.currentPosition.lng;
      query.radiusKm = this.radiusKm();
      query.sortBy = this.sortByDistance() ? 'distance' : 'newest';
    }

    return query;
  }

  private refresh(): void {
    this.loading.set(true);

    const query = this.buildBaseQuery();
    query.page = this.page() + 1;
    query.pageSize = this.pageSize;

    this.adService.getAll(query).subscribe({
      next: (result) => {
        this.ads.set(result.items);
        this.totalCount.set(result.totalCount);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    if (this.viewMode() === 'map') {
      this.refreshMapAds();
    }
  }

  private refreshMapAds(): void {
    this.mapLoading.set(true);
    const query = this.buildBaseQuery();
    query.page = 1;
    query.pageSize = MAP_VIEW_PAGE_SIZE;

    this.adService.getAll(query).subscribe({
      next: (result) => {
        this.mapAds.set(result.items);
        this.mapLoading.set(false);
      },
      error: () => this.mapLoading.set(false),
    });
  }

  private describeGeoError(reason: GeolocationRequestError['reason']): string {
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
