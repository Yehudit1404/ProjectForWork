import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { Ad } from '../../core/models/ad.model';
import { AdService } from '../../core/services/ad.service';
import { IdentityService } from '../../core/services/identity.service';
import { AdCardComponent } from '../../shared/components/ad-card/ad-card.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';

const PAGE_SIZE = 12;

@Component({
  selector: 'app-my-ads-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatPaginatorModule,
    AdCardComponent,
    LoadingSkeletonComponent,
    EmptyStateComponent,
  ],
  templateUrl: './my-ads-page.component.html',
  styleUrl: './my-ads-page.component.scss',
})
export class MyAdsPageComponent implements OnInit {
  private readonly adService = inject(AdService);
  private readonly identity = inject(IdentityService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly ads = signal<Ad[]>([]);
  readonly loading = signal(true);
  readonly totalCount = signal(0);
  readonly page = signal(0);
  readonly pageSize = PAGE_SIZE;
  readonly searchTerm = signal('');

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

  private refresh(): void {
    this.loading.set(true);
    this.adService
      .getAll({
        ownerId: this.identity.ownerId(),
        search: this.searchTerm() || undefined,
        page: this.page() + 1,
        pageSize: this.pageSize,
      })
      .subscribe({
        next: (result) => {
          this.ads.set(result.items);
          this.totalCount.set(result.totalCount);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
