import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Favorites } from '../../services/favorites';
import { Eventcard } from '../eventcard/eventcard';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, Eventcard],
  templateUrl: './favorites.html',
  styleUrls: ['./favorites.css']
})
export class FavoritesList implements OnInit, OnDestroy {
  private favoritesSvc = inject(Favorites);
  events: any[] = [];
  loading = true;
  private sub?: Subscription;

  ngOnInit(): void {
    this.load();
    // reload whenever favorites change (save/remove) so Undo or external saves refresh this list.
    this.sub = this.favoritesSvc.changes$.subscribe(() => this.load());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  load() {
    this.loading = true;
    this.favoritesSvc.list().subscribe({
      next: (items) => { this.events = items || []; this.loading = false; },
      error: (err) => { console.error('Failed to load favorites', err); this.loading = false; }
    });
  }

  onCardLike(ev: { id?: string; liked: boolean }) {
    // If user unlikes an event from the favorites page, remove it from the list immediately.
    if (!ev || !ev.id) return;
    if (!ev.liked) {
      const idx = this.events.findIndex(e => e.id === ev.id);
      if (idx >= 0) {
        this.events.splice(idx, 1);
      }
    } else {
      // If somehow an item is liked here, refresh the list to include it
      this.load();
    }
  }
}
