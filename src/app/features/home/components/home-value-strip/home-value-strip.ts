import { Component } from '@angular/core';
import { FadeIn } from '../../../../shared/directives/fade-in';

@Component({
  selector: 'app-home-value-strip',
  templateUrl: './home-value-strip.html',
  hostDirectives: [FadeIn],
  host: {
    class: 'block w-full bg-surface-container-low py-space-sm',
  },
})
export class HomeValueStrip {
  readonly items = [
    {
      icon: 'local_shipping',
      title: 'Free Delivery',
      detail: 'On orders over 500 EGP',
      iconClass: 'bg-primary/10 text-primary',
    },
    {
      icon: 'published_with_changes',
      title: '14-Day Returns',
      detail: 'Hassle-free guarantee',
      iconClass: 'bg-secondary/10 text-secondary',
    },
    {
      icon: 'verified_user',
      title: '100% Genuine',
      detail: 'Direct certified brands',
      iconClass: 'bg-tertiary/10 text-tertiary',
    },
    {
      icon: 'support_agent',
      title: '24/7 Dedicated Care',
      detail: 'Always available',
      iconClass: 'bg-primary-container/15 text-primary',
    },
  ];
}
