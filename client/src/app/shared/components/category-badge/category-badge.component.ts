import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CategoryService } from '../../../core/services/category.service';

@Component({
  selector: 'app-category-badge',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './category-badge.component.html',
  styleUrl: './category-badge.component.scss',
})
export class CategoryBadgeComponent {
  private readonly categoryService = inject(CategoryService);

  categoryId = input.required<string>();
  compact = input(false);

  color = computed(() => this.categoryService.colorOf(this.categoryId()));
  name = computed(() => this.categoryService.nameOf(this.categoryId()));
  icon = computed(() => this.categoryService.iconOf(this.categoryId()));
}
