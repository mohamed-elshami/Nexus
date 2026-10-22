import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PageMeta } from './core/seo/page-meta';
import { UserService } from './features/user/services/user.service';
import { RouteLoading } from './shared/components/route-loading/route-loading';

@Component({
  imports: [RouterOutlet, RouteLoading],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  constructor() {
    inject(PageMeta);
    inject(UserService);
  }
}
