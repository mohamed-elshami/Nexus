import { DecimalPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-list-product-card',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './list-product-card.html',
})
export class ListProductCard {
  readonly product = input.required<Product>();
  readonly wishlistActive = input(false);

  readonly addToCart = output<Product>();
  readonly toggleWishlist = output<Product>();
}
