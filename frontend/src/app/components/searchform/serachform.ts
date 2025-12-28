import { Component, OnInit, OnDestroy, HostListener, ElementRef, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription, from, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, tap, switchMap, catchError, finalize } from 'rxjs/operators';
import { Search } from '../../services/search';
import { Event as TMEvent } from '../../models/event.model';
import { Resultgrid } from '../resultgrid/resultgrid';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-searchform',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Resultgrid],
  templateUrl: './searchform.html',
  styleUrls: ['./searchform.css']
})
export class Searchform implements OnInit, OnDestroy {
  form: FormGroup;
  searchSvc = inject(Search);
  suggestions: any[] = [];
  loadingSuggestions = false;
  showSuggestions = false;
  keywordFocused = false;
  results: TMEvent[] = [];
  /** whether a search has been performed (used to control the No-results placeholder) */
  searched = false;

  // validation error messages for the form fields
  keywordError: string | null = null;
  locationError: string | null = null;
  distanceError: string | null = null;

  private subs = new Subscription();

  segMap: Record<string, string> = {
    'default': '',
    'music': 'KZFzniwnSyZfZ7v7nJ',
    'sports': 'KZFzniwnSyZfZ7v7nE',
    'arts': 'KZFzniwnSyZfZ7v7na',
    'film': 'KZFzniwnSyZfZ7v7nn',
    'miscellaneous': 'KZFzniwnSyZfZ7v7n1'
  };

  categories = ['All', 'Music', 'Sports', 'Arts & Theater', 'Film', 'Miscellaneous'];
  catOpen = false;

  constructor(private fb: FormBuilder, private elRef: ElementRef) {
    this.form = this.fb.group({
      keyword: [''],
      category: ['All'],
      location: [''],
      autodetect: [false],
      distance: [10, [Validators.required, Validators.min(1), Validators.max(100)]]
    });
  }

