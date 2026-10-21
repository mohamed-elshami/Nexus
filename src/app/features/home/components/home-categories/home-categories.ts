import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { API_ENDPOINTS } from '../../../../core/constants/api-endpoints';
import { Categories, Category } from '../../../categories/models/category.model';
import { FadeIn } from '../../../../shared/directives/fade-in';

@Component({
  selector: 'app-home-categories',
  imports: [RouterLink],
  templateUrl: './home-categories.html',
  hostDirectives: [FadeIn],
  host: {
    class: 'block w-full bg-surface-container-low py-space-xl',
  },
})
export class HomeCategories {
  private readonly http = inject(HttpClient);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly categories = signal<Category[]>([]);
  readonly placeholders = [1, 2, 3, 4, 5, 6, 7, 8];

  constructor() {
    this.http
      .get<Categories>(`${environment.apiUrl}${API_ENDPOINTS.categories.list}`, {
        params: new HttpParams().set('limit', '8'),
      })
      .pipe(
        takeUntilDestroyed(),
        catchError(() => {
          this.error.set('Could not load categories.');
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((response) => this.categories.set(response?.data ?? []));
  }

  iconFor(name: string): string {
    const value = name.toLowerCase();
    if (value.includes('music') || value.includes('audio')) return 'headphones';
    if (value.includes('women')) return 'styler';
    if (value.includes('men')) return 'apparel';
    if (value.includes('super') || value.includes('market')) return 'grocery';
    if (value.includes('baby') || value.includes('toy')) return 'toys';
    if (value.includes('home')) return 'chair';
    if (value.includes('book')) return 'auto_stories';
    if (value.includes('beauty') || value.includes('health')) return 'spa';
    if (value.includes('mobile')) return 'smartphone';
    if (value.includes('electron')) return 'devices';
    if (value.includes('sport') || value.includes('game')) return 'sports_esports';
    return 'grid_view';
  }
}
