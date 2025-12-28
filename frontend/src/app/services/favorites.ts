import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class Favorites {
    private http = inject(HttpClient);
    // Use explicit backend base URL to avoid hitting the Angular dev server (which returns 404).
    // Change this to an environment-based value if you add `environment.ts` later.
    // Use relative base so requests go to the same origin the app is served from.
    private readonly base = '';

    // Emits whenever favorites change (save/remove). Components can subscribe to this to refresh UI.
    private _changes = new Subject<void>();
    readonly changes$ = this._changes.asObservable();

    list() {
        return this.http.get<any[]>(`${this.base}/favorites`);
    }

    get(id: string) {
        return this.http.get<any>(`${this.base}/favorites/${encodeURIComponent(id)}`);
    }

    save(event: any) {
        return this.http.post<any>(`${this.base}/favorites`, event).pipe(
            tap(() => this._changes.next())
        );
    }

    remove(id: string) {
        return this.http.delete<any>(`${this.base}/favorites/${encodeURIComponent(id)}`).pipe(
            tap(() => this._changes.next())
        );
    }
}
