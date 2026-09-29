import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface FooterLink {
  label: string;
  path: string;
}

interface FooterLinkSection {
  title: string;
  links: FooterLink[];
}

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.html',
})
export class Footer {
  readonly linkSections: FooterLinkSection[] = [
    {
      title: 'Shopping Categories',
      links: [
        { label: 'Electronics & Audio', path: '/categories' },
        { label: 'Smartphones & Tech', path: '/categories' },
        { label: 'Lifestyle & Fashion', path: '/categories' },
        { label: 'Home Appliances', path: '/categories' },
        { label: 'Books & Culture', path: '/categories' },
      ],
    },
    {
      title: 'Customer Care',
      links: [
        { label: 'Track Your Package', path: '/orders' },
        { label: 'Returns & Refunds', path: '#' },
        { label: 'Shipping Rates & Policies', path: '#' },
        { label: 'Help Center / FAQs', path: '#' },
        { label: 'Contact Support', path: '#' },
      ],
    },
    {
      title: 'Account & Nexus+',
      links: [
        { label: 'My Profile', path: '/profile' },
        { label: 'Delivery Addresses', path: '/addresses' },
        { label: 'Order Archives', path: '/orders' },
        { label: 'Nexus Member Club', path: '#' },
        { label: 'Terms of Service', path: '#' },
      ],
    },
  ];
}
