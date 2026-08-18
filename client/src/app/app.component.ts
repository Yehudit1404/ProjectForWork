import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { CategoryService } from './core/services/category.service';
import { IdentityService } from './core/services/identity.service';
import { ThemeService } from './core/services/theme.service';
import { NameDialogComponent } from './shared/components/name-dialog/name-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly identity = inject(IdentityService);
  private readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);
  private readonly theme = inject(ThemeService);

  readonly ownerName = this.identity.ownerName;
  readonly darkMode = this.theme.darkMode;

  toggleTheme(): void {
    this.theme.toggle();
  }

  ngOnInit(): void {
    void this.categoryService.ensureLoaded();

    if (!this.identity.hasDisplayName()) {
      this.dialog
        .open(NameDialogComponent, { data: { mode: 'welcome' }, disableClose: true, width: '400px' })
        .afterClosed()
        .subscribe((name: string | undefined) => {
          if (name) {
            this.identity.setDisplayName(name);
          }
        });
    }
  }

  initials(): string {
    return this.identity.initials();
  }

  changeDisplayName(): void {
    this.dialog
      .open(NameDialogComponent, {
        data: { mode: 'edit', currentName: this.identity.ownerName() ?? '' },
        width: '400px',
      })
      .afterClosed()
      .subscribe((name: string | undefined) => {
        if (name) {
          this.identity.setDisplayName(name);
        }
      });
  }

  resetLocalData(): void {
    this.identity.resetLocalData();
    this.router.navigate(['/']).then(() => window.location.reload());
  }
}
