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
  Product,
  ProductQueryParams,
  ProductResponse,
  Products,
} from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly productsBaseUrl = `${environment.apiUrl}${API_ENDPOINTS.products.list}`;
  private readonly productBaseUrl = (id: string) =>
    `${environment.apiUrl}${API_ENDPOINTS.products.byId(id)}`;

  private readonly _products = signal<Product[]>([]);
  private readonly _product = signal<Product | null>(null);
  private readonly _pagination = signal<PaginationMetadata | null>(null);
  private readonly _results = signal(0);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly products = this._products.asReadonly();
  readonly product = this._product.asReadonly();
  readonly pagination = this._pagination.asReadonly();
  readonly results = this._results.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  private readonly productsRequest$ = new Subject<ProductQueryParams | undefined>();
  private readonly productByIdRequest$ = new Subject<string>();
  private productsRequestId = 0;
  private productByIdRequestId = 0;

  constructor() {
    this.productsRequest$
      .pipe(
        switchMap((params) => {
          const requestId = ++this.productsRequestId;
          this._loading.set(true);
          this._error.set(null);

          return this.http
            .get<Products>(this.productsBaseUrl, {
              params: this.buildParams(params),
            })
            .pipe(
              catchError((err) => {
                if (requestId === this.productsRequestId) {
                  this._error.set(err?.message ?? 'Failed to load products');
                  this._products.set([]);
                  this._pagination.set(null);
                  this._results.set(0);
                }
                return of(null);
              }),
              finalize(() => {
                if (requestId === this.productsRequestId) {
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
        this._products.set(response.data);
        this._pagination.set(response.metadata);
        this._results.set(response.results);
      });

    this.productByIdRequest$
      .pipe(
        switchMap((id) => {
          const requestId = ++this.productByIdRequestId;
          this._loading.set(true);
          this._error.set(null);

          return this.http.get<ProductResponse>(this.productBaseUrl(id)).pipe(
            catchError((err) => {
              if (requestId === this.productByIdRequestId) {
                this._error.set(err?.message ?? 'Failed to load product');
                this._product.set(null);
              }
              return of(null);
            }),
            finalize(() => {
              if (requestId === this.productByIdRequestId) {
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
        this._product.set(response.data);
      });
  }

  getProducts(params?: ProductQueryParams): void {
    this.productsRequest$.next(params);
  }

  getProductById(id: string): void {
    this.productByIdRequest$.next(id);
  }

  private buildParams(params?: ProductQueryParams): HttpParams {
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

    if (params.priceGte != null) {
      httpParams = httpParams.set('price[gte]', params.priceGte);
    }

    if (params.priceLte != null) {
      httpParams = httpParams.set('price[lte]', params.priceLte);
    }

    if (params.sort) {
      httpParams = httpParams.set('sort', params.sort);
    }

    params.brands?.forEach((brand) => {
      httpParams = httpParams.append('brand', brand);
    });

    params.categories?.forEach((category) => {
      httpParams = httpParams.append('category[in]', category);
    });

    if (params.subcategory) {
      httpParams = httpParams.set('subcategory', params.subcategory);
    }

    if (params.ratingsAverageGte != null) {
      httpParams = httpParams.set('ratingsAverage[gte]', params.ratingsAverageGte);
    }

    return httpParams;
  }
}
