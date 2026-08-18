import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="not-found-page">
      <mat-icon>search_off</mat-icon>
      <h1>404 - העמוד לא נמצא</h1>
      <p>הקישור שהגעתם אליו אינו קיים.</p>
      <a mat-flat-button class="cta-button" routerLink="/">חזרה ללוח המודעות</a>
    </div>
  `,
  styles: `
    :host {
      display: block;
      animation: fade-in-up 0.32s ease both;
    }
    .not-found-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 10px;
      padding: 80px 16px;
      color: var(--color-text-secondary);
    }
    mat-icon { font-size: 56px; width: 56px; height: 56px; color: #c6ccd2; }
  `,
})
export class NotFoundComponent {}
