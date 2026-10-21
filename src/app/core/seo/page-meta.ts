import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

export interface PageMetaData {
  title: string;
  description: string;
  image?: string;
  type?: 'website' | 'product';
  robots?: string;
}

const DESCRIPTION_LENGTH = 160;

@Injectable({
  providedIn: 'root',
})
export class PageMeta {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.applyFromRoute());
  }

  apply(page: PageMetaData): void {
    const documentTitle = page.title ? `${page.title} | Nexus` : 'Nexus';
    const description = clip(page.description);
    const type = page.type ?? 'website';
    const robots = page.robots ?? 'index,follow';

    this.title.setTitle(documentTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'robots', content: robots });
    this.meta.updateTag({ property: 'og:title', content: documentTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: type });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    this.meta.updateTag({ name: 'twitter:title', content: documentTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });

    const href = this.document.location?.href;
    if (href?.startsWith('http')) {
      this.meta.updateTag({ property: 'og:url', content: href });
    }

    if (page.image) {
      this.meta.updateTag({ property: 'og:image', content: page.image });
    } else {
      this.meta.removeTag('property="og:image"');
    }
  }

  private applyFromRoute(): void {
    let route = this.router.routerState.snapshot.root;
    let page: PageMetaData | undefined;

    while (route) {
      const data = route.data['pageMeta'] as PageMetaData | undefined;
      if (data) {
        page = data;
      }
      route = route.firstChild as typeof route;
    }

    if (page) {
      this.apply(page);
    }
  }
}

function clip(value: string): string {
  const text = value.replace(/\s+/g, ' ').trim();
  if (text.length <= DESCRIPTION_LENGTH) {
    return text;
  }
  return `${text.slice(0, DESCRIPTION_LENGTH - 1).trimEnd()}…`;
}
