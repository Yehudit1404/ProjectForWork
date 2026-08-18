import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { AdLocation } from '../../core/models/ad.model';
import { AdService } from '../../core/services/ad.service';
import { CategoryService } from '../../core/services/category.service';
import { IdentityService } from '../../core/services/identity.service';
import { ImageTooLargeError, resizeImageToBase64 } from '../../core/utils/image.util';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { LocationPickerComponent } from '../../shared/components/location-picker/location-picker.component';

const TITLE_MAX = 80;
const DESCRIPTION_MAX = 1000;

@Component({
  selector: 'app-ad-form-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    LocationPickerComponent,
  ],
  templateUrl: './ad-form-page.component.html',
  styleUrl: './ad-form-page.component.scss',
})
export class AdFormPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly adService = inject(AdService);
  private readonly identity = inject(IdentityService);
  private readonly categoryService = inject(CategoryService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly categories = this.categoryService.categories;
  readonly titleMax = TITLE_MAX;
  readonly descriptionMax = DESCRIPTION_MAX;

  readonly editingId = signal<string | null>(null);
  readonly isEditMode = computed(() => this.editingId() !== null);
  readonly loadingExisting = signal(false);
  readonly saving = signal(false);

  readonly imageBase64 = signal<string | null>(null);
  readonly imageError = signal<string | null>(null);
  readonly location = signal<AdLocation | null>(null);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(TITLE_MAX)]],
    description: ['', [Validators.required, Validators.maxLength(DESCRIPTION_MAX)]],
    category: ['', Validators.required],
    price: this.fb.control<number | null>(null),
  });

  readonly priceRelevant = computed(() => {
    const categoryId = this.form.controls.category.value;
    return this.categoryService.byId(categoryId)?.priceRelevant ?? false;
  });

  ngOnInit(): void {
    void this.categoryService.ensureLoaded();

    this.form.controls.category.valueChanges.subscribe((categoryId) => {
      const relevant = this.categoryService.byId(categoryId)?.priceRelevant ?? false;
      if (!relevant) {
        this.form.controls.price.setValue(null);
      }
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editingId.set(id);
      this.loadExisting(id);
    }
  }

  private loadExisting(id: string): void {
    this.loadingExisting.set(true);
    this.adService.getById(id).subscribe({
      next: (ad) => {
        if (!this.identity.isOwner(ad)) {
          this.snackBar.open('אין לכם הרשאה לערוך מודעה זו.', 'סגור', { duration: 4000, direction: 'rtl' });
          this.router.navigate(['/ads', id]);
          return;
        }

        this.form.patchValue({
          title: ad.title,
          description: ad.description,
          category: ad.category,
          price: ad.price ?? null,
        });
        this.imageBase64.set(ad.imageBase64 ?? null);
        this.location.set(ad.location ?? null);
        this.loadingExisting.set(false);
      },
      error: () => {
        this.loadingExisting.set(false);
        this.router.navigate(['/']);
      },
    });
  }

  titleLength(): number {
    return this.form.controls.title.value.length;
  }

  descriptionLength(): number {
    return this.form.controls.description.value.length;
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    await this.processImageFile(file);
    input.value = '';
  }

  async onFileDropped(event: DragEvent): Promise<void> {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    await this.processImageFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  private async processImageFile(file: File): Promise<void> {
    if (!file.type.startsWith('image/')) {
      this.imageError.set('יש לבחור קובץ תמונה בלבד.');
      return;
    }
    this.imageError.set(null);
    try {
      const base64 = await resizeImageToBase64(file);
      this.imageBase64.set(base64);
    } catch (err) {
      this.imageError.set(err instanceof ImageTooLargeError ? err.message : 'לא ניתן היה לעבד את התמונה.');
    }
  }

  removeImage(): void {
    this.imageBase64.set(null);
  }

  onLocationChanged(location: AdLocation | null): void {
    this.location.set(location);
  }

  cancel(): void {
    if (this.form.dirty || this.imageBase64() || this.location()) {
      this.dialog
        .open(ConfirmDialogComponent, {
          data: { title: 'לצאת בלי לשמור?', message: 'השינויים שביצעתם לא יישמרו.', confirmLabel: 'צא בלי לשמור' },
          width: '400px',
        })
        .afterClosed()
        .subscribe((confirmed: boolean) => {
          if (confirmed) this.goBack();
        });
    } else {
      this.goBack();
    }
  }

  private goBack(): void {
    const id = this.editingId();
    this.router.navigate(id ? ['/ads', id] : ['/']);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const { title, description, category, price } = this.form.getRawValue();
    const payload = {
      title,
      description,
      category,
      price: this.priceRelevant() ? price : null,
      imageBase64: this.imageBase64(),
      location: this.location(),
    };

    const id = this.editingId();
    const request$ = id ? this.adService.update(id, payload) : this.adService.create(payload);

    request$.subscribe({
      next: (ad) => {
        this.saving.set(false);
        this.snackBar.open(id ? 'המודעה עודכנה בהצלחה' : 'המודעה פורסמה בהצלחה', 'סגור', {
          duration: 3000,
          direction: 'rtl',
        });
        this.router.navigate(['/ads', ad.id]);
      },
      error: () => this.saving.set(false),
    });
  }
}
