import { Routes } from '@angular/router';
import { Searchform } from './components/searchform/serachform';
import { Eventdetail } from './components/eventdetail/eventdetail';
import { FavoritesList } from './components/favorites/favorites';

export const routes: Routes = [
    { path: '', redirectTo: '/search', pathMatch: 'full' },
    { path: 'search', component: Searchform },
    { path: 'event/:id', component: Eventdetail },
    { path: 'favorites', component: FavoritesList },
    // future routes can be added here (e.g., results page)
];
