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
  selector: 'app-home-featured',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './home-featured.html',
  hostDirectives: [FadeIn],
  host: {
    id: 'featured',
    class: 'block w-full scroll-mt-40 bg-background py-space-xl',
  },
})
export class HomeFeatured {
  private readonly http = inject(HttpClient);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly products = signal<Product[]>([]);
  readonly selectedCategoryId = signal<string | null>(null);
  readonly savedIds = signal<ReadonlySet<string>>(new Set());
  readonly placeholders = [1, 2, 3, 4, 5];

  readonly categoryFilters = computed(() => {
    const filters = new Map<string, string>();
    for (const product of this.products()) {
      const category = product.category;
      if (category?._id && !filters.has(category._id)) {
        filters.set(category._id, category.name);
      }
    }
    return [...filters.entries()].slice(0, 3).map(([id, name]) => ({ id, name }));
  });

  readonly visibleProducts = computed(() => {
    const categoryId = this.selectedCategoryId();
    const items = categoryId
      ? this.products().filter((product) => product.category?._id === categoryId)
      : this.products();
    return items.slice(0, 5);
  });

  constructor() {
    this.http
      .get<Products>(`${environment.apiUrl}${API_ENDPOINTS.products.list}`, {
        params: new HttpParams().set('limit', '20').set('sort', '-ratingsAverage'),
      })
      .pipe(
        takeUntilDestroyed(),
        catchError(() => {
          this.error.set('Could not load featured products.');
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((response) => this.products.set(response?.data ?? []));
  }

  selectCategory(id: string | null): void {
    this.selectedCategoryId.set(id);
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
