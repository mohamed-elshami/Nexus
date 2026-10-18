import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BreadcrumbItem } from '../../../../shared/components/breadcrumbs/breadcrumb.model';
import { Breadcrumbs } from '../../../../shared/components/breadcrumbs/breadcrumbs';
import { Subcategory } from '../../../subcategories/models/subcategory.model';
import { SubcategoryService } from '../../../subcategories/services/subcategory.service';
import { Category } from '../../models/category.model';
import { CategoryService } from '../../services/category.service';

interface Department {
  category: Category;
  subcategories: Subcategory[];
  icon: string;
  letter: string;
  badge: { label: string; icon: string; tone: string };
  footnote: { label: string; value: string };
}

const BADGES: Department['badge'][] = [
  { label: 'Fast Dispatch', icon: 'bolt', tone: 'bg-primary text-on-primary' },
  { label: 'Verified', icon: 'verified', tone: 'bg-tertiary text-on-tertiary' },
  { label: 'In Demand', icon: 'trending_up', tone: 'bg-surface-container-high text-on-surface' },
  { label: 'Designer Edit', icon: 'diamond', tone: 'bg-primary text-on-primary' },
  { label: 'Eco Class', icon: 'energy_savings_leaf', tone: 'bg-secondary text-on-secondary' },
  {
    label: 'Clean Formula',
    icon: 'cruelty_free',
    tone: 'bg-surface-container-high text-on-surface',
  },
];

const FOOTNOTES: Department['footnote'][] = [
  { label: 'Average delivery:', value: 'Tomorrow 10 AM' },
  { label: 'Authenticity:', value: '100% Brand Certified' },
  { label: 'Warranty:', value: '3-Year Nexus Care' },
  { label: 'Standard:', value: '100% Sealed Batch' },
  { label: 'Try at home:', value: 'Free Doorstep Swap' },
  { label: 'Specialty:', value: 'Official Distributors' },
];

@Component({
  selector: 'app-categories',
  imports: [Breadcrumbs, RouterLink],
  templateUrl: './categories.html',
})
export class Categories implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly subcategoryService = inject(SubcategoryService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly categories = this.categoryService.categories;
  readonly subcategories = this.subcategoryService.subcategories;
  readonly loading = this.categoryService.loading;
  readonly error = this.categoryService.error;

  readonly search = signal('');
  readonly letterFilter = signal<string | null>(null);

  readonly breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Home', path: '/' },
    { label: 'Categories' },
  ];

  readonly departments = computed<Department[]>(() =>
    this.categories().map((category, index) => ({
      category,
      subcategories: this.subcategories().filter((item) => item.category === category._id),
      icon: iconFor(category.name),
      letter: category.name.charAt(0).toUpperCase(),
      badge: BADGES[index % BADGES.length],
      footnote: FOOTNOTES[index % FOOTNOTES.length],
    })),
  );

  readonly letters = computed(() =>
    [...new Set(this.departments().map((item) => item.letter))].sort(),
  );

  readonly searchedDepartments = computed(() => {
    const query = this.search().trim().toLowerCase();
    if (!query) {
      return this.departments();
    }

    return this.departments().filter((item) => {
      if (item.category.name.toLowerCase().includes(query)) {
        return true;
      }
      return item.subcategories.some((sub) => sub.name.toLowerCase().includes(query));
    });
  });

  readonly directoryDepartments = computed(() => {
    const letter = this.letterFilter();
    if (!letter) {
      return this.searchedDepartments();
    }
    return this.searchedDepartments().filter((item) => item.letter === letter);
  });

  readonly trendingDepartments = computed(() => this.searchedDepartments().slice(0, 6));

  readonly subcategoryCount = computed(() => this.subcategories().length);

  ngOnInit(): void {
    this.categoryService.getCategories({ limit: 40 });
    this.subcategoryService.getSubcategories({ limit: 40 });
  }

  onSearch(value: string): void {
    this.search.set(value);
  }

  clearSearch(): void {
    this.search.set('');
  }

  setLetter(letter: string | null): void {
    this.letterFilter.set(letter);
  }

  jumpTo(categoryId: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    document.getElementById(`category-${categoryId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  categoryLink(id: string) {
    return ['/products'];
  }

  categoryQuery(id: string) {
    return { categories: id };
  }

  subcategoryQuery(categoryId: string, subcategoryId: string) {
    return { categories: categoryId, subcategory: subcategoryId };
  }
}

function iconFor(name: string): string {
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
