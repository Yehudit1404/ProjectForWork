import { Injectable, signal } from '@angular/core';
import { Ad } from '../models/ad.model';

const OWNER_ID_KEY = 'neighborhood-board.ownerId';
const OWNER_NAME_KEY = 'neighborhood-board.ownerName';

// Lightweight, login-free "identity" used to decide which ads are "mine".
// See the spec (section 4.8) for the rationale: no signup/password is
// required by the assignment, only the ability to tell "my ads" apart from
// everyone else's, so a browser-local id is enough.
@Injectable({ providedIn: 'root' })
export class IdentityService {
  private readonly ownerIdSignal = signal<string>(this.loadOrCreateOwnerId());
  private readonly ownerNameSignal = signal<string | null>(localStorage.getItem(OWNER_NAME_KEY));

  readonly ownerId = this.ownerIdSignal.asReadonly();
  readonly ownerName = this.ownerNameSignal.asReadonly();

  hasDisplayName(): boolean {
    return !!this.ownerNameSignal();
  }

  setDisplayName(name: string): void {
    const trimmed = name.trim();
    localStorage.setItem(OWNER_NAME_KEY, trimmed);
    this.ownerNameSignal.set(trimmed);
  }

  isOwner(ad: Pick<Ad, 'ownerId'>): boolean {
    return ad.ownerId === this.ownerIdSignal();
  }

  initials(): string {
    const name = this.ownerNameSignal();
    if (!name) {
      return '?';
    }
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const second = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + second).toUpperCase();
  }

  resetLocalData(): void {
    localStorage.removeItem(OWNER_ID_KEY);
    localStorage.removeItem(OWNER_NAME_KEY);
    this.ownerIdSignal.set(this.loadOrCreateOwnerId());
    this.ownerNameSignal.set(null);
  }

  private loadOrCreateOwnerId(): string {
    const existing = localStorage.getItem(OWNER_ID_KEY);
    if (existing) {
      return existing;
    }
    const created = crypto.randomUUID();
    localStorage.setItem(OWNER_ID_KEY, created);
    return created;
  }
}