  ngOnInit(): void {
    // location autodel behavior
    this.subs.add(
      this.form.get('autodetect')!.valueChanges.subscribe((val: boolean) => {
        const locCtrl = this.form.get('location')!;
        if (val) {
          locCtrl.disable({ emitEvent: false });
          locCtrl.setValue('Location will be autodetected');
        } else {
          locCtrl.setValue('');
          locCtrl.enable({ emitEvent: false });
        }
      })
    );

    // Restore cached search state if available (so Back to Search preserves results)
    try {
      const lastQuery: any = this.searchSvc.getLastQuery && this.searchSvc.getLastQuery();
      const lastResults: TMEvent[] | null = this.searchSvc.getLastResults && this.searchSvc.getLastResults();
      if (lastQuery) {
        const formVals: any = {};
        if (lastQuery.keyword) formVals.keyword = lastQuery.keyword;
        if (lastQuery.location) formVals.location = lastQuery.location;
        if (lastQuery.autodetect) formVals.autodetect = true;
        if (lastQuery.distance != null) formVals.distance = lastQuery.distance;
        // map segmentId back to category
        if (lastQuery.segmentId) {
          const segId = lastQuery.segmentId;
          const found = Object.entries(this.segMap).find(([, id]) => id === segId);
          if (found) {
            const key = found[0];
            // find display name in categories by matching lowercase
            const match = this.categories.find(c => c.toLowerCase().startsWith(key));
            if (match) formVals.category = match;
          }
        }
        // apply restored form values without emitting change events
        this.form.patchValue(formVals, { emitEvent: false });

        if (lastResults && Array.isArray(lastResults)) {
          this.results = lastResults;
          this.searched = true;
        }
      }
    } catch (err) {
      // non-fatal
      console.warn('Failed to restore search state', err);
    }

    // Suggestion pipeline: only trigger when user typed >= 2 chars. Show spinner while loading.
    this.subs.add(
      this.form.get('keyword')!.valueChanges.pipe(
        debounceTime(250),
        distinctUntilChanged(),
        tap((v: string) => {
          // showSuggestions is driven by returned suggestions; keep focused state separate
          // but we can open suggestions area if there is input
          if (!this.keywordFocused) {
            // don't auto-open suggestions when not focused
            this.showSuggestions = false;
          }
        }),
        filter((v: string) => v != null && v.trim().length >= 1),
        tap(() => { this.loadingSuggestions = true; }),
        switchMap((keyword: string) => {
          const q = keyword.trim();
          const result$ = (this.searchSvc.suggest(q) as any);
          return result$ instanceof Promise ? from(result$) : result$;
        }),
        catchError(err => {
          console.error('[suggest] request error', err);
          return of({ _embedded: {} } as any);
        }),
        finalize(() => { this.loadingSuggestions = false; })
      ).subscribe((res: any) => {
        const embedded = res?._embedded || {};
        const fromServer = (embedded.attractions || []).map((a: any) => ({ name: a.name }));

        // Always include the exact typed value as the first suggestion. It's acceptable
        // to show duplicates (typed value + server-supplied same string) per UX preference.
        const current = (this.form.get('keyword')!.value || '').toString().trim();
        if (current) {
          const typed = { name: current, _typed: true };
          this.suggestions = [typed, ...fromServer];
        } else {
          this.suggestions = fromServer;
        }

        // only show suggestions panel if focused
        this.showSuggestions = this.keywordFocused && this.suggestions.length > 0;
      })
    );

    // clear validation errors when user changes inputs
    this.subs.add(this.form.get('keyword')!.valueChanges.subscribe((v: string) => {
      if (v && v.trim()) this.keywordError = null;
    }));

    this.subs.add(this.form.get('location')!.valueChanges.subscribe((v: string) => {
      if (v && v.trim() && this.form.get('autodetect')!.value !== true) this.locationError = null;
    }));

    this.subs.add(this.form.get('distance')!.valueChanges.subscribe((v: any) => {
      // normalize and validate as user types: ensure not empty and within range
      if (v == null || v === '') {
        this.distanceError = 'Distance must be at least 1 mile.';
        return;
      }
      const n = Number(v);
      if (isNaN(n)) {
        this.distanceError = 'Distance must be a number';
      } else if (n <= 0) {
        this.distanceError = 'Distance must be at least 1 mile.';
      } else if (n > 100) {
        this.distanceError = 'Distance cannot exceed 100 miles';
      } else {
        this.distanceError = null;
      }
    }));
  }

  // reference to the keyword input so we can focus it programmatically
  @ViewChild('keywordInput', { static: false }) keywordInput?: ElementRef<HTMLInputElement>;

  onKeywordFocus() {
    this.keywordFocused = true;
    // when focused, show suggestions if we already have items
    if (this.suggestions.length > 0) {
      this.showSuggestions = true;
    }
  }

  onKeywordBlur() {
    // small timeout to allow click handlers (e.g., selecting suggestion) before hiding
    setTimeout(() => {
      this.keywordFocused = false;
      this.showSuggestions = false;
    }, 150);
  }

  onDropdownClick() {
    // if currently loading, don't toggle; spinner indicates progress
    if (this.loadingSuggestions) {
      return;
    }

    // focus the input and toggle suggestions
    if (this.keywordInput && this.keywordInput.nativeElement) {
      this.keywordInput.nativeElement.focus();
    }

    // toggle suggestion panel only if we have suggestions; otherwise keep focus and let typing trigger suggestions
    this.showSuggestions = !this.showSuggestions && this.suggestions.length > 0;
  }

  // keywords helpers
  clearKeyword() {
    this.form.patchValue({ keyword: '' });
    this.suggestions = [];
    this.showSuggestions = false;
    // keep focus in the input so user can type again
    if (this.keywordInput && this.keywordInput.nativeElement) {
      this.keywordInput.nativeElement.focus();
      this.keywordFocused = true;
    }
  }

  selectSuggestion(item: any) {
    this.form.patchValue({ keyword: item.name });
    this.suggestions = [];
    this.showSuggestions = false;
  }

  // category dropdown
  toggleCategory() {
    this.catOpen = !this.catOpen;
  }

  selectCategory(c: string) {
    this.form.patchValue({ category: c });
    this.catOpen = false;
  }

