import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Favorites } from '../../services/favorites';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-heart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './heart.html',
  styleUrls: ['./heart.css'],
})
export class Heart {
  // initial liked state from parent
  @Input() set liked(v: boolean) {
    this.isLiked = !!v;
  }
  // visual CSS class for button
  @Input() btnClass = 'btn';
  @Input() ariaLabel = 'Favorite';
  // full event object (used for persistence)
  @Input() event: any | null = null;

  // emits the new liked state and id back to parent
  @Output() likedChange = new EventEmitter<{ id?: string; liked: boolean }>();

  private favorites = inject(Favorites);

  // internal optimistic state
  private isLiked = false;

  // template binding
  get visualLiked() {
    return this.isLiked;
  }

  // Centralized toast helper so we can fallback if the library isn't wired at runtime
  private showToast(message: string, opts?: Record<string, any>) {
    try {
      // primary: programmatic API
      toast.info(message, opts);
      return;
    } catch (e) {
      // ignore and try fallback
    }

    try {
      const s = (window as any).__ngx_sonner_toast_state;
      if (s && typeof s.message === 'function') {
        s.message(message, opts || {});
        return;
      }
      if (s && typeof s.success === 'function') {
        s.success(message, opts || {});
        return;
      }
    } catch (e) {
      /* ignore */
    }

    // final fallback: console log
    // eslint-disable-next-line no-console
    console.log('[toast-fallback]', message, opts);
  }

  private showSuccess(message: string, opts?: Record<string, any>) {
    try {
      toast.success(message, opts);
      return;
    } catch (e) {
      // fallback
    }

    try {
      const s = (window as any).__ngx_sonner_toast_state;
      if (s && typeof s.success === 'function') {
        s.success(message, opts || {});
        return;
      }
    } catch (e) { }

    // eslint-disable-next-line no-console
    console.log('[toast-success-fallback]', message, opts);
  }

  onClick(e?: MouseEvent) {
    if (e) e.stopPropagation();
    const newState = !this.isLiked;
    this.isLiked = newState;
    const id = this.event?.id;

    if (newState) {
      // save favorite
      if (!this.event) {
        this.likedChange.emit({ id, liked: this.isLiked });
        return;
      }
      this.favorites.save(this.event).subscribe({
        next: () => {
          try {
            this.showSuccess(`${this.event?.name} added to favorites!`, {
              description: 'You can view it in the Favorites page.',
              position: 'top-right'
            });
          } catch (e) { }
          this.likedChange.emit({ id, liked: true });
        },
        error: (err) => {
          console.error('Failed to save favorite', err);
          this.isLiked = !newState; // revert
          this.likedChange.emit({ id, liked: this.isLiked });
        }
      });
    } else {
      if (!id) {
        this.isLiked = !newState;
        this.likedChange.emit({ id, liked: this.isLiked });
        return;
      }
      const evCopy = this.event;
      this.favorites.remove(id).subscribe({
        next: () => {
          try {
            this.showToast(`${evCopy?.name} removed from favorites!`, {
              position: 'top-right',
              action: {
                label: 'Undo',
                onClick: (evt: MouseEvent) => {
                  if (!evCopy) return;
                  this.favorites.save(evCopy).subscribe({
                    next: () => {
                      this.showSuccess(`${this.event?.name} re-added to favorites!`, {
                        description: 'You can view it in the Favorites page.',
                        position: 'top-right'
                      });
                      this.isLiked = true;
                      this.likedChange.emit({ id: evCopy.id, liked: true });
                    },
                    error: (err) => console.error('Failed to re-add favorite', err)
                  });
                }
              }
            });
          } catch (e) { }
          this.likedChange.emit({ id, liked: false });
        },
        error: (err) => {
          console.error('Failed to remove favorite', err);
          this.isLiked = !newState; // revert
          this.likedChange.emit({ id, liked: this.isLiked });
        }
      });
    }
  }
}
