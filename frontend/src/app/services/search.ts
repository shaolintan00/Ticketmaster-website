import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Event as TMEvent } from '../models/event.model';

@Injectable({ providedIn: 'root' })
export class Search {
  http = inject(HttpClient);
  // Use relative paths so the frontend talks to the same origin the app is served from.
  // In development you can still run the backend at localhost:8080 and the
  // dev-server proxy or CORS will route requests; in production the built SPA
  // will be served by the backend and relative URLs will work.
  private base = '';
  private googleApiKey = '';
  private ipinfoToken = '';

  constructor() { }

  // cache last search options/results so UI can restore when navigating back
  private _lastQuery: any = null;
  private _lastResults: TMEvent[] | null = null;

  getLastQuery() {
    return this._lastQuery;
  }

  getLastResults() {
    return this._lastResults;
  }

  clearCache() {
    this._lastQuery = null;
    this._lastResults = null;
  }

  suggest(keyword: string) {
    let params = new HttpParams().set('keyword', keyword);
    return this.http.get(`${this.base}/autocomplete`, { params }).toPromise();
  }

  getEvent(id: string) {
    return this.http.get(`${this.base}/event/${encodeURIComponent(id)}`).toPromise();
  }

  async search(opts: any = {}) {
    try {
      let params = new HttpParams();
      if (opts.keyword) params = params.set('keyword', opts.keyword);
      if (opts.category) params = params.set('category', opts.category);
      if (opts.location) {
        // call Google Geocoding API to get lat/lng
        try {
          const geoParams = new HttpParams()
            .set('address', opts.location)
            .set('key', this.googleApiKey);
          const geoRes: any = await this.http
            .get('https://maps.googleapis.com/maps/api/geocode/json', { params: geoParams })
            .toPromise();

          if (geoRes && Array.isArray(geoRes.results) && geoRes.results.length > 0) {
            const loc = geoRes.results[0].geometry.location;
            params = params.set('latlong', `${loc.lat},${loc.lng}`);
          } else {
            console.warn('Geocoding returned no results for', opts.location);
          }
        } catch (geoErr) {
          console.error('Geocoding error', geoErr);
          // fall through without latlong (server may accept plain location or fail)
        }
      } else if (opts.autodetect) {
        try {
          // ipinfo returns { loc: "lat,lng", ... }
          const ipRes: any = await this.http.get(`https://ipinfo.io/json?token=${this.ipinfoToken}`).toPromise();
          const locStr: string | undefined = ipRes?.loc;
          if (locStr) {
            const [lat, lng] = locStr.split(',').map(s => s.trim());
            if (lat && lng) {
              params = params.set('latlong', `${lat},${lng}`);
            }
          } else {
            console.warn('ipinfo returned no loc field', ipRes);
          }
        } catch (ipErr) {
          console.error('ipinfo error', ipErr);
          // fall through without latlong
        }
      }

      if (opts.distance != null) params = params.set('distance', String(opts.distance));
      if (opts.location == null && opts.autodetect) {
        // if autodetect requested but no location provided, backend can handle it;
        // we still forward the autodetect flag so server can act accordingly
        params = params.set('autodetect', 'true');
      }

      const res: any = await this.http.get(`${this.base}/search`, { params }).toPromise();

      // Map Ticketmaster response to typed Event[] using the Event model
      const events: TMEvent[] = (res?._embedded?.events || []).map((e: any) => e as TMEvent);
      // cache
      this._lastQuery = opts || {};
      this._lastResults = events;
      return events;
    } catch (err) {
      console.error('search error', err);
      throw err;
    }
  }
}