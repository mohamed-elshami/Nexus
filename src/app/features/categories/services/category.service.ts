import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import {
  Subject,
  catchError,
  finalize,
  of,
  switchMap,
} from 'rxjs';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { environment } from '../../../../environments/environment';
import { PaginationMetadata } from '../../../shared/models/pagination.model';
import {
  Categories,
  Category,
  CategoryQueryParams,
  CategoryResponse,
} from '../models/category.model';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly categoriesBaseUrl = `${environment.apiUrl}${API_ENDPOINTS.categories.list}`;
  private readonly categoryBaseUrl = (id: string) =>
    `${environment.apiUrl}${API_ENDPOINTS.categories.byId(id)}`;

  private readonly _categories = signal<Category[]>([]);
  private readonly _category = signal<Category | null>(null);
  private readonly _pagination = signal<PaginationMetadata | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly categories = this._categories.asReadonly();
  readonly category = this._category.asReadonly();
  readonly pagination = this._pagination.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  private readonly categoriesRequest$ = new Subject<CategoryQueryParams | undefined>();
  private readonly categoryByIdRequest$ = new Subject<string>();
  private categoriesRequestId = 0;
  private categoryByIdRequestId = 0;

  constructor() {
    this.categoriesRequest$
      .pipe(
        switchMap((params) => {
          const requestId = ++this.categoriesRequestId;
          this._loading.set(true);
          this._error.set(null);

          return this.http
            .get<Categories>(this.categoriesBaseUrl, {
              params: this.buildParams(params),
            })
            .pipe(
              catchError((err) => {
                if (requestId === this.categoriesRequestId) {
                  this._error.set(err?.message ?? 'Failed to load categories');
                  this._categories.set([]);
                  this._pagination.set(null);
                }
                return of(null);
              }),
              finalize(() => {
                if (requestId === this.categoriesRequestId) {
                  this._loading.set(false);
                }
              }),
            );
        }),
      )
      .subscribe((response) => {
        if (!response) {
          return;
        }
        this._categories.set(response.data);
        this._pagination.set(response.metadata);
      });

    this.categoryByIdRequest$
      .pipe(
        switchMap((id) => {
          const requestId = ++this.categoryByIdRequestId;
          this._loading.set(true);
          this._error.set(null);

          return this.http.get<CategoryResponse>(this.categoryBaseUrl(id)).pipe(
            catchError((err) => {
              if (requestId === this.categoryByIdRequestId) {
                this._error.set(err?.message ?? 'Failed to load category');
                this._category.set(null);
              }
              return of(null);
            }),
            finalize(() => {
              if (requestId === this.categoryByIdRequestId) {
                this._loading.set(false);
              }
            }),
          );
        }),
      )
      .subscribe((response) => {
        if (!response) {
          return;
        }
        this._category.set(response.data);
      });
  }

  getCategories(params?: CategoryQueryParams): void {
    this.categoriesRequest$.next(params);
  }

  getCategoryById(id: string): void {
    this.categoryByIdRequest$.next(id);
  }

  private buildParams(params?: CategoryQueryParams): HttpParams {
    let httpParams = new HttpParams();

    if (!params) {
      return httpParams;
    }

    if (params.page != null) {
      httpParams = httpParams.set('page', params.page);
    }

    if (params.limit != null) {
      httpParams = httpParams.set('limit', params.limit);
    }

    return httpParams;
  }
}
