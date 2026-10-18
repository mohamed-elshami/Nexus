import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BreadcrumbItem } from '../../../../shared/components/breadcrumbs/breadcrumb.model';
import { Breadcrumbs } from '../../../../shared/components/breadcrumbs/breadcrumbs';
import { Brand } from '../../models/brand.model';
import { BrandService } from '../../services/brand.service';

interface Industry {
  id: string;
  label: string;
}

interface BrandCard {
  brand: Brand;
  letter: string;
  industry: Industry;
}

const INDUSTRIES: Industry[] = [
  { id: 'all', label: 'All Brands' },
  { id: 'tech', label: 'Consumer Tech & Audio' },
  { id: 'fashion', label: 'Fashion & Apparel' },
  { id: 'sports', label: 'Sports & Athleisure' },
  { id: 'home', label: 'Home & Smart Living' },
  { id: 'beauty', label: 'Beauty & Wellness' },
  { id: 'lifestyle', label: 'Lifestyle' },
];

const ALPHABET = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];

@Component({
  selector: 'app-brands',
  imports: [Breadcrumbs, RouterLink],
  templateUrl: './brands.html',
})
export class Brands implements OnInit {
  private readonly brandService = inject(BrandService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly brands = this.brandService.brands;
  readonly loading = this.brandService.loading;
  readonly error = this.brandService.error;

  readonly search = signal('');
  readonly industryFilter = signal('all');
  readonly letterFilter = signal<string | null>(null);

  readonly breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Home', path: '/' },
    { label: 'Brands & Official Stores' },
  ];

  readonly alphabet = ALPHABET;
  readonly industries = INDUSTRIES;

  readonly cards = computed<BrandCard[]>(() =>
    this.brands().map((brand) => ({
      brand,
      letter: brand.name.charAt(0).toUpperCase(),
      industry: industryFor(brand.name),
    })),
  );

  readonly lettersWithBrands = computed(() => new Set(this.cards().map((item) => item.letter)));

  readonly filteredCards = computed(() => {
    const query = this.search().trim().toLowerCase();
    const industry = this.industryFilter();

    return this.cards().filter((item) => {
      if (industry !== 'all' && item.industry.id !== industry) {
        return false;
      }
      if (query && !item.brand.name.toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });
  });

  readonly featuredBrands = computed(() => this.filteredCards().slice(0, 6));

  readonly letterGroups = computed(() => {
    const groups = new Map<string, BrandCard[]>();
    for (const item of this.filteredCards()) {
      const list = groups.get(item.letter) ?? [];
      list.push(item);
      groups.set(item.letter, list);
    }
    return [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([letter, items]) => ({
        letter,
        items: items.sort((a, b) => a.brand.name.localeCompare(b.brand.name)),
      }));
  });

  ngOnInit(): void {
    this.brandService.getBrands({ limit: 40 });
  }

  onSearch(value: string): void {
    this.search.set(value);
  }

  clearSearch(): void {
    this.search.set('');
    this.industryFilter.set('all');
    this.letterFilter.set(null);
  }

  setIndustry(id: string): void {
    this.industryFilter.set(id);
  }

  setLetter(letter: string | null): void {
    this.letterFilter.set(letter);
    if (letter) {
      this.jumpTo(`letter-${letter}`);
    } else {
      this.jumpTo('fullDirectory');
    }
  }

  jumpTo(id: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  brandQuery(id: string) {
    return { brands: id };
  }

  industryCount(id: string): number {
    if (id === 'all') {
      return this.cards().length;
    }
    return this.cards().filter((item) => item.industry.id === id).length;
  }
}

function industryFor(name: string): Industry {
  const value = name.toLowerCase();
  if (
    /sony|apple|samsung|dell|lenovo|huawei|xiaomi|oppo|nokia|infinix|realme|honor|canon|philips|toshiba/.test(
      value,
    )
  ) {
    return { id: 'tech', label: 'Consumer Tech' };
  }
  if (/nike|adidas|puma|reebok|skechers/.test(value)) {
    return { id: 'sports', label: 'Sports & Shoes' };
  }
  if (/defacto|jack|waikiki|andora|reserved/.test(value)) {
    return { id: 'fashion', label: 'Fashion & Apparel' };
  }
  if (/beko|kenwood|mienta|fresh|tornado|black/.test(value)) {
    return { id: 'home', label: 'Home & Living' };
  }
  if (/garnier|essence|bourjois|loreal|maybelline|carolina|calvin|kemei|braun/.test(value)) {
    return { id: 'beauty', label: 'Beauty & Wellness' };
  }
  return { id: 'lifestyle', label: 'Lifestyle' };
}
