import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RouteLoading } from './shared/components/route-loading/route-loading';

@Component({
  imports: [RouterOutlet, RouteLoading],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
