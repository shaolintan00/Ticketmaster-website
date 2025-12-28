import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Search } from '../../services/search';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
  imports: [CommonModule],
})

export class Header {
  private router = inject(Router);
  private searchSvc = inject(Search);
  // mobile menu open state
  menuOpen = false;

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  goToSearch() {
    // navigate to search page and preserve cached search state (do not clear cache)
    this.router.navigate(['/search']);
  }

  goToFavorites() {
    this.router.navigate(['/favorites']);
  }
}

