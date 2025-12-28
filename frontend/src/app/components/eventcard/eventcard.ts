import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Heart } from '../heart/heart';
import { Event as TMEvent } from '../../models/event.model';

@Component({
  selector: 'app-eventcard',
  templateUrl: './eventcard.html',
  styleUrls: ['./eventcard.css'],
  standalone: true,
  imports: [CommonModule, Heart]
})
export class Eventcard {
  @Input() event: TMEvent | null = null; // typed Ticketmaster Event model
  @Input() liked = false;
  @Output() like = new EventEmitter<{ id?: string, liked: boolean }>();
  private router = inject(Router);


  openDetail() {
    if (!this.event?.id) return;
    this.router.navigate(['/event', this.event.id]);
  }

  get dateLabel() {
    // Build a human-friendly date string. If time is available, include time; otherwise show date only.
    const start = this.event?.dates?.start as any;
    if (!start) return '';

    // Prefer an explicit dateTime field if present, otherwise combine localDate and localTime when available.
    const maybeIso = start.dateTime || (start.localDate && start.localTime ? `${start.localDate}T${start.localTime}` : start.localDate);
    if (!maybeIso) return '';

    try {
      const dt = new Date(maybeIso);
      // Determine whether time detail is available. Use timeTBA flag when present; otherwise infer from presence of time or dateTime.
      const hasTime = !(start.timeTBA === true) && (Boolean(start.dateTime) || Boolean(start.localTime));

      const opts: Intl.DateTimeFormatOptions = hasTime ? { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' } : { month: 'short', day: 'numeric' };
      return new Intl.DateTimeFormat('en-US', opts).format(dt);
    } catch {
      return String(maybeIso);
    }
  }

  get displayEvent() {
    // Map TMEvent to a simpler shape the template expects
    if (!this.event) {
      return {
        id: undefined,
        image: undefined,
        category: undefined,
        datetime: undefined,
        name: 'Sample Event',
        venue: 'Sample Venue'
      };
    }

    const image = this.event.images?.length ? this.event.images[0].url : undefined;
    const category = this.event.classifications?.[0]?.genre?.name || this.event.classifications?.[0]?.segment?.name;
    const datetime = this.dateLabel;
    const name = this.event.name;
    const venue = this.event._embedded?.venues?.[0]?.name;
    return { id: this.event.id, image, category, datetime, name, venue };
  }
}