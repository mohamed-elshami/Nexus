import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { PaginationMetadata } from '../../models/pagination.model';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.html',
})
export class Pagination {
  readonly metadata = input.required<PaginationMetadata | null>();

  readonly pageChange = output<number>();

  readonly jumpPage = linkedSignal(() => this.metadata()?.currentPage ?? 1);

  readonly pages = computed(() => {
    const meta = this.metadata();
    if (!meta || meta.numberOfPages <= 0) {
      return [] as Array<number | 'ellipsis'>;
    }

    const current = meta.currentPage;
    const total = meta.numberOfPages;

    if (total <= 7) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }

    const items: Array<number | 'ellipsis'> = [1];

    if (current > 3) {
      items.push('ellipsis');
    }

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let page = start; page <= end; page++) {
      items.push(page);
    }

    if (current < total - 2) {
      items.push('ellipsis');
    }

    items.push(total);
    return items;
  });

  readonly canGoPrev = computed(() => {
    const meta = this.metadata();
    return !!meta && (meta.prevPage != null || meta.currentPage > 1);
  });

  readonly canGoNext = computed(() => {
    const meta = this.metadata();
    return !!meta && (meta.nextPage != null || meta.currentPage < meta.numberOfPages);
  });

  goTo(page: number): void {
    const meta = this.metadata();
    if (!meta || page < 1 || page > meta.numberOfPages || page === meta.currentPage) {
      return;
    }
    this.pageChange.emit(page);
  }

  prev(): void {
    const meta = this.metadata();
    if (!meta || !this.canGoPrev()) {
      return;
    }
    this.goTo(meta.prevPage ?? meta.currentPage - 1);
  }

  next(): void {
    const meta = this.metadata();
    if (!meta || !this.canGoNext()) {
      return;
    }
    this.goTo(meta.nextPage ?? meta.currentPage + 1);
  }

  jump(): void {
    this.goTo(this.jumpPage());
  }
}
