import { Injectable } from '@angular/core';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';

@Injectable({
  providedIn: 'root'
})
export class Spotify {
  private sdk = SpotifyApi.withClientCredentials("", "");

  constructor() { }

  async searchArtist(name: string) {
    const items = await this.sdk.search(name, ["artist"]);
    return items.artists?.items || [];
  }

  // Preferred: fetch albums for a specific artist using the Artists -> albums endpoint.
  // This uses the artist's Spotify ID and returns the page.items array of SimplifiedAlbum.
  async getArtistAlbums(artistId: string, includeGroups: string = 'album,single', market?: string, limit: number = 50, offset: number = 0) {
    if (!artistId) return [];
    const page = await this.sdk.artists.albums(artistId, includeGroups, market as any, limit as any, offset);
    return page.items || [];
  }
}
