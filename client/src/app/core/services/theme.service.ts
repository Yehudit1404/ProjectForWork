import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'neighborhood-board.theme';
const DARK_CLASS = 'dark-theme';

// Manual light/dark toggle (spec's "wow" enhancement). Preference is
// persisted so it survives reloads; falls back to the OS/browser preference
// the very first time, then the user's explicit choice always wins.
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly darkModeSignal = signal<boolean>(this.resolveInitialTheme());
  readonly darkMode = this.darkModeSignal.asReadonly();

  constructor() {
    this.applyToDocument(this.darkModeSignal());
  }

  toggle(): void {
    this.setDarkMode(!this.darkModeSignal());
  }

  setDarkMode(enabled: boolean): void {
    this.darkModeSignal.set(enabled);
    localStorage.setItem(STORAGE_KEY, enabled ? 'dark' : 'light');
    this.applyToDocument(enabled);
  }

  private applyToDocument(enabled: boolean): void {
    document.body.classList.toggle(DARK_CLASS, enabled);
  }

  private resolveInitialTheme(): boolean {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }
}
