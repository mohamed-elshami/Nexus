import { isPlatformBrowser, DecimalPipe } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, DestroyRef, inject, PLATFORM_ID, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { API_ENDPOINTS } from '../../../../core/constants/api-endpoints';
import { Product, Products } from '../../../products/models/product.model';
import { FadeIn } from '../../../../shared/directives/fade-in';

@Component({
  selector: 'app-home-deal',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './home-deal.html',
  hostDirectives: [FadeIn],
  host: {
    id: 'deals',
    class: 'block w-full scroll-mt-40 py-space-xl',
  },
})
export class HomeDeal {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly product = signal<Product | null>(null);
  readonly hours = signal(0);
  readonly minutes = signal(0);
  readonly seconds = signal(0);

  constructor() {
    this.tick();
    if (isPlatformBrowser(this.platformId)) {
      const timer = setInterval(() => this.tick(), 1000);
      this.destroyRef.onDestroy(() => clearInterval(timer));
    }

    this.http
      .get<Products>(`${environment.apiUrl}${API_ENDPOINTS.products.list}`, {
        params: new HttpParams().set('limit', '1').set('sort', '-sold'),
      })
      .pipe(
        takeUntilDestroyed(),
        catchError(() => {
          this.error.set('Could not load today’s deal.');
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((response) => this.product.set(response?.data[0] ?? null));
  }

  pad(value: number): string {
    return value.toString().padStart(2, '0');
  }

  private tick(): void {
    const now = new Date();
    const end = new Date(now);
    end.setHours(24, 0, 0, 0);
    const total = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
    this.hours.set(Math.floor(total / 3600));
    this.minutes.set(Math.floor((total % 3600) / 60));
    this.seconds.set(total % 60);
  }
}