  // close menus when clicking outside
  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (!this.elRef.nativeElement.contains(e.target)) {
      this.catOpen = false;
      this.showSuggestions = false;
    }
  }

  onSearch() {
    const v = this.form.value || {};
    const keyword = (v.keyword || '').trim();
    const category = v.category || 'All';
    const autodetect = !!v.autodetect;
    let location = (v.location || '').trim();
    const distance = v.distance != null ? v.distance : 10;

    // validate required fields
    let valid = true;
    this.keywordError = null;
    this.locationError = null;
    this.distanceError = null;
    if (!keyword) {
      this.keywordError = 'Please enter keywords to search for events.';
      valid = false;
    }
    if (!autodetect) {
      // when autodetect is false, require a non-empty location
      if (!location || location === 'Location will be autodetected') {
        this.locationError = 'Location is required when auto-detect is disabled.';
        valid = false;
      }
    }
    // distance validation: must be a number > 0 and <= 100
    if (distance == null || distance === '') {
      this.distanceError = 'Distance must be at least 1 mile.';
      valid = false;
    } else {
      const dn = Number(distance);
      if (isNaN(dn)) {
        this.distanceError = 'Distance must be a number';
        valid = false;
      } else if (dn <= 0) {
        this.distanceError = 'Distance must be at least 1 mile.';
        valid = false;
      } else if (dn > 100) {
        this.distanceError = 'Distance cannot exceed 100 miles';
        valid = false;
      }
    }

    if (!valid) {
      // mark invalid controls as touched so their error messages render under each field
      try {
        this.form.get('keyword')!.markAsTouched();
      } catch (e) { /* ignore */ }
      try {
        this.form.get('location')!.markAsTouched();
      } catch (e) { /* ignore */ }
      try {
        this.form.get('distance')!.markAsTouched();
      } catch (e) { /* ignore */ }

      // do not proceed with search
      this.searched = false; // keep as not-searched so UI shows default placeholder if appropriate
      return;
    }

    // build options for the Search service
    const opts: any = {
      distance
    };
    if (keyword) opts.keyword = keyword;
    if (category && category !== 'All') {
      const key = category.toLowerCase();
      opts.segmentId = this.segMap[key];
    }
    if (!autodetect && location && location !== 'Location will be autodetected') {
      opts.location = location;
    } else if (autodetect) {
      opts.autodetect = true;
    }

    // call the Search service and handle either Promise or Observable
    try {
      const result = this.searchSvc.search(opts) as any;
      const handleResult = (res: any) => {
        // expect Event[] from Search service; fall back to raw embedded events
        this.results = Array.isArray(res) ? res : (res?._embedded?.events || []);
        this.searched = true;
      };
      const handleError = (err: any) => {
        console.error('search error', err);
        // mark as searched so the UI can show a No-results state if appropriate
        this.searched = true;
      };

      if (result instanceof Promise) {
        result.then(handleResult).catch(handleError);
      } else if (result && typeof result.subscribe === 'function') {
        result.subscribe(handleResult, handleError);
      } else {
        console.warn('Search returned unexpected value', result);
      }
    } catch (err) {
      console.error('onSearch exception', err);
    }
  }

  /**
   * Return a user-facing error message for a control.
   * Priority: explicit error variable (e.g. distanceError) -> computed validator message -> null
   */
  getControlError(name: string): string | null {
    // explicit error variables take precedence
    if (name === 'keyword' && this.keywordError) return this.keywordError;
    if (name === 'location' && this.locationError) return this.locationError;
    if (name === 'distance' && this.distanceError) return this.distanceError;

    const ctrl = this.form.get(name);
    if (!ctrl) return null;

    // only show computed messages when the control has been interacted with
    if (!ctrl.touched || !ctrl.invalid) return null;

    const errs = ctrl.errors || {};
    if (errs['required']) {
      if (name === 'distance') return 'Distance must be at least 1 mile.';
      if (name === 'location') return 'Please enter a location or enable Auto-detect Location.';
      return 'This field is required.';
    }
    if (errs['min']) return 'Distance must be at least 1 mile.';
    if (errs['max']) return 'Distance cannot exceed 100 miles';

    return null;
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}