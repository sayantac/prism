/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import toast from "react-hot-toast";
import {
  useCreateProductMutation,
  useDeleteProductMutation,
  useGetAdminProductsQuery,
  useUpdateProductMutation,
} from "../../store/api/adminApi";
import { useGetCategoriesQuery } from "../../store/api/productApi";

export const useAdminProducts = () => {
  const [filters, setFilters] = useState({
    page: 1,
    size: 20,
    search: "",
    category: "",
    is_active: undefined as boolean | undefined,
    in_stock: undefined as boolean | undefined,
    sort_by: "created_at",
    sort_order: "desc",
  });

  const {
    data: productsData,
    isLoading,
    error,
    refetch,
  } = useGetAdminProductsQuery(filters);
  const { data: categories } = useGetCategoriesQuery({});

  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

  const products = productsData?.items || [];
  const pagination = {
    total: productsData?.total || 0,
    page: productsData?.page || 1,
    pages: productsData?.pages || 0,
    size: productsData?.size || 20,
  };

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const changePage = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const createNewProduct = async (productData: any) => {
    try {
      await createProduct(productData).unwrap();
      toast.success("Product created successfully");
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to create product");
      throw error;
    }
  };

  const updateExistingProduct = async (id: string, productData: any) => {
    try {
      await updateProduct({ id, ...productData }).unwrap();
      toast.success("Product updated successfully");
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to update product");
      throw error;
    }
  };

  const deleteExistingProduct = async (id: string) => {
    try {
      await deleteProduct(id).unwrap();
      toast.success("Product deleted successfully");
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to delete product");
      throw error;
    }
  };

  const bulkActions = {
    activate: async (productIds: string[]) => {
      // Implement bulk activate
      for (const id of productIds) {
        await updateExistingProduct(id, { is_active: true });
      }
    },
    deactivate: async (productIds: string[]) => {
      // Implement bulk deactivate
      for (const id of productIds) {
        await updateExistingProduct(id, { is_active: false });
      }
    },
    delete: async (productIds: string[]) => {
      // Implement bulk delete
      for (const id of productIds) {
        await deleteExistingProduct(id);
      }
    },
  };

  return {
    products,
    pagination,
    categories: categories || [],
    filters,
    isLoading,
    error,
    isCreating,
    isUpdating,
    isDeleting,
    updateFilters,
    changePage,
    createProduct: createNewProduct,
    updateProduct: updateExistingProduct,
    deleteProduct: deleteExistingProduct,
    bulkActions,
    refetch,
  };
};
