import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './components/header/header';
import { NgxSonnerToaster } from 'ngx-sonner';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header, NgxSonnerToaster],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  protected readonly title = signal('frontend');
}