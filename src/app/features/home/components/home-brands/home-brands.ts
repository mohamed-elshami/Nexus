import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { API_ENDPOINTS } from '../../../../core/constants/api-endpoints';
import { Brand, Brands } from '../../../brands/models/brand.model';
import { FadeIn } from '../../../../shared/directives/fade-in';

@Component({
  selector: 'app-home-brands',
  imports: [RouterLink],
  templateUrl: './home-brands.html',
  hostDirectives: [FadeIn],
  host: {
    class: 'block w-full bg-surface-container-low py-space-xl',
  },
})
export class HomeBrands {
  private readonly http = inject(HttpClient);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly brands = signal<Brand[]>([]);
  readonly placeholders = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  constructor() {
    this.http
      .get<Brands>(`${environment.apiUrl}${API_ENDPOINTS.brands.list}`, {
        params: new HttpParams().set('limit', '10'),
      })
      .pipe(
        takeUntilDestroyed(),
        catchError(() => {
          this.error.set('Could not load brands.');
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((response) => this.brands.set(response?.data ?? []));
  }
}
