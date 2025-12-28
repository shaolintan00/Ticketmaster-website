import { Component, Input, inject, OnInit } from '@angular/core';
import { Eventcard } from '../eventcard/eventcard';
import { CommonModule } from '@angular/common';
import { Event as TMEvent } from '../../models/event.model';
import { Favorites } from '../../services/favorites';

@Component({
  selector: 'app-resultgrid',
  standalone: true,          // make result grid standalone too
  imports: [CommonModule, Eventcard],
  templateUrl: './resultgrid.html',
  styleUrls: ['./resultgrid.css'],
})
export class Resultgrid {
  @Input() results: TMEvent[] = [];
  /** Indicates whether a search has been performed. When false we don't show the "no results" placeholder. */
  @Input() searched = false;
  private favorites = inject(Favorites);
  favoriteIds = new Set<string>();

  ngOnInit(): void {
    // load saved favorites once and keep the set for quick lookup
    this.favorites.list().subscribe({
      next: (items) => {
        (items || []).forEach((i: any) => { if (i?.id) this.favoriteIds.add(i.id); });
      },
      error: (err) => console.warn('Failed to load favorites for result grid', err)
    });
  }

  onLike(ev: { id?: string, liked: boolean }) {
    if (!ev?.id) return;
    if (ev.liked) this.favoriteIds.add(ev.id);
    else this.favoriteIds.delete(ev.id);
  }

}
