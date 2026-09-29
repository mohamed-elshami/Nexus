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
  Subcategories,
  Subcategory,
  SubcategoryQueryParams,
  SubcategoryResponse,
} from '../models/subcategory.model';

@Injectable({
  providedIn: 'root',
})
export class SubcategoryService {
  private readonly http = inject(HttpClient);
  private readonly subcategoriesBaseUrl = `${environment.apiUrl}${API_ENDPOINTS.subcategories.list}`;
  private readonly subcategoryBaseUrl = (id: string) =>
    `${environment.apiUrl}${API_ENDPOINTS.subcategories.byId(id)}`;
  private readonly subcategoriesByCategoryUrl = (categoryId: string) =>
    `${environment.apiUrl}${API_ENDPOINTS.subcategories.byCategory(categoryId)}`;

  private readonly _subcategories = signal<Subcategory[]>([]);
  private readonly _subcategory = signal<Subcategory | null>(null);
  private readonly _categorySubcategories = signal<Subcategory[]>([]);
  private readonly _pagination = signal<PaginationMetadata | null>(null);
  private readonly _categorySubcategoriesPagination =
    signal<PaginationMetadata | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly subcategories = this._subcategories.asReadonly();
  readonly subcategory = this._subcategory.asReadonly();
  readonly categorySubcategories = this._categorySubcategories.asReadonly();
  readonly pagination = this._pagination.asReadonly();
  readonly categorySubcategoriesPagination =
    this._categorySubcategoriesPagination.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  private readonly subcategoriesRequest$ = new Subject<
    SubcategoryQueryParams | undefined
  >();
  private readonly subcategoryByIdRequest$ = new Subject<string>();
  private readonly subcategoriesByCategoryRequest$ = new Subject<{
    categoryId: string;
    params?: SubcategoryQueryParams;
  }>();
  private subcategoriesRequestId = 0;
  private subcategoryByIdRequestId = 0;
  private subcategoriesByCategoryRequestId = 0;

  constructor() {
    this.subcategoriesRequest$
      .pipe(
        switchMap((params) => {
          const requestId = ++this.subcategoriesRequestId;
          this._loading.set(true);
          this._error.set(null);

          return this.http
            .get<Subcategories>(this.subcategoriesBaseUrl, {
              params: this.buildParams(params),
            })
            .pipe(
              catchError((err) => {
                if (requestId === this.subcategoriesRequestId) {
                  this._error.set(err?.message ?? 'Failed to load subcategories');
                  this._subcategories.set([]);
                  this._pagination.set(null);
                }
                return of(null);
              }),
              finalize(() => {
                if (requestId === this.subcategoriesRequestId) {
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
        this._subcategories.set(response.data);
        this._pagination.set(response.metadata);
      });

    this.subcategoryByIdRequest$
      .pipe(
        switchMap((id) => {
          const requestId = ++this.subcategoryByIdRequestId;
          this._loading.set(true);
          this._error.set(null);

          return this.http
            .get<SubcategoryResponse>(this.subcategoryBaseUrl(id))
            .pipe(
              catchError((err) => {
                if (requestId === this.subcategoryByIdRequestId) {
                  this._error.set(err?.message ?? 'Failed to load subcategory');
                  this._subcategory.set(null);
                }
                return of(null);
              }),
              finalize(() => {
                if (requestId === this.subcategoryByIdRequestId) {
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
        this._subcategory.set(response.data);
      });

    this.subcategoriesByCategoryRequest$
      .pipe(
        switchMap(({ categoryId, params }) => {
          const requestId = ++this.subcategoriesByCategoryRequestId;
          this._loading.set(true);
          this._error.set(null);

          return this.http
            .get<Subcategories>(this.subcategoriesByCategoryUrl(categoryId), {
              params: this.buildParams(params),
            })
            .pipe(
              catchError((err) => {
                if (requestId === this.subcategoriesByCategoryRequestId) {
                  this._error.set(
                    err?.message ?? 'Failed to load category subcategories',
                  );
                  this._categorySubcategories.set([]);
                  this._categorySubcategoriesPagination.set(null);
                }
                return of(null);
              }),
              finalize(() => {
                if (requestId === this.subcategoriesByCategoryRequestId) {
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
        this._categorySubcategories.set(response.data);
        this._categorySubcategoriesPagination.set(response.metadata);
      });
  }

  getSubcategories(params?: SubcategoryQueryParams): void {
    this.subcategoriesRequest$.next(params);
  }

  getSubcategoryById(id: string): void {
    this.subcategoryByIdRequest$.next(id);
  }

  getSubcategoriesByCategory(
    categoryId: string,
    params?: SubcategoryQueryParams,
  ): void {
    this.subcategoriesByCategoryRequest$.next({ categoryId, params });
  }

  private buildParams(params?: SubcategoryQueryParams): HttpParams {
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
