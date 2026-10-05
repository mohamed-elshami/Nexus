import { Brand } from '../../brands/models/brand.model';
import { Category } from '../../categories/models/category.model';
import { Review } from '../../reviews/models/review.model';
import { PaginatedResponse } from '../../../shared/models/pagination.model';
import { Subcategory } from '../../subcategories/models/subcategory.model';

export interface Product {
  sold: number;
  images: string[];
  subcategory: Subcategory[];
  ratingsQuantity: number;
  _id: string;
  title: string;
  slug: string;
  description: string;
  quantity: number;
  price: number;
  imageCover: string;
  category: Category;
  brand: Brand;
  ratingsAverage: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
  reviews: Review[];
  id: string;
}

export type Products = PaginatedResponse<Product>;

export interface ProductResponse {
  data: Product;
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  priceGte?: number;
  priceLte?: number;
  brands?: string[];
  categories?: string[];
  subcategory?: string;
  ratingsAverageGte?: number;
  sort?: string;
}
