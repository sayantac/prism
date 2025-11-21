/* eslint-disable @typescript-eslint/no-explicit-any */
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { EmptyState } from "../../components/common/EmptyState";
import { SearchInput } from "../../components/common/SearchInput";
import { ProductCarousel } from "../../components/product/ProductCarousel";
import { ProductGrid } from "../../components/product/ProductGrid";
import { useSearchProductsQuery } from "@/store/api/productApi";
import { useAppSelector } from "@/store/hooks";

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    category: "",
    min_price: "",
    max_price: "",
    sort: "relevance",
  });

  // Get current user from auth state
  const currentUser = useAppSelector((state) => state.auth.user);

  const { data: searchResults, isLoading } = useSearchProductsQuery(
    {
      q: query,
      ...filters,
      min_price: filters.min_price ? Number(filters.min_price) : undefined,
      max_price: filters.max_price ? Number(filters.max_price) : undefined,
      ...(currentUser && { session_id: currentUser.id }), // Only add session_id if user is logged in
      page: currentPage,
      size: 20,
      sort_by: filters.sort || "relevance",
      sort_order: "desc",
      use_vector_search: true,
    },
    {
      skip: !query,
    }
  );

  // Extract sponsored products from search results (backend already includes them)
  const sponsoredProducts = searchResults?.items?.filter((p: any) => p.config?.is_sponsored) || [];

  // Sync query state with URL params
  useEffect(() => {
    const urlQuery = searchParams.get("q") || "";
    setQuery(urlQuery);
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (currentPage > 1) params.set("page", currentPage.toString());
    setSearchParams(params);
  }, [query, currentPage, setSearchParams]);

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    setCurrentPage(1);
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Header */}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-base-content mb-4">
          Search Products
        </h1>
        <div className="max-w-2xl">
          <SearchInput
            key={query} // Re-mount when query changes from URL
            onSearch={handleSearch}
            defaultValue={query}
            placeholder="Search for products, brands, categories..."
            className="w-full"
          />
        </div>
      </div>

      {/* Search Results */}
      {query ? (
        <div>
          <div className="mb-6">
            <p className="text-base-content/70">
              {searchResults
                ? `Found ${searchResults.total || 0} results for "${query}"`
                : `Searching for "${query}"...`}
            </p>
          </div>

          {sponsoredProducts && sponsoredProducts.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Sponsored Products</h2>
              <ProductCarousel products={sponsoredProducts} itemsPerView={6} />
            </div>
          )}

          {searchResults &&
          searchResults.items &&
          searchResults.items.length > 0 ? (
            <ProductGrid
              products={searchResults.items}
              isLoading={isLoading}
              totalPages={searchResults.pages || 1}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              onFiltersChange={handleFiltersChange}
            />
          ) : !isLoading && searchResults ? (
            <EmptyState
              icon={<Search className="w-16 h-16 text-base-content/30" />}
              title="No products found"
              description={`No results found for "${query}". Try different keywords or browse our categories.`}
              action={{
                label: "Browse All Products",
                onClick: () => (window.location.href = "/products"),
              }}
            />
          ) : null}
        </div>
      ) : (
        <EmptyState
          icon={<Search className="w-16 h-16 text-base-content/30" />}
          title="Search our products"
          description="Enter keywords to find the products you're looking for."
        />
      )}
    </div>
  );
};
