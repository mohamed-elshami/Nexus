import { Component, computed, input, linkedSignal, output, signal } from '@angular/core';
import { Brand } from '../../../brands/models/brand.model';
import { Category } from '../../../categories/models/category.model';
import { Subcategory } from '../../../subcategories/models/subcategory.model';
import { ProductQueryParams } from '../../models/product.model';

export interface ProductFilterValue {
  priceGte?: number;
  priceLte?: number;
  categories: string[];
  subcategory?: string;
  brands: string[];
  ratingsAverageGte?: number;
}

@Component({
  selector: 'app-product-filters',
  templateUrl: './product-filters.html',
})
export class ProductFilters {
  readonly categories = input<Category[]>([]);
  readonly subcategories = input<Subcategory[]>([]);
  readonly brands = input<Brand[]>([]);
  readonly initialFilters = input<ProductFilterValue>({
    categories: [],
    brands: [],
  });

  readonly apply = output<ProductQueryParams>();
  readonly clear = output<void>();

  readonly priceGte = linkedSignal(() => this.initialFilters().priceGte ?? null);
  readonly priceLte = linkedSignal(() => this.initialFilters().priceLte ?? null);
  readonly selectedCategories = linkedSignal(() => [
    ...this.initialFilters().categories,
  ]);
  readonly selectedSubcategory = linkedSignal(
    () => this.initialFilters().subcategory ?? null,
  );
  readonly selectedBrands = linkedSignal(() => [...this.initialFilters().brands]);
  readonly selectedRatingsAverageGte = linkedSignal(
    () => this.initialFilters().ratingsAverageGte ?? null,
  );
  readonly brandSearch = signal('');

  readonly filteredBrands = computed(() => {
    const query = this.brandSearch().trim().toLowerCase();
    if (!query) {
      return this.brands();
    }
    return this.brands().filter((brand) =>
      brand.name.toLowerCase().includes(query),
    );
  });

  readonly activeCount = computed(() => {
    let count = 0;
    if (this.priceGte() != null || this.priceLte() != null) {
      count += 1;
    }
    count += this.selectedCategories().length;
    if (this.selectedSubcategory()) {
      count += 1;
    }
    count += this.selectedBrands().length;
    if (this.selectedRatingsAverageGte() != null) {
      count += 1;
    }
    return count;
  });

  readonly pricePresets = [
    { label: 'Under 200', gte: undefined, lte: 200 },
    { label: '200 - 500', gte: 200, lte: 500 },
    { label: '500 - 1500', gte: 500, lte: 1500 },
    { label: '1500+', gte: 1500, lte: undefined },
  ] as const;

  readonly ratingOptions = [
    { value: 4, label: '4★ & above', filled: 4 },
    { value: 3, label: '3★ & above', filled: 3 },
    { value: 2, label: '2★ & above', filled: 2 },
    { value: 1, label: '1★ & above', filled: 1 },
  ] as const;

  setPricePreset(gte?: number, lte?: number): void {
    this.priceGte.set(gte ?? null);
    this.priceLte.set(lte ?? null);
  }

  isPricePresetActive(gte?: number, lte?: number): boolean {
    return this.priceGte() === (gte ?? null) && this.priceLte() === (lte ?? null);
  }

  toggleCategory(id: string): void {
    this.selectedCategories.update((list) => this.toggleId(list, id));
  }

  selectSubcategory(id: string): void {
    this.selectedSubcategory.update((current) => (current === id ? null : id));
  }

  toggleBrand(id: string): void {
    this.selectedBrands.update((list) => this.toggleId(list, id));
  }

  selectRating(value: number): void {
    this.selectedRatingsAverageGte.update((current) =>
      current === value ? null : value,
    );
  }

  onApply(): void {
    this.apply.emit({
      priceGte: this.priceGte() ?? undefined,
      priceLte: this.priceLte() ?? undefined,
      categories: [...this.selectedCategories()],
      subcategory: this.selectedSubcategory() ?? undefined,
      brands: [...this.selectedBrands()],
      ratingsAverageGte: this.selectedRatingsAverageGte() ?? undefined,
    });
  }

  onClear(): void {
    this.priceGte.set(null);
    this.priceLte.set(null);
    this.selectedCategories.set([]);
    this.selectedSubcategory.set(null);
    this.selectedBrands.set([]);
    this.selectedRatingsAverageGte.set(null);
    this.brandSearch.set('');
    this.clear.emit();
  }

  private toggleId(list: string[], id: string): string[] {
    return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
  }
}
