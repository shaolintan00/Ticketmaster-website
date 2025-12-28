import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZardTabGroupComponent, ZardTabComponent } from '../../shared/components/tabs/tabs.component';
import { Heart } from '../heart/heart';
import { ActivatedRoute, Router } from '@angular/router';
import { Search } from '../../services/search';
import { Spotify } from '../../services/spotify';
import { Favorites } from '../../services/favorites';

@Component({
  selector: 'app-eventdetail',
  standalone: true,
  imports: [CommonModule, ZardTabGroupComponent, ZardTabComponent, Heart],
  templateUrl: './eventdetail.html',
  styleUrl: './eventdetail.css',
})
export class Eventdetail {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private searchSvc = inject(Search);
  private spotify = inject(Spotify);
  private favorites = inject(Favorites);

  event: any = null;
  loading = false;
  activeTab: 'info' | 'artist' | 'venue' = 'info';
  // whether the Artist tab should be shown (only for Music events)
  showArtistTab = false;
  // Spotify lookup result for the primary artist (if any)
  spotifyArtist: any | null = null;
  // whether this event is saved as favorite
  liked = false;

  // tabs used by the zard tabs component - will be computed after event loads
  tabs = [
    { name: 'Info', value: 'info' },
    { name: 'Artist/Team', value: 'artist', disabled: false },
    { name: 'Venue', value: 'venue' }
  ];

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadEvent(id);
  }

  async loadEvent(id: string) {
    this.loading = true;
    try {
      const res: any = await this.searchSvc.getEvent(id);
      this.event = res;
      // check if this event is already saved as favorite
      try {
        if (this.event?.id) {
          this.favorites.get(this.event.id).subscribe({
            next: (doc) => {
              this.liked = !!doc;
            },
            error: (err) => {
              if (err?.status === 404) this.liked = false;
              else console.warn('Failed to check favorite status', err);
            }
          });
        }
      } catch (chkErr) {
        console.warn('Favorite check failed', chkErr);
      }
      // Decide whether this is a Music event; show artist tab only for Music segment
      try {
        const isMusic = !!(this.event?.classifications?.some((c: any) => (c?.segment?.name || '').toLowerCase() === 'music'));
        this.showArtistTab = isMusic;
        // mark the Artist tab as disabled when not a music event but keep the tab visible
        this.tabs = [
          { name: 'Info', value: 'info' },
          { name: 'Artist/Team', value: 'artist', disabled: !this.showArtistTab },
          { name: 'Venue', value: 'venue' }
        ];
        // if artist tab is disabled and currently active, fall back to info
        if (!this.showArtistTab && this.activeTab === 'artist') this.activeTab = 'info';
      } catch (tErr) {
        this.showArtistTab = false;
      }
      // If the event has at least one attraction/artist, look it up on Spotify
      try {
        const firstArtistName = this.event?._embedded?.attractions?.[0]?.name;
        // Only attempt Spotify lookups for Music events
        if (this.showArtistTab && firstArtistName) {
          // call Spotify service (returns an array of artist items)
          const artists = await this.spotify.searchArtist(firstArtistName);
          // If spotify returns results, choose between the first two returned artists
          // Compare by followers.total (primary) then popularity (secondary). Prefer the first on ties.
          if (artists && artists.length) {
            if (artists.length === 1) {
              this.spotifyArtist = artists[0];
            } else {
              const a = artists[0];
              const b = artists[1];
              const aFollowers = Number(a?.followers?.total ?? 0);
              const bFollowers = Number(b?.followers?.total ?? 0);
              if (aFollowers !== bFollowers) {
                this.spotifyArtist = aFollowers > bFollowers ? a : b;
              } else {
                const aPop = Number(a?.popularity ?? 0);
                const bPop = Number(b?.popularity ?? 0);
                if (aPop !== bPop) {
                  this.spotifyArtist = aPop > bPop ? a : b;
                } else {
                  // identical metrics — prefer the first
                  this.spotifyArtist = a;
                }
              }
            }

            // Fetch albums for the chosen artist and attach to the spotifyArtist object so
            // the template can render them using spotifyArtist.albums.items or spotifyArtist.albums
            try {
              // Prefer fetching albums by artist ID when available. If no artist ID, skip album lookup.
              let albums: any[] = [];
              if (this.spotifyArtist?.id) {
                albums = await this.spotify.getArtistAlbums(this.spotifyArtist.id);
              } else {
                console.warn('No spotify artist id available; skipping album lookup');
                albums = [];
              }
              // Keep all returned albums (do not filter by artist). Deduplicate and sort.
              let items = (albums || []).filter(a => a);

              // Deduplicate by album id when available; otherwise by name. For duplicates, keep the newest release_date.
              const uniq = new Map<string, any>();
              for (const al of items) {
                const key = (al?.id) ? String(al.id) : ((al.name || '').toLowerCase().trim());
                if (!uniq.has(key)) {
                  uniq.set(key, al);
                } else {
                  const existing = uniq.get(key);
                  const eDate = existing?.release_date || '';
                  const nDate = al?.release_date || '';
                  if (nDate > eDate) uniq.set(key, al);
                }
              }

              const finalAlbums = Array.from(uniq.values()).sort((x, y) => {
                const xd = x?.release_date || '';
                const yd = y?.release_date || '';
                return yd.localeCompare(xd); // newest first
              });

              this.spotifyArtist.albums = { items: finalAlbums };
            } catch (albErr) {
              console.warn('Failed to load albums for artist', albErr);
              this.spotifyArtist.albums = { items: [] };
            }
          } else {
            this.spotifyArtist = null;
          }
        } else {
          // not a music event or no artist name -> clear spotify data
          this.spotifyArtist = null;
        }
      } catch (spErr) {
        console.warn('Spotify lookup failed', spErr);
        this.spotifyArtist = null;
      }
    } catch (err) {
      console.error('Failed to load event', err);
    } finally {
      this.loading = false;
    }
  }

  back() {
    this.router.navigate(['/search']);
  }

  setTab(t: 'info' | 'artist' | 'venue') {
    this.activeTab = t;
  }

  toggleFavorite(e?: MouseEvent) {
    if (e) e.stopPropagation();
    // The Heart component handles persistence and toasts. Keep this method to
    // allow legacy calls to toggle the local liked state.
    this.liked = !this.liked;
  }

  get shareFacebookUrl(): string | null {
    const url = this.event?.url;
    return url ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` : null;
  }

  get shareTwitterUrl(): string | null {
    const url = this.event?.url;
    const text = this.event?.name || '';
    return url ? `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` : null;
  }

  statusClass(): string {
    const codeRaw = this.event?.dates?.status?.code || '';
    return codeRaw
  }

  formatStartDate(): string {
    const start = this.event?.dates?.start;
    const localDate: string | undefined = start?.localDate;
    const localTime: string | undefined = start?.localTime;
    if (!localDate) return '';
    const parts = localDate.split('-'); // YYYY-MM-DD
    if (parts.length < 3) return localDate;
    const [, monthStr, dayStr] = parts;
    const monthIndex = Math.max(0, Math.min(11, parseInt(monthStr || '1', 10) - 1));
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = monthNames[monthIndex] || monthStr;
    const dayNum = parseInt(dayStr || '0', 10);
    const datePart = `${monthName} ${dayNum}`;
    if (!localTime) return datePart;
    // localTime may be HH:mm:ss or HH:mm
    const timeParts = localTime.split(':');
    let hour = parseInt(timeParts[0] || '0', 10);
    const minute = (timeParts[1] || '00').slice(0, 2);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;
    const hourStr = `${hour}`; // use non-padded hour in AM/PM format (e.g. 9:05 PM)
    return `${datePart}, ${hourStr}:${minute} ${ampm}`;
  }

  statusLabel(): string {
    const codeRaw = this.event?.dates?.status?.code || '';
    switch (codeRaw) {
      case 'onsale':
        return 'On Sale';
      case 'offsale':
        return 'Off Sale';
      case 'cancelled':
        return 'Cancelled';
      case 'postponed':
        return 'Postponed';
      default:
        return '';
    }
  }

  // Helpers to extract venue info from embedded venues
  getVenue(): any | null {
    return this.event?._embedded?.venues && this.event._embedded.venues.length ? this.event._embedded.venues[0] : null;
  }

  venueName(): string | null {
    return this.getVenue()?.name || null;
  }

  venueAddress(): string | null {
    const v = this.getVenue();
    if (!v) return null;
    const line1 = v?.address?.line1;
    const city = v?.city?.name;
    const state = v?.state?.stateCode || v?.state?.name;
    const parts = [line1, city, state].filter(Boolean);
    return parts.length ? parts.join(', ') : null;
  }

  venueCoords(): { lat?: string; lng?: string } {
    const v = this.getVenue();
    const lat = v?.location?.latitude;
    const lng = v?.location?.longitude;
    return { lat, lng };
  }

  venueMapUrl(): string | null {
    const { lat, lng } = this.venueCoords();
    if (lat && lng) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lat + ',' + lng)}`;
    }
    // fallback: use address text search
    const addr = this.venueAddress();
    return addr ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}` : null;
  }

  venueSeeEventsUrl(): string | null {
    const v = this.getVenue();
    return v?.url || null;
  }

  venueCoverImage(): string | null {
    const v = this.getVenue();
    // only show venue images (do not fallback to event images)
    const img = v?.images && v.images.length ? v.images[0].url : null;
    return img;
  }

  venueParking(): string | null {
    const v = this.getVenue();
    return v?.parkingDetail || v?.parking || v?.parkingInfo || v?.generalInfo?.parking || null;
  }

  venueGeneralRule(): string | null {
    const v = this.getVenue();
    return v?.generalInfo?.generalRule || v?.generalInfo?.generalRules || null;
  }

  venueChildRule(): string | null {
    const v = this.getVenue();
    return v?.generalInfo?.childRule || v?.generalInfo?.childRules || null;
  }

  /**
   * Return a Spotify URL for the given album object if available.
   * Prefer the album.external_urls.spotify value; fall back to the album id.
   */
  spotifyAlbumUrl(album: any): string | null {
    if (!album) return null;
    if (album.external_urls && album.external_urls.spotify) return album.external_urls.spotify;
    if (album.id) return `https://open.spotify.com/album/${encodeURIComponent(String(album.id))}`;
    return null;
  }
}
