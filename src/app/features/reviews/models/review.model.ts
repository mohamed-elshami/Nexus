import { PaginatedResponse } from '../../../shared/models/pagination.model';

export interface ReviewUser {
  _id: string;
  name: string;
}

export interface Review {
  _id: string;
  review: string;
  rating: number;
  product: string;
  user: ReviewUser;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export type Reviews = PaginatedResponse<Review>;

export interface ReviewResponse {
  data: Review;
}

export interface ReviewPayload {
  review: string;
  rating: number;
}

export interface ReviewMutationResponse {
  message?: string;
  data: Review;
}

export interface ReviewDeleteResponse {
  message: string;
}

export interface ReviewQueryParams {
  page?: number;
  limit?: number;
}
