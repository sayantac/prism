/* eslint-disable @typescript-eslint/no-explicit-any */
import { Edit, Eye, Package, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "../../../components/common/EmptyState";
import { Pagination } from "../../../components/common/Pagination";
import { PriceDisplay } from "../../../components/common/PriceDisplay";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Loading } from "../../../components/ui/Loading";
import {
  useCreateProductMutation,
  useGetAdminProductsQuery,
  useUpdateProductMutation,
} from "../../../store/api/adminApi";

export const AdminProducts: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const { data: productsData, isLoading } = useGetAdminProductsQuery({
    page: currentPage,
    page_size: 20,
    search: searchQuery || undefined,
    category: categoryFilter || undefined,
  });
  const {} = useCreateProductMutation();
  const {} = useUpdateProductMutation();
  const products = productsData?.items || [];
  const totalPages = productsData?.pages || 1;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Products</h1>
          <p className="text-base-content/70 mt-1">
            Manage your product catalog
          </p>
        </div>
        <Button variant="primary" icon={<Plus className="w-5 h-5" />}>
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="form-control flex-1">
              <input
                type="text"
                placeholder="Search products..."
                className="input input-bordered"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="form-control">
              <select
                className="select select-bordered"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="home">Home & Garden</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      {products.length > 0 ? (
        <div className="card bg-base-100 shadow-xl">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product: any) => (
                  <tr key={product.id}>
                    <td>
                      <div className="flex items-center space-x-3">
                        <div className="avatar">
                          <div className="mask mask-squircle w-12 h-12">
                            <img
                              src={
                                product.images?.[0] || "/api/placeholder/50/50"
                              }
                              alt={product.name}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="font-bold">{product.name}</div>
                          <div className="text-sm opacity-50">
                            {product.code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <PriceDisplay price={product.price} />
                    </td>
                    <td>{product.stock_quantity || 0} units</td>
                    <td>
                      <Badge variant={product.is_active ? "success" : "error"}>
                        {product.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Eye className="w-4 h-4" />}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Edit className="w-4 h-4" />}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 className="w-4 h-4" />}
                          className="text-error"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<Package className="w-20 h-20 text-base-content/30" />}
          title="No products found"
          description="Start by adding your first product to the catalog."
          action={{
            label: "Add Product",
            onClick: () => console.log("Add product"),
          }}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};
