export interface PaginationMetadata {
  currentPage: number;
  numberOfPages: number;
  limit: number;
  nextPage?: number;
  prevPage?: number;
}

export interface PaginatedResponse<T> {
  results: number;
  metadata: PaginationMetadata;
  data: T[];
}
