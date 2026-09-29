import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
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
  Review,
  ReviewDeleteResponse,
  ReviewMutationResponse,
  ReviewPayload,
  ReviewQueryParams,
  ReviewResponse,
  Reviews,
} from '../models/review.model';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly reviewsBaseUrl = `${environment.apiUrl}${API_ENDPOINTS.reviews.list}`;
  private readonly reviewBaseUrl = (id: string) =>
    `${environment.apiUrl}${API_ENDPOINTS.reviews.byId(id)}`;
  private readonly productReviewsUrl = (productId: string) =>
    `${environment.apiUrl}${API_ENDPOINTS.reviews.byProduct(productId)}`;

  private readonly _reviews = signal<Review[]>([]);
  private readonly _review = signal<Review | null>(null);
  private readonly _productReviews = signal<Review[]>([]);
  private readonly _pagination = signal<PaginationMetadata | null>(null);
  private readonly _productReviewsPagination =
    signal<PaginationMetadata | null>(null);
  private readonly _loading = signal(false);
  private readonly _mutationLoading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _mutationError = signal<string | null>(null);

  readonly reviews = this._reviews.asReadonly();
  readonly review = this._review.asReadonly();
  readonly productReviews = this._productReviews.asReadonly();
  readonly pagination = this._pagination.asReadonly();
  readonly productReviewsPagination =
    this._productReviewsPagination.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly mutationLoading = this._mutationLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly mutationError = this._mutationError.asReadonly();

  private readonly reviewsRequest$ = new Subject<ReviewQueryParams | undefined>();
  private readonly reviewByIdRequest$ = new Subject<string>();
  private readonly productReviewsRequest$ = new Subject<{
    productId: string;
    params?: ReviewQueryParams;
  }>();
  private readonly createReviewRequest$ = new Subject<{
    productId: string;
    payload: ReviewPayload;
  }>();
  private readonly updateReviewRequest$ = new Subject<{
    reviewId: string;
    payload: ReviewPayload;
  }>();
  private readonly deleteReviewRequest$ = new Subject<string>();

  private reviewsRequestId = 0;
  private reviewByIdRequestId = 0;
  private productReviewsRequestId = 0;
  private createReviewRequestId = 0;
  private updateReviewRequestId = 0;
  private deleteReviewRequestId = 0;

  constructor() {
    this.reviewsRequest$
      .pipe(
        switchMap((params) => {
          const requestId = ++this.reviewsRequestId;
          this._loading.set(true);
          this._error.set(null);

          return this.http
            .get<Reviews>(this.reviewsBaseUrl, {
              params: this.buildParams(params),
            })
            .pipe(
              catchError((err) => {
                if (requestId === this.reviewsRequestId) {
                  this._error.set(err?.message ?? 'Failed to load reviews');
                  this._reviews.set([]);
                  this._pagination.set(null);
                }
                return of(null);
              }),
              finalize(() => {
                if (requestId === this.reviewsRequestId) {
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
        this._reviews.set(response.data);
        this._pagination.set(response.metadata);
      });

    this.reviewByIdRequest$
      .pipe(
        switchMap((id) => {
          const requestId = ++this.reviewByIdRequestId;
          this._loading.set(true);
          this._error.set(null);

          return this.http.get<ReviewResponse>(this.reviewBaseUrl(id)).pipe(
            catchError((err) => {
              if (requestId === this.reviewByIdRequestId) {
                this._error.set(err?.message ?? 'Failed to load review');
                this._review.set(null);
              }
              return of(null);
            }),
            finalize(() => {
              if (requestId === this.reviewByIdRequestId) {
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
        this._review.set(response.data);
      });

    this.productReviewsRequest$
      .pipe(
        switchMap(({ productId, params }) => {
          const requestId = ++this.productReviewsRequestId;
          this._loading.set(true);
          this._error.set(null);

          return this.http
            .get<Reviews>(this.productReviewsUrl(productId), {
              params: this.buildParams(params),
            })
            .pipe(
              catchError((err) => {
                if (requestId === this.productReviewsRequestId) {
                  this._error.set(
                    err?.message ?? 'Failed to load product reviews',
                  );
                  this._productReviews.set([]);
                  this._productReviewsPagination.set(null);
                }
                return of(null);
              }),
              finalize(() => {
                if (requestId === this.productReviewsRequestId) {
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
        this._productReviews.set(response.data);
        this._productReviewsPagination.set(response.metadata);
      });

    this.createReviewRequest$
      .pipe(
        switchMap(({ productId, payload }) => {
          const requestId = ++this.createReviewRequestId;
          this._mutationLoading.set(true);
          this._mutationError.set(null);

          return this.http
            .post<ReviewMutationResponse>(
              this.productReviewsUrl(productId),
              payload,
              { headers: this.authHeaders() },
            )
            .pipe(
              catchError((err) => {
                if (requestId === this.createReviewRequestId) {
                  this._mutationError.set(
                    err?.message ?? 'Failed to create review',
                  );
                }
                return of(null);
              }),
              finalize(() => {
                if (requestId === this.createReviewRequestId) {
                  this._mutationLoading.set(false);
                }
              }),
            );
        }),
      )
      .subscribe((response) => {
        if (!response?.data) {
          return;
        }
        this._productReviews.update((reviews) => [response.data, ...reviews]);
        this._review.set(response.data);
      });

    this.updateReviewRequest$
      .pipe(
        switchMap(({ reviewId, payload }) => {
          const requestId = ++this.updateReviewRequestId;
          this._mutationLoading.set(true);
          this._mutationError.set(null);

          return this.http
            .put<ReviewMutationResponse>(this.reviewBaseUrl(reviewId), payload, {
              headers: this.authHeaders(),
            })
            .pipe(
              catchError((err) => {
                if (requestId === this.updateReviewRequestId) {
                  this._mutationError.set(
                    err?.message ?? 'Failed to update review',
                  );
                }
                return of(null);
              }),
              finalize(() => {
                if (requestId === this.updateReviewRequestId) {
                  this._mutationLoading.set(false);
                }
              }),
            );
        }),
      )
      .subscribe((response) => {
        if (!response?.data) {
          return;
        }
        this._review.set(response.data);
        this._productReviews.update((reviews) =>
          reviews.map((review) =>
            review._id === response.data._id ? response.data : review,
          ),
        );
        this._reviews.update((reviews) =>
          reviews.map((review) =>
            review._id === response.data._id ? response.data : review,
          ),
        );
      });

    this.deleteReviewRequest$
      .pipe(
        switchMap((reviewId) => {
          const requestId = ++this.deleteReviewRequestId;
          this._mutationLoading.set(true);
          this._mutationError.set(null);

          return this.http
            .delete<ReviewDeleteResponse>(this.reviewBaseUrl(reviewId), {
              headers: this.authHeaders(),
            })
            .pipe(
              catchError((err) => {
                if (requestId === this.deleteReviewRequestId) {
                  this._mutationError.set(
                    err?.message ?? 'Failed to delete review',
                  );
                }
                return of(null);
              }),
              finalize(() => {
                if (requestId === this.deleteReviewRequestId) {
                  this._mutationLoading.set(false);
                }
              }),
              switchMap((response) => (response ? of(reviewId) : of(null))),
            );
        }),
      )
      .subscribe((reviewId) => {
        if (!reviewId) {
          return;
        }
        this._productReviews.update((reviews) =>
          reviews.filter((review) => review._id !== reviewId),
        );
        this._reviews.update((reviews) =>
          reviews.filter((review) => review._id !== reviewId),
        );
        if (this._review()?._id === reviewId) {
          this._review.set(null);
        }
      });
  }

  getReviews(params?: ReviewQueryParams): void {
    this.reviewsRequest$.next(params);
  }

  getReviewById(id: string): void {
    this.reviewByIdRequest$.next(id);
  }

  getProductReviews(productId: string, params?: ReviewQueryParams): void {
    this.productReviewsRequest$.next({ productId, params });
  }

  createProductReview(productId: string, payload: ReviewPayload): void {
    this.createReviewRequest$.next({ productId, payload });
  }

  updateReview(reviewId: string, payload: ReviewPayload): void {
    this.updateReviewRequest$.next({ reviewId, payload });
  }

  deleteReview(reviewId: string): void {
    this.deleteReviewRequest$.next(reviewId);
  }

  private authHeaders(): HttpHeaders {
    if (!isPlatformBrowser(this.platformId)) {
      return new HttpHeaders();
    }

    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({ token });
  }

  private buildParams(params?: ReviewQueryParams): HttpParams {
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
