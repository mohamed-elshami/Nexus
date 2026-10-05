import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { API_ENDPOINTS } from '../../../../core/constants/api-endpoints';
import { BreadcrumbItem } from '../../../../shared/components/breadcrumbs/breadcrumb.model';
import { Breadcrumbs } from '../../../../shared/components/breadcrumbs/breadcrumbs';
import { Product, Products } from '../../models/product.model';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-details',
  imports: [Breadcrumbs, RouterLink, DecimalPipe, DatePipe],
  templateUrl: './product-details.html',
})
export class ProductDetails implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly product = this.productService.product;
  readonly loading = this.productService.loading;
  readonly error = this.productService.error;

  readonly id = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: '' },
  );

  readonly selectedImage = signal('');
  readonly quantity = signal(1);
  readonly wishlistActive = signal(false);
  readonly writeReviewOpen = signal(false);
  readonly cartAlertVisible = signal(false);
  readonly relatedProducts = signal<Product[]>([]);
  readonly draftRating = signal(4);
  readonly draftComment = signal('');

  readonly galleryImages = computed(() => {
    const item = this.product();
    if (!item) {
      return [] as string[];
    }
    return [...new Set([item.imageCover, ...(item.images ?? [])].filter(Boolean))];
  });

  readonly activeImage = computed(
    () => this.selectedImage() || this.galleryImages()[0] || '',
  );

  readonly activeImageIndex = computed(() => {
    const images = this.galleryImages();
    const active = this.activeImage();
    const index = images.indexOf(active);
    return index >= 0 ? index : 0;
  });

  readonly breadcrumbItems = computed<BreadcrumbItem[]>(() => {
    const item = this.product();
    const crumbs: BreadcrumbItem[] = [
      { label: 'Home', path: '/' },
      { label: 'Products', path: '/products' },
    ];

    if (item?.category?.name) {
      crumbs.push({ label: item.category.name, path: '/products' });
    }
    if (item?.brand?.name) {
      crumbs.push({ label: item.brand.name });
    }
    if (item?.title) {
      crumbs.push({ label: item.title });
    }

    return crumbs;
  });

  readonly starStates = computed(() => {
    const rating = this.product()?.ratingsAverage ?? 0;
    return [1, 2, 3, 4, 5].map((star) => {
      if (rating >= star) {
        return 'full';
      }
      if (rating >= star - 0.5) {
        return 'half';
      }
      return 'empty';
    });
  });

  readonly stockProgress = computed(() => {
    const item = this.product();
    if (!item) {
      return 0;
    }
    const total = item.sold + item.quantity;
    if (total <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((item.sold / total) * 100));
  });

  readonly lineTotal = computed(() => (this.product()?.price ?? 0) * this.quantity());

  readonly reviews = computed(() => this.product()?.reviews ?? []);

  readonly subcategoryLabel = computed(() =>
    (this.product()?.subcategory ?? []).map((sub) => sub.name).join(', '),
  );

  readonly ratingBreakdown = computed(() => {
    const reviews = this.reviews();
    const total = reviews.length;
    return [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter((review) => Math.round(review.rating) === star).length;
      const percent = total ? Math.round((count / total) * 100) : 0;
      return { star, count, percent };
    });
  });

  readonly draftRatingLabel = computed(() => {
    const labels: Record<number, string> = {
      1: '1 Star (Poor)',
      2: '2 Stars (Fair)',
      3: '3 Stars (Okay)',
      4: '4 Stars (Good)',
      5: '5 Stars (Excellent)',
    };
    return labels[this.draftRating()] ?? 'Select a rating';
  });

  constructor() {
    effect(() => {
      const images = this.galleryImages();
      if (images.length && !images.includes(this.selectedImage())) {
        this.selectedImage.set(images[0]);
      }
    });

    effect(() => {
      const item = this.product();
      if (!item?.category?._id) {
        this.relatedProducts.set([]);
        return;
      }
      this.loadRelated(item.category._id, item._id);
    });
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        return;
      }
      this.quantity.set(1);
      this.selectedImage.set('');
      this.wishlistActive.set(false);
      this.writeReviewOpen.set(false);
      this.cartAlertVisible.set(false);
      this.draftRating.set(4);
      this.draftComment.set('');
      this.productService.getProductById(id);
    });
  }

  selectImage(url: string): void {
    this.selectedImage.set(url);
  }

  prevImage(): void {
    const images = this.galleryImages();
    if (images.length < 2) {
      return;
    }
    const current = this.activeImageIndex();
    const next = current === 0 ? images.length - 1 : current - 1;
    this.selectedImage.set(images[next]);
  }

  nextImage(): void {
    const images = this.galleryImages();
    if (images.length < 2) {
      return;
    }
    const current = this.activeImageIndex();
    const next = current === images.length - 1 ? 0 : current + 1;
    this.selectedImage.set(images[next]);
  }

  decreaseQty(): void {
    this.quantity.update((value) => Math.max(1, value - 1));
  }

  increaseQty(): void {
    const max = this.product()?.quantity ?? 1;
    this.quantity.update((value) => Math.min(max, value + 1));
  }

  onQtyInput(value: string): void {
    const max = this.product()?.quantity ?? 1;
    const next = Number(value);
    if (!Number.isFinite(next)) {
      this.quantity.set(1);
      return;
    }
    this.quantity.set(Math.min(max, Math.max(1, Math.floor(next))));
  }

  toggleWishlist(): void {
    this.wishlistActive.update((active) => !active);
  }

  toggleWriteReview(): void {
    this.writeReviewOpen.update((open) => !open);
  }

  setDraftRating(rating: number): void {
    this.draftRating.set(rating);
  }

  onAddToCart(): void {
    this.cartAlertVisible.set(true);
    window.setTimeout(() => this.cartAlertVisible.set(false), 3200);
  }

  onBuyNow(): void {
    // Checkout not wired yet
  }

  submitReview(): void {
    this.writeReviewOpen.set(false);
    this.draftComment.set('');
    this.draftRating.set(4);
  }

  private loadRelated(categoryId: string, productId: string): void {
    const params = new HttpParams()
      .set('limit', 8)
      .append('category[in]', categoryId);

    this.http
      .get<Products>(`${environment.apiUrl}${API_ENDPOINTS.products.list}`, { params })
      .pipe(catchError(() => of(null)))
      .subscribe((response) => {
        if (!response) {
          this.relatedProducts.set([]);
          return;
        }
        this.relatedProducts.set(
          response.data.filter((item) => item._id !== productId).slice(0, 4),
        );
      });
  }
}
