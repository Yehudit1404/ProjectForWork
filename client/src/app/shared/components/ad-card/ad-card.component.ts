import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { formatRelativeDateHe } from '../../../core/utils/relative-date.util';
import { IdentityService } from '../../../core/services/identity.service';
import { CategoryService } from '../../../core/services/category.service';
import { Ad } from '../../../core/models/ad.model';
import { CategoryBadgeComponent } from '../category-badge/category-badge.component';

@Component({
  selector: 'app-ad-card',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatTooltipModule, CategoryBadgeComponent],
  templateUrl: './ad-card.component.html',
  styleUrl: './ad-card.component.scss',
})
export class AdCardComponent {
  private readonly identity = inject(IdentityService);
  private readonly categoryService = inject(CategoryService);

  ad = input.required<Ad>();
  showDistance = input(false);

  editRequested = output<Ad>();
  deleteRequested = output<Ad>();

  isMine = computed(() => this.identity.isOwner(this.ad()));
  categoryColor = computed(() => this.categoryService.colorOf(this.ad().category));
  categoryIcon = computed(() => this.categoryService.iconOf(this.ad().category));
  relativeDate = computed(() => formatRelativeDateHe(this.ad().createdAt));

  onEdit(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.editRequested.emit(this.ad());
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.deleteRequested.emit(this.ad());
  }
}
