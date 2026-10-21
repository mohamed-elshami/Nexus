import { isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';

@Component({
  selector: 'app-route-loading',
  templateUrl: './route-loading.html',
  styleUrl: './route-loading.css',
})
export class RouteLoading {
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private skipInitial = true;

  readonly visible = signal(false);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationStart) {
        if (this.skipInitial) {
          return;
        }
        this.visible.set(true);
        return;
      }

      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.skipInitial = false;
        this.visible.set(false);
      }
    });
  }
}
