/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/pages/product/ProductsPage.tsx
import { Grid, List } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SearchInput } from "../../components/common/SearchInput";
import { ProductFilters } from "../../components/product/ProductFilters";
import { ProductGrid } from "../../components/product/ProductGrid";
import { Button } from "../../components/ui/Button";
import { useGetProductsQuery } from "../../store/api/productApi";

interface FilterState {
  search_term: any;
  categories: string[];
  priceRange: [number, number];
  brands: string[];
  rating: number;
  inStock: boolean | null;
}

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: [0, 4200],
    brands: [],
    rating: 0,
    inStock: null,
    search_term: null,
  });

  // Build query parameters
  const queryParams = {
    page,
    size: 20,
    sort_by: sortBy,
    sort_order: sortOrder,
    ...(filters.categories.length > 0 && {
      category: filters.categories[0],
    }),
    ...(filters.priceRange[0] > 0 && { min_price: filters.priceRange[0] }),
    ...(filters.priceRange[1] < 4200 && { max_price: filters.priceRange[1] }),
    ...(filters.brands.length > 0 && { brand: filters.brands.join(",") }),
    ...(filters.rating > 0 && { min_rating: filters.rating }),
    ...(filters.inStock !== null && { in_stock: filters.inStock }),
    ...(filters.search_term !== null && { search_term: filters.search_term }),
  };

  const {
    data: productsData,
    isLoading,
  } = useGetProductsQuery(queryParams);
  console.log(productsData);
  // Handle URL search params
  useEffect(() => {
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    if (category || search?.trim()) {
      setFilters((prev) => ({
        ...prev,
        categories: category ? [category] : [],
        search_term: search || null,
      }));
    }
  }, [searchParams]);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      setSearchParams({ search: query });
    } else {
      setSearchParams({});
    }
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      categories: [],
      priceRange: [0, 4200],
      brands: [],
      rating: 0,
      inStock: null,
      search_term: null,
    });
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split(":");
    setSortBy(newSortBy);
    setSortOrder(newSortOrder as "asc" | "desc");
    setPage(1);
  };

  const sortOptions = [
    { value: "created_at:desc", label: "Newest First" },
    { value: "created_at:asc", label: "Oldest First" },
    { value: "price:asc", label: "Price: Low to High" },
    { value: "price:desc", label: "Price: High to Low" },
    { value: "name:asc", label: "Name: A-Z" },
    { value: "name:desc", label: "Name: Z-A" },
    { value: "rating:desc", label: "Highest Rated" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="lg:w-1/5">
          <div className="sticky top-24">
            <ProductFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClear={handleClearFilters}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:w-4/4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-base-content mb-2">
                Products
              </h1>
              <p className="text-base-content">
                {productsData?.total || 0} products found
              </p>
            </div>

            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <select
                value={`${sortBy}:${sortOrder}`}
                onChange={(e) => handleSortChange(e.target.value)}
                className="border border-base-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* View Mode Toggle */}
              <div className="flex border border-base-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${
                    viewMode === "grid"
                      ? "bg-primary text-primary-content"
                      : "text-base-content hover:bg-primary"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${
                    viewMode === "list"
                      ? "bg-primary text-primary-content"
                      : "text-base-content hover:bg-primary"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <SearchInput
              placeholder="Search products..."
              onSearch={handleSearch}
              defaultValue={searchParams.get("search") || ""}
            />
          </div>

          {/* Products Grid */}
          <ProductGrid
            products={productsData?.items || []}
            isLoading={isLoading}
            columns={viewMode === "grid" ? 4 : 2}
          />

          {/* Load More Button */}
          {productsData && productsData.pages > page && (
            <div className="text-center mt-8">
              <Button
                onClick={() => setPage(page + 1)}
                variant="outline"
                size="lg"
              >
                Load More Products
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
