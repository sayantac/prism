/* eslint-disable @typescript-eslint/no-explicit-any */
import { Filter, RotateCcw, Search } from "lucide-react";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";

interface ProductFiltersProps {
  filters: {
    search: string;
    category: string;
    is_active?: boolean;
    in_stock?: boolean;
    sort_by: string;
    sort_order: string;
  };
  categories: Array<{ id: string; name: string }>;
  onFiltersChange: (filters: any) => void;
  onReset: () => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  categories,
  onFiltersChange,
  onReset,
}) => {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex items-center justify-between mb-4">
          <h3 className="card-title">
            <Filter className="w-5 h-5" />
            Filters
          </h3>
          <Button variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Search</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50" />
              <Input
                value={filters.search}
                onChange={(e) => onFiltersChange({ search: e.target.value })}
                placeholder="Search products..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Category */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Category</span>
            </label>
            <select
              value={filters.category}
              onChange={(e) => onFiltersChange({ category: e.target.value })}
              className="select select-bordered"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Status</span>
            </label>
            <select
              value={
                filters.is_active === undefined
                  ? ""
                  : filters.is_active.toString()
              }
              onChange={(e) =>
                onFiltersChange({
                  is_active:
                    e.target.value === ""
                      ? undefined
                      : e.target.value === "true",
                })
              }
              className="select select-bordered"
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          {/* Stock */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Stock</span>
            </label>
            <select
              value={
                filters.in_stock === undefined
                  ? ""
                  : filters.in_stock.toString()
              }
              onChange={(e) =>
                onFiltersChange({
                  in_stock:
                    e.target.value === ""
                      ? undefined
                      : e.target.value === "true",
                })
              }
              className="select select-bordered"
            >
              <option value="">All</option>
              <option value="true">In Stock</option>
              <option value="false">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Sort Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Sort By</span>
            </label>
            <select
              value={filters.sort_by}
              onChange={(e) => onFiltersChange({ sort_by: e.target.value })}
              className="select select-bordered"
            >
              <option value="created_at">Created Date</option>
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="stock_quantity">Stock</option>
              <option value="updated_at">Last Updated</option>
            </select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Sort Order</span>
            </label>
            <select
              value={filters.sort_order}
              onChange={(e) => onFiltersChange({ sort_order: e.target.value })}
              className="select select-bordered"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
