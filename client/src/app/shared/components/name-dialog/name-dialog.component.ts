import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface NameDialogData {
  mode: 'welcome' | 'edit';
  currentName?: string;
}

@Component({
  selector: 'app-name-dialog',
  standalone: true,
  imports: [CommonModule, A11yModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './name-dialog.component.html',
})
export class NameDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<NameDialogComponent>);
  readonly data = inject<NameDialogData>(MAT_DIALOG_DATA);

  nameControl = new FormControl(this.data.currentName ?? '', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(2), Validators.maxLength(40)],
  });

  submit(): void {
    if (this.nameControl.invalid) {
      this.nameControl.markAsTouched();
      return;
    }
    this.dialogRef.close(this.nameControl.value.trim());
  }
}
