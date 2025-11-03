/* eslint-disable @typescript-eslint/no-explicit-any */
// src/hooks/useProducts.ts
import { useMemo, useState } from "react";
import {
  useGetCategoriesQuery,
  useGetProductsQuery,
} from "../store/api/productApi";
import { useGetTrendingProductsQuery } from "../store/api/recommendationApi";
interface UseProductsOptions {
  category?: string;
  search?: string;
  sort?: string;
  filters?: Record<string, any>;
  page?: number;
  size?: number;
}

export const useProducts = (options: UseProductsOptions = {}) => {
  const [localFilters, setLocalFilters] = useState(options.filters || {});

  const queryParams = useMemo(
    () => ({
      page: options.page || 1,
      size: options.size || 20,
      ...(options.category && { category: options.category }),
      ...(options.sort && { sort_by: options.sort }),
      ...localFilters,
    }),
    [options, localFilters]
  );

  const {
    data: productsData,
    isLoading,
    error,
    isFetching,
  } = useGetProductsQuery(queryParams);

  const { data: categories } = useGetCategoriesQuery({});
  const { data: trendingProducts } = useGetTrendingProductsQuery({ limit: 8 });

  const products = productsData?.items || [];
  const pagination = {
    total: productsData?.total || 0,
    page: productsData?.page || 1,
    pages: productsData?.pages || 0,
    size: productsData?.size || 20,
  };

  const updateFilters = (newFilters: Record<string, any>) => {
    setLocalFilters(newFilters);
  };

  const clearFilters = () => {
    setLocalFilters({});
  };

  return {
    products,
    pagination,
    categories: categories || [],
    trendingProducts: trendingProducts || [],
    isLoading,
    isFetching,
    error,
    filters: localFilters,
    updateFilters,
    clearFilters,
  };
};
