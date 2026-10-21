import { DecimalPipe } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { API_ENDPOINTS } from '../../../../core/constants/api-endpoints';
import { Product, Products } from '../../../products/models/product.model';
import { FadeIn } from '../../../../shared/directives/fade-in';

@Component({
  selector: 'app-home-hero',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './home-hero.html',
  hostDirectives: [FadeIn],
  host: {
    class: 'relative block w-full overflow-hidden py-space-xl',
  },
})
export class HomeHero {
  private readonly http = inject(HttpClient);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly products = signal<Product[]>([]);
  readonly savedIds = signal<ReadonlySet<string>>(new Set());

  readonly spotlight = computed(() => this.products()[0] ?? null);
  readonly floating = computed(() => this.products().slice(1, 3));

  readonly stats = [
    { value: '25k+', label: 'Curated Products', valueClass: 'text-primary' },
    { value: '99.8%', label: 'Happy Shoppers', valueClass: 'text-secondary' },
    { value: '< 48h', label: 'Express Delivery', valueClass: 'text-tertiary' },
  ];

  constructor() {
    this.http
      .get<Products>(`${environment.apiUrl}${API_ENDPOINTS.products.list}`, {
        params: new HttpParams().set('limit', '3').set('sort', '-ratingsAverage'),
      })
      .pipe(
        takeUntilDestroyed(),
        catchError(() => {
          this.error.set('Could not load the spotlight.');
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((response) => this.products.set(response?.data ?? []));
  }

  saved(id: string): boolean {
    return this.savedIds().has(id);
  }

  toggleSaved(id: string): void {
    this.savedIds.update((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }
}
