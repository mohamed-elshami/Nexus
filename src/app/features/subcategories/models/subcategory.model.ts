import { PaginatedResponse } from '../../../shared/models/pagination.model';

export interface Subcategory {
  _id: string;
  name: string;
  slug: string;
  category: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export type Subcategories = PaginatedResponse<Subcategory>;

export interface SubcategoryResponse {
  data: Subcategory;
}

export interface SubcategoryQueryParams {
  page?: number;
  limit?: number;
}
