import { isPlatformBrowser } from '@angular/common';
import { afterNextRender, DestroyRef, Directive, ElementRef, inject, PLATFORM_ID, signal } from '@angular/core';

@Directive({
  selector: '[appFadeIn]',
  host: {
    class: 'fade-in-section',
    '[class.is-inview]': 'visible()',
  },
})
export class FadeIn {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  readonly visible = signal(false);

  constructor() {
    let observer: IntersectionObserver | null = null;
    this.destroyRef.onDestroy(() => observer?.disconnect());

    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.visible.set(true);
        return;
      }

      observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) {
            return;
          }
          this.visible.set(true);
          observer?.disconnect();
        },
        { threshold: 0.15 },
      );
      observer.observe(this.elementRef.nativeElement);
    });
  }
}
