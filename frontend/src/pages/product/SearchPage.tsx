/* eslint-disable @typescript-eslint/no-explicit-any */
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { EmptyState } from "../../components/common/EmptyState";
import { SearchInput } from "../../components/common/SearchInput";
import { ProductCarousel } from "../../components/product/ProductCarousel";
import { ProductGrid } from "../../components/product/ProductGrid";
import { useSearchProductsQuery } from "../../store/api/productApi";

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
  const [sponseredData, setSponseredData] = useState();

  const { data: searchResults, isLoading } = useSearchProductsQuery(
    {
      q: query,
      ...filters,
      page: currentPage,
      page_size: 20,
    },
    {
      skip: !query,
    }
  );

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (currentPage > 1) params.set("page", currentPage.toString());
    setSearchParams(params);
  }, [query, currentPage, setSearchParams]);

  const handleSearch = (newQuery: string) => {
    handleSponserSearch(newQuery);
    setQuery(newQuery);
    setCurrentPage(1);
  };

  const handleSponserSearch = (newQuery: string) => {
    const myHeaders = new Headers();
    myHeaders.append("accept", "application/json");

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    fetch(
      `http://127.0.0.1:8003/sponsored-search?query=${newQuery}`,
      requestOptions
    )
      .then((response) => response.json())
      .then((result) => setSponseredData(result));
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
                ? `Found  results for "${query}"`
                : `Searching for "${query}"...`}
            </p>
          </div>

          {sponseredData && (sponseredData as any[]).length > 0 && (
            <ProductCarousel products={sponseredData} itemsPerView={6} />
          )}

          {searchResults &&
          searchResults.products &&
          searchResults.products.length > 0 ? (
            <ProductGrid
              products={searchResults.products}
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

// // src/pages/product/SearchPage.tsx - Refactored for new API
// import { Filter, Search } from "lucide-react";
// import { useEffect, useState } from "react";
// import { useSearchParams } from "react-router-dom";
// import { SearchInput } from "../../components/common/SearchInput";
// import { ProductFilters } from "../../components/product/ProductFilters";
// import { ProductGrid } from "../../components/product/ProductGrid";
// import { Button } from "../../components/ui/Button";
// import { Loading } from "../../components/ui/Loading";
// import {
//   useGetSearchSuggestionsQuery,
//   useSearchProductsQuery,
//   useTrackSearchClickMutation,
// } from "../../store/api/productApi";

// interface FilterState {
//   categories: string[];
//   priceRange: [number, number];
//   brands: string[];
//   inStock: boolean | null;
// }

// export const SearchPage: React.FC = () => {
//   const [searchParams, setSearchParams] = useSearchParams();
//   const [query, setQuery] = useState(searchParams.get("q") || "");
//   const [sortBy, setSortBy] = useState<
//     "relevance" | "price_low" | "price_high" | "name" | "newest"
//   >("relevance");
//   const [page, setPage] = useState(1);
//   const [filters, setFilters] = useState<FilterState>({
//     categories: [],
//     priceRange: [0, 10000],
//     brands: [],
//     inStock: null,
//   });
//   const [showFilters, setShowFilters] = useState(false);

//   // Build search query parameters
//   const searchQuery = {
//     q: query,
//     sort_by: sortBy,
//     page,
//     page_size: 20,
//     ...(filters.categories.length > 0 && {
//       category_id: filters.categories[0], // API expects single category_id
//     }),
//     ...(filters.brands.length > 0 && {
//       brand: filters.brands, // API supports array of brands
//     }),
//     ...(filters.priceRange[0] > 0 && { price_min: filters.priceRange[0] }),
//     ...(filters.priceRange[1] < 10000 && { price_max: filters.priceRange[1] }),
//     ...(filters.inStock !== null && { in_stock: filters.inStock }),
//   };

//   const {
//     data: searchResults,
//     isLoading,
//     error,
//   } = useSearchProductsQuery(searchQuery, {
//     skip: !query.trim(),
//   });

//   // Get search suggestions for autocomplete
//   const { data: suggestions } = useGetSearchSuggestionsQuery(
//     { q: query, limit: 5 },
//     { skip: query.length < 2 }
//   );

//   const [trackClick] = useTrackSearchClickMutation();

//   useEffect(() => {
//     const urlQuery = searchParams.get("q");
//     if (urlQuery) {
//       setQuery(urlQuery);
//     }
//   }, [searchParams]);

//   const handleSearch = (newQuery: string) => {
//     setQuery(newQuery);
//     setPage(1); // Reset to first page
//     if (newQuery.trim()) {
//       setSearchParams({ q: newQuery });
//     } else {
//       setSearchParams({});
//     }
//   };

//   const handleFiltersChange = (newFilters: FilterState) => {
//     setFilters(newFilters);
//     setPage(1); // Reset to first page when filters change
//   };

//   const handleSortChange = (newSort: typeof sortBy) => {
//     setSortBy(newSort);
//     setPage(1); // Reset to first page when sort changes
//   };

//   const handleClearFilters = () => {
//     setFilters({
//       categories: [],
//       priceRange: [0, 10000],
//       brands: [],
//       inStock: null,
//     });
//     setPage(1);
//   };

//   const handleProductClick = async (productId: string, position: number) => {
//     if (searchResults?.products) {
//       // Track the search click for analytics
//       try {
//         await trackClick({
//           search_id: `search_${Date.now()}`, // You might want to implement proper search session tracking
//           product_id: productId,
//           position,
//         });
//       } catch (error) {
//         console.error("Failed to track search click:", error);
//       }
//     }
//   };

//   const loadMore = () => {
//     if (searchResults && page < searchResults.total_pages) {
//       setPage(page + 1);
//     }
//   };

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <div className="max-w-7xl mx-auto">
//         {/* Search Header */}
//         <div className="mb-8">
//           <div className="flex items-center space-x-4 mb-4">
//             <div className="flex-1">
//               <SearchInput
//                 onSearch={handleSearch}
//                 placeholder="Search products..."
//                 defaultValue={query}
//                 suggestions={suggestions?.suggestions}
//               />
//             </div>
//             <Button
//               variant="outline"
//               onClick={() => setShowFilters(!showFilters)}
//               icon={<Filter className="w-4 h-4" />}
//               className="lg:hidden"
//             >
//               Filters
//             </Button>
//           </div>

//           {/* Search Results Info */}
//           {query && searchResults && (
//             <div className="flex items-center justify-between">
//               <div>
//                 <h1 className="text-2xl font-bold text-gray-900">
//                   Search Results for "{query}"
//                 </h1>
//                 <p className="text-gray-600 mt-1">
//                   {searchResults.total_count} results found
//                   {searchResults.response_time_ms && (
//                     <span className="text-sm">
//                       {" "}
//                       in {searchResults.response_time_ms}ms
//                     </span>
//                   )}
//                 </p>
//               </div>

//               {/* Sort Options */}
//               <div className="flex items-center space-x-2">
//                 <span className="text-sm text-gray-600">Sort by:</span>
//                 <select
//                   value={sortBy}
//                   onChange={(e) =>
//                     handleSortChange(e.target.value as typeof sortBy)
//                   }
//                   className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 >
//                   <option value="relevance">Relevance</option>
//                   <option value="price_low">Price: Low to High</option>
//                   <option value="price_high">Price: High to Low</option>
//                   <option value="name">Name</option>
//                   <option value="newest">Newest</option>
//                 </select>
//               </div>
//             </div>
//           )}

//           {/* Search Suggestions */}
//           {searchResults?.search_suggestions &&
//             searchResults.search_suggestions.length > 0 && (
//               <div className="mt-4">
//                 <p className="text-sm text-gray-600 mb-2">Related searches:</p>
//                 <div className="flex flex-wrap gap-2">
//                   {searchResults.search_suggestions.map((suggestion) => (
//                     <button
//                       key={suggestion}
//                       onClick={() => handleSearch(suggestion)}
//                       className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
//                     >
//                       {suggestion}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             )}
//         </div>

//         {/* No Query State */}
//         {!query.trim() && (
//           <div className="text-center py-16">
//             <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
//             <h2 className="text-xl font-semibold text-gray-900 mb-2">
//               Start your search
//             </h2>
//             <p className="text-gray-600">
//               Enter a search term to find products you're looking for.
//             </p>
//           </div>
//         )}

//         {/* Search Results */}
//         {query.trim() && (
//           <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
//             {/* Filters Sidebar */}
//             <div
//               className={`lg:col-span-1 ${
//                 showFilters ? "block" : "hidden lg:block"
//               }`}
//             >
//               <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
//                 <div className="flex items-center justify-between mb-6">
//                   <h3 className="text-lg font-semibold text-gray-900">
//                     Filters
//                   </h3>
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={handleClearFilters}
//                     className="text-blue-600 hover:text-blue-700"
//                   >
//                     Clear All
//                   </Button>
//                 </div>

//                 <ProductFilters
//                   filters={filters}
//                   onFiltersChange={handleFiltersChange}
//                 />
//               </div>
//             </div>

//             {/* Results */}
//             <div className="lg:col-span-3">
//               {isLoading && page === 1 ? (
//                 <Loading />
//               ) : error ? (
//                 <div className="text-center py-16">
//                   <div className="text-red-600 mb-4">
//                     <Search className="w-16 h-16 mx-auto" />
//                   </div>
//                   <h2 className="text-xl font-semibold text-gray-900 mb-2">
//                     Search Error
//                   </h2>
//                   <p className="text-gray-600">
//                     Something went wrong while searching. Please try again.
//                   </p>
//                 </div>
//               ) : searchResults?.products.length === 0 ? (
//                 <div className="text-center py-16">
//                   <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
//                   <h2 className="text-xl font-semibold text-gray-900 mb-2">
//                     No results found
//                   </h2>
//                   <p className="text-gray-600 mb-4">
//                     Try adjusting your search terms or filters to find what
//                     you're looking for.
//                   </p>
//                   <Button onClick={handleClearFilters} variant="outline">
//                     Clear Filters
//                   </Button>
//                 </div>
//               ) : (
//                 <>
//                   <ProductGrid
//                     products={
//                       searchResults?.products.map((product) => ({
//                         ...product,
//                         // Map search result fields to Product interface
//                         code: product.id, // Fallback if code not provided
//                         brand: "", // Fallback if brand not provided
//                         category_id: "",
//                         compare_price: 0,
//                         description: "",
//                         images: [],
//                         is_active: true,
//                         in_stock: true,
//                         stock_quantity: 0,
//                         created_at: "",
//                       })) || []
//                     }
//                     onProductClick={handleProductClick}
//                   />

//                   {/* Load More Button */}
//                   {searchResults && page < searchResults.total_pages && (
//                     <div className="text-center mt-8">
//                       <Button
//                         onClick={loadMore}
//                         variant="outline"
//                         disabled={isLoading}
//                       >
//                         {isLoading ? "Loading..." : "Load More"}
//                       </Button>
//                     </div>
//                   )}

//                   {/* Pagination Info */}
//                   {searchResults && (
//                     <div className="text-center mt-4 text-sm text-gray-600">
//                       Showing {(page - 1) * 20 + 1} to{" "}
//                       {Math.min(page * 20, searchResults.total_count)} of{" "}
//                       {searchResults.total_count} results
//                     </div>
//                   )}
//                 </>
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };
