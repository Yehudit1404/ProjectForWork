import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { Ad } from '../../core/models/ad.model';
import { AdService } from '../../core/services/ad.service';
import { CategoryService } from '../../core/services/category.service';
import { IdentityService } from '../../core/services/identity.service';
import { fixLeafletDefaultIcon } from '../../core/utils/leaflet-icons.util';
import { formatRelativeDateHe } from '../../core/utils/relative-date.util';
import { CategoryBadgeComponent } from '../../shared/components/category-badge/category-badge.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-ad-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule, CategoryBadgeComponent],
  templateUrl: './ad-detail-page.component.html',
  styleUrl: './ad-detail-page.component.scss',
})
export class AdDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly adService = inject(AdService);
  private readonly identity = inject(IdentityService);
  private readonly categoryService = inject(CategoryService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  @ViewChild('mapContainer') mapContainerRef?: ElementRef<HTMLDivElement>;

  readonly ad = signal<Ad | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);

  private map: L.Map | null = null;

  constructor() {
    fixLeafletDefaultIcon();

    // The map <div> only exists once ad() resolves *and* has a location
    // (it's behind *ngIf) - retry map init shortly after either changes.
    effect(() => {
      const ad = this.ad();
      if (ad?.location) {
        queueMicrotask(() => this.tryInitMap());
      }
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }

    this.adService.getById(id).subscribe({
      next: (ad) => {
        this.ad.set(ad);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  isMine(): boolean {
    const ad = this.ad();
    return !!ad && this.identity.isOwner(ad);
  }

  relativeDate(): string {
    const ad = this.ad();
    return ad ? formatRelativeDateHe(ad.createdAt) : '';
  }

  categoryName(categoryId: string): string {
    return this.categoryService.nameOf(categoryId);
  }

  deleteAd(): void {
    const ad = this.ad();
    if (!ad) return;

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
          this.router.navigate(['/']);
        });
      });
  }

  private tryInitMap(): void {
    const location = this.ad()?.location;
    if (!location || !this.mapContainerRef || this.map) return;

    this.map = L.map(this.mapContainerRef.nativeElement, {
      center: [location.lat, location.lng],
      zoom: 15,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this.map);

    L.marker([location.lat, location.lng]).addTo(this.map);

    setTimeout(() => this.map?.invalidateSize(), 0);
  }
}
