import { PaginatedResponse } from '../../../shared/models/pagination.model';
import { Subcategories } from '../../subcategories/models/subcategory.model';

export interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export type Categories = PaginatedResponse<Category>;

export interface CategoryResponse {
  data: Category;
}

export interface CategoryQueryParams {
  page?: number;
  limit?: number;
}

export type CategorySubcategories = Subcategories;
