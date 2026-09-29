import { PaginatedResponse } from '../../../shared/models/pagination.model';

export interface Brand {
  _id: string;
  name: string;
  slug: string;
  image: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export type Brands = PaginatedResponse<Brand>;

export interface BrandResponse {
  data: Brand;
}

export interface BrandQueryParams {
  page?: number;
  limit?: number;
}
