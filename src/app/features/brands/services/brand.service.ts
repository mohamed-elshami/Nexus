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
  Brand,
  BrandQueryParams,
  BrandResponse,
  Brands,
} from '../models/brand.model';

@Injectable({
  providedIn: 'root',
})
export class BrandService {
  private readonly http = inject(HttpClient);
  private readonly brandsBaseUrl = `${environment.apiUrl}${API_ENDPOINTS.brands.list}`;
  private readonly brandBaseUrl = (id: string) =>
    `${environment.apiUrl}${API_ENDPOINTS.brands.byId(id)}`;

  private readonly _brands = signal<Brand[]>([]);
  private readonly _brand = signal<Brand | null>(null);
  private readonly _pagination = signal<PaginationMetadata | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly brands = this._brands.asReadonly();
  readonly brand = this._brand.asReadonly();
  readonly pagination = this._pagination.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  private readonly brandsRequest$ = new Subject<BrandQueryParams | undefined>();
  private readonly brandByIdRequest$ = new Subject<string>();
  private brandsRequestId = 0;
  private brandByIdRequestId = 0;

  constructor() {
    this.brandsRequest$
      .pipe(
        switchMap((params) => {
          const requestId = ++this.brandsRequestId;
          this._loading.set(true);
          this._error.set(null);

          return this.http
            .get<Brands>(this.brandsBaseUrl, {
              params: this.buildParams(params),
            })
            .pipe(
              catchError((err) => {
                if (requestId === this.brandsRequestId) {
                  this._error.set(err?.message ?? 'Failed to load brands');
                  this._brands.set([]);
                  this._pagination.set(null);
                }
                return of(null);
              }),
              finalize(() => {
                if (requestId === this.brandsRequestId) {
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
        this._brands.set(response.data);
        this._pagination.set(response.metadata);
      });

    this.brandByIdRequest$
      .pipe(
        switchMap((id) => {
          const requestId = ++this.brandByIdRequestId;
          this._loading.set(true);
          this._error.set(null);

          return this.http.get<BrandResponse>(this.brandBaseUrl(id)).pipe(
            catchError((err) => {
              if (requestId === this.brandByIdRequestId) {
                this._error.set(err?.message ?? 'Failed to load brand');
                this._brand.set(null);
              }
              return of(null);
            }),
            finalize(() => {
              if (requestId === this.brandByIdRequestId) {
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
        this._brand.set(response.data);
      });
  }

  getBrands(params?: BrandQueryParams): void {
    this.brandsRequest$.next(params);
  }

  getBrandById(id: string): void {
    this.brandByIdRequest$.next(id);
  }

  private buildParams(params?: BrandQueryParams): HttpParams {
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
