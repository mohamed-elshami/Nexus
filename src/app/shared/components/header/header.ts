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
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { CategoryService } from '../../../features/categories/services/category.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
})
export class Header implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  readonly categories = this.categoryService.categories;
  readonly menuOpen = signal(false);
  readonly categoryMenuOpen = signal(false);
  readonly selectedCategoryId = signal<string | null>(null);

  readonly selectedCategoryLabel = computed(() => {
    const id = this.selectedCategoryId();
    if (!id) {
      return 'All Categories';
    }
    return this.categories().find((category) => category._id === id)?.name ?? 'All Categories';
  });

  readonly navLinks = [
    { label: 'Categories', path: '/categories', icon: 'grid_view' },
    { label: 'Products', path: '/products', icon: 'inventory_2' },
    { label: 'Brands', path: '/brands', icon: 'storefront' },
    { label: 'Orders', path: '/orders', icon: 'package_2' },
  ];

  constructor() {
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }
      document.body.style.overflow = this.menuOpen() ? 'hidden' : '';
    });

    this.destroyRef.onDestroy(() => {
      if (isPlatformBrowser(this.platformId)) {
        document.body.style.overflow = '';
      }
    });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.syncSelectedCategoryFromUrl());
  }

  ngOnInit(): void {
    this.categoryService.getCategories({ limit: 40 });
    this.syncSelectedCategoryFromUrl();
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
    this.closeCategoryMenu();
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  toggleCategoryMenu(): void {
    this.categoryMenuOpen.update((open) => !open);
  }

  closeCategoryMenu(): void {
    this.categoryMenuOpen.set(false);
  }

  selectCategory(id: string | null): void {
    this.selectedCategoryId.set(id);
    this.closeCategoryMenu();
    this.closeMenu();
  }

  selectCategoryChip(id: string): void {
    this.selectedCategoryId.set(id);
    this.closeMenu();

    const tree = this.router.parseUrl(this.router.url);
    const isProducts = tree.root.children['primary']?.segments[0]?.path === 'products';
    const currentParams = isProducts ? { ...tree.queryParams } : {};

    void this.router.navigate(['/products'], {
      queryParams: {
        ...currentParams,
        categories: id,
        page: null,
        subcategory: null,
      },
    });
  }

  onCategoryFocusOut(event: FocusEvent): void {
    const container = event.currentTarget as HTMLElement;
    const next = event.relatedTarget as Node | null;
    if (!next || !container.contains(next)) {
      this.closeCategoryMenu();
    }
  }

  private syncSelectedCategoryFromUrl(): void {
    const tree = this.router.parseUrl(this.router.url);
    const isProducts = tree.root.children['primary']?.segments[0]?.path === 'products';
    if (!isProducts) {
      return;
    }

    const categories = tree.queryParams['categories'];
    const first = Array.isArray(categories) ? categories[0] : categories;
    this.selectedCategoryId.set(typeof first === 'string' && first ? first : null);
  }
}
