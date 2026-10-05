import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Params, Router } from '@angular/router';
import { BreadcrumbItem } from '../../../../shared/components/breadcrumbs/breadcrumb.model';
import { Breadcrumbs } from '../../../../shared/components/breadcrumbs/breadcrumbs';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { BrandService } from '../../../brands/services/brand.service';
import { CategoryService } from '../../../categories/services/category.service';
import { SubcategoryService } from '../../../subcategories/services/subcategory.service';
import { GridProductCard } from '../../components/grid-product-card/grid-product-card';
import { GridProductCardSkeleton } from '../../components/grid-product-card-skeleton/grid-product-card-skeleton';
import { ListProductCard } from '../../components/list-product-card/list-product-card';
import { ListProductCardSkeleton } from '../../components/list-product-card-skeleton/list-product-card-skeleton';
import {
  ProductFilterValue,
  ProductFilters,
} from '../../components/product-filters/product-filters';
import { Product, ProductQueryParams } from '../../models/product.model';
import { ProductService } from '../../services/product.service';

type ViewMode = 'grid' | 'list';

@Component({
  selector: 'app-products',
  imports: [
    Breadcrumbs,
    ProductFilters,
    GridProductCard,
    GridProductCardSkeleton,
    ListProductCard,
    ListProductCardSkeleton,
    Pagination,
  ],
  templateUrl: './products.html',
})
export class Products implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly brandService = inject(BrandService);
  private readonly subcategoryService = inject(SubcategoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  readonly products = this.productService.products;
  readonly pagination = this.productService.pagination;
  readonly results = this.productService.results;
  readonly loading = this.productService.loading;
  readonly error = this.productService.error;

  readonly categories = this.categoryService.categories;
  readonly brands = this.brandService.brands;
  readonly subcategories = this.subcategoryService.subcategories;

  readonly viewMode = signal<ViewMode>('grid');
  readonly filtersOpen = signal(false);
  readonly sortMenuOpen = signal(false);
  readonly limitMenuOpen = signal(false);
  readonly query = signal<ProductQueryParams>({
    page: 1,
    limit: 12,
    sort: '-sold',
  });

  readonly breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Home', path: '/' },
    { label: 'Products', path: '/products' },
  ];

  readonly sortOptions = [
    { label: 'Best Seller', value: '-sold', icon: 'local_fire_department' },
    { label: 'Price: Low to High', value: 'price', icon: 'arrow_upward' },
    { label: 'Price: High to Low', value: '-price', icon: 'arrow_downward' },
    { label: 'Highest Rated', value: '-ratingsAverage', icon: 'star' },
    { label: 'Newest Arrivals', value: '-createdAt', icon: 'schedule' },
  ];

  readonly limitOptions = [12, 24, 36];

  readonly skeletonItems = computed(() => {
    const count = this.query().limit ?? 12;
    return Array.from({ length: count }, (_, index) => index);
  });

  readonly selectedSortLabel = computed(() => {
    const sort = this.query().sort ?? '-sold';
    return (
      this.sortOptions.find((option) => option.value === sort)?.label ?? 'Best Seller'
    );
  });

  readonly initialFilters = computed<ProductFilterValue>(() => {
    const current = this.query();
    return {
      priceGte: current.priceGte,
      priceLte: current.priceLte,
      categories: current.categories ?? [],
      subcategory: current.subcategory,
      brands: current.brands ?? [],
      ratingsAverageGte: current.ratingsAverageGte,
    };
  });

  readonly showingFrom = computed(() => {
    const meta = this.pagination();
    if (!meta || this.products().length === 0) {
      return 0;
    }
    return (meta.currentPage - 1) * meta.limit + 1;
  });

  readonly showingTo = computed(() => {
    const meta = this.pagination();
    if (!meta) {
      return 0;
    }
    return (meta.currentPage - 1) * meta.limit + this.products().length;
  });

  readonly activeFilterChips = computed(() => {
    const current = this.query();
    const chips: { key: string; label: string }[] = [];

    if (current.priceGte != null || current.priceLte != null) {
      const min = current.priceGte ?? 0;
      const max = current.priceLte != null ? `${current.priceLte}` : '∞';
      chips.push({ key: 'price', label: `Price: ${min} – ${max} EGP` });
    }

    current.categories?.forEach((id) => {
      const category = this.categories().find((item) => item._id === id);
      chips.push({
        key: `category:${id}`,
        label: category?.name ?? 'Category',
      });
    });

    if (current.subcategory) {
      const subcategory = this.subcategories().find(
        (item) => item._id === current.subcategory,
      );
      chips.push({
        key: 'subcategory',
        label: subcategory?.name ?? 'Subcategory',
      });
    }

    current.brands?.forEach((id) => {
      const brand = this.brands().find((item) => item._id === id);
      chips.push({
        key: `brand:${id}`,
        label: brand ? `Brand: ${brand.name}` : 'Brand',
      });
    });

    if (current.ratingsAverageGte != null) {
      chips.push({
        key: 'rating',
        label: `${current.ratingsAverageGte}★ & above`,
      });
    }

    return chips;
  });

  constructor() {
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }
      document.body.style.overflow = this.filtersOpen() ? 'hidden' : '';
    });

    this.destroyRef.onDestroy(() => {
      if (isPlatformBrowser(this.platformId)) {
        document.body.style.overflow = '';
      }
    });
  }

  ngOnInit(): void {
    this.categoryService.getCategories({ limit: 40 });
    this.brandService.getBrands({ limit: 40 });
    this.subcategoryService.getSubcategories({ limit: 40 });

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const nextQuery = this.parseQueryParams(params);
        this.query.set(nextQuery);

        const view = params.get('view');
        this.viewMode.set(view === 'list' ? 'list' : 'grid');

        this.productService.getProducts(nextQuery);
      });
  }

  onApplyFilters(filters: ProductQueryParams): void {
    const current = this.query();
    const next: ProductQueryParams = {
      page: 1,
      limit: current.limit,
      sort: current.sort,
    };

    if (filters.priceGte != null) {
      next.priceGte = filters.priceGte;
    }
    if (filters.priceLte != null) {
      next.priceLte = filters.priceLte;
    }
    if (filters.categories?.length) {
      next.categories = filters.categories;
    }
    if (filters.subcategory) {
      next.subcategory = filters.subcategory;
    }
    if (filters.brands?.length) {
      next.brands = filters.brands;
    }
    if (filters.ratingsAverageGte != null) {
      next.ratingsAverageGte = filters.ratingsAverageGte;
    }

    this.filtersOpen.set(false);
    this.syncQueryParams(next);
  }

  onClearFilters(): void {
    const current = this.query();
    this.filtersOpen.set(false);
    this.syncQueryParams({
      page: 1,
      limit: current.limit,
      sort: current.sort,
    });
  }

  removeChip(key: string): void {
    const current = { ...this.query(), page: 1 };

    if (key === 'price') {
      delete current.priceGte;
      delete current.priceLte;
    } else if (key === 'subcategory') {
      delete current.subcategory;
    } else if (key === 'rating') {
      delete current.ratingsAverageGte;
    } else if (key.startsWith('category:')) {
      const id = key.replace('category:', '');
      current.categories = (current.categories ?? []).filter((item) => item !== id);
      if (!current.categories.length) {
        delete current.categories;
      }
    } else if (key.startsWith('brand:')) {
      const id = key.replace('brand:', '');
      current.brands = (current.brands ?? []).filter((item) => item !== id);
      if (!current.brands.length) {
        delete current.brands;
      }
    }

    this.syncQueryParams(current);
  }

  toggleSortMenu(): void {
    this.sortMenuOpen.update((open) => !open);
    this.limitMenuOpen.set(false);
  }

  closeSortMenu(): void {
    this.sortMenuOpen.set(false);
  }

  onSortFocusOut(event: FocusEvent): void {
    const container = event.currentTarget as HTMLElement;
    const next = event.relatedTarget as Node | null;
    if (!next || !container.contains(next)) {
      this.closeSortMenu();
    }
  }

  onSortChange(sort: string): void {
    this.closeSortMenu();
    this.syncQueryParams({ ...this.query(), sort, page: 1 });
  }

  toggleLimitMenu(): void {
    this.limitMenuOpen.update((open) => !open);
    this.sortMenuOpen.set(false);
  }

  closeLimitMenu(): void {
    this.limitMenuOpen.set(false);
  }

  onLimitFocusOut(event: FocusEvent): void {
    const container = event.currentTarget as HTMLElement;
    const next = event.relatedTarget as Node | null;
    if (!next || !container.contains(next)) {
      this.closeLimitMenu();
    }
  }

  onLimitChange(limit: number): void {
    this.closeLimitMenu();
    this.syncQueryParams({ ...this.query(), limit, page: 1 });
  }

  onPageChange(page: number): void {
    this.syncQueryParams({ ...this.query(), page });
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
    this.syncQueryParams(this.query(), mode);
  }

  toggleFilters(): void {
    this.filtersOpen.update((open) => !open);
  }

  closeFilters(): void {
    this.filtersOpen.set(false);
  }

  onAddToCart(_product: Product): void {
    // Cart service not wired yet
  }

  onToggleWishlist(_product: Product): void {
    // Wishlist service not wired yet
  }

  private syncQueryParams(query: ProductQueryParams, view = this.viewMode()): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.toUrlParams(query, view),
    });
  }

  private parseQueryParams(params: ParamMap): ProductQueryParams {
    const page = Number(params.get('page') ?? 1);
    const limit = Number(params.get('limit') ?? 12);
    const sort = params.get('sort') ?? '-sold';
    const priceGte = params.get('priceGte');
    const priceLte = params.get('priceLte');
    const ratingsAverageGte = params.get('ratingsAverageGte');
    const subcategory = params.get('subcategory') || undefined;
    const categories = params.getAll('categories').filter(Boolean);
    const brands = params.getAll('brands').filter(Boolean);

    const query: ProductQueryParams = {
      page: Number.isFinite(page) && page > 0 ? page : 1,
      limit: this.limitOptions.includes(limit) ? limit : 12,
      sort: this.sortOptions.some((option) => option.value === sort) ? sort : '-sold',
    };

    if (priceGte != null && priceGte !== '' && Number.isFinite(Number(priceGte))) {
      query.priceGte = Number(priceGte);
    }
    if (priceLte != null && priceLte !== '' && Number.isFinite(Number(priceLte))) {
      query.priceLte = Number(priceLte);
    }
    if (
      ratingsAverageGte != null &&
      ratingsAverageGte !== '' &&
      Number.isFinite(Number(ratingsAverageGte))
    ) {
      query.ratingsAverageGte = Number(ratingsAverageGte);
    }
    if (subcategory) {
      query.subcategory = subcategory;
    }
    if (categories.length) {
      query.categories = categories;
    }
    if (brands.length) {
      query.brands = brands;
    }

    return query;
  }

  private toUrlParams(query: ProductQueryParams, view: ViewMode): Params {
    return {
      page: query.page && query.page !== 1 ? query.page : null,
      limit: query.limit && query.limit !== 12 ? query.limit : null,
      sort: query.sort && query.sort !== '-sold' ? query.sort : null,
      priceGte: query.priceGte ?? null,
      priceLte: query.priceLte ?? null,
      categories: query.categories?.length ? query.categories : null,
      brands: query.brands?.length ? query.brands : null,
      subcategory: query.subcategory ?? null,
      ratingsAverageGte: query.ratingsAverageGte ?? null,
      view: view !== 'grid' ? view : null,
    };
  }
}
