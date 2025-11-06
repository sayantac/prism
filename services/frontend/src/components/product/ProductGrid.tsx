/* eslint-disable @typescript-eslint/no-explicit-any */
// src/cemnnoopst / product / ProductGrid.tsx;
import { motion } from "framer-motion";
import { useState } from "react";
import { EmptyState } from "../common/EmptyState";
import { LoadingCard } from "../common/LoadingCard";
import { Pagination } from "../common/Pagination";
import { ProductCard } from "./ProductCard";
import { ProductQuickView } from "./ProductQuickView";

interface ProductGridProps {
  products: any[];
  isLoading?: boolean;
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onFiltersChange?: (filters: any) => void;
  className?: string;
  columns?: 1 | 2 | 3 | 4 | 5;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading = false,
  totalPages = 1,
  currentPage = 1,
  onPageChange,
  onFiltersChange,
  className = "",
  columns = 4,
}) => {
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
  };

  if (isLoading) {
    return (
      <div className={`grid ${gridClasses[columns]} gap-6 ${className}`}>
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="bg-base-100 rounded-xl border border-base-content overflow-hidden"
          >
            <div className="aspect-square bg-base-300 animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-base-200 animate-pulse rounded" />
              <div className="h-4 bg-base-200 animate-pulse rounded w-3/4" />
              <div className="h-6 bg-base-200 animate-pulse rounded w-1/2" />
              <div className="h-8 bg-base-200 animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <EmptyState
        title="No products found"
        description="Try adjusting your search or filter criteria"
      />
    );
  }

  return (
    <>
      <div className={`space-y-6 ${className}`}>
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          {/* <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              icon={<SlidersHorizontal className="w-4 h-4" />}
            >
              Filters
            </Button>

            <div className="flex items-center space-x-1">
              <Button
                variant={viewMode === "grid" ? "primary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                icon={<Grid className="w-4 h-4" />}
                className="btn-square"
              />
              <Button
                variant={viewMode === "list" ? "primary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                icon={<List className="w-4 h-4" />}
                className="btn-square"
              />
            </div>
          </div> */}

          <div className="text-sm text-base-content/70">
            {products.length > 0 && `Showing ${products.length} products`}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          {/* {showFilters && (
            <div className="lg:w-64 flex-shrink-0">
              <ProductFilters onFiltersChange={onFiltersChange} />
            </div>
          )} */}

          {/* Products Content */}
          <div className="flex-1">
            {isLoading ? (
              <div
                className={`grid ${gridClasses[columns]} ${
                  viewMode === "grid"
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    : "grid-cols-1"
                }`}
              >
                {Array.from({ length: 8 }).map((_, index) => (
                  <LoadingCard key={index} />
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className={`grid ${gridClasses[columns]} gap-4`}>
                  {products.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <ProductCard
                        key={product.id}
                        product={product}
                        className={viewMode === "list" ? "flex flex-row" : ""}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && onPageChange && (
                  <div className="mt-8">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={onPageChange}
                    />
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                title="No products found"
                description="Try adjusting your search criteria or browse our categories."
                action={{
                  label: "Browse Categories",
                  onClick: () => (window.location.href = "/categories"),
                }}
              />
            )}
          </div>
          {quickViewProduct && (
            <ProductQuickView
              product={quickViewProduct}
              isOpen={!!quickViewProduct}
              onClose={() => setQuickViewProduct(null)}
            />
          )}
        </div>
      </div>
    </>
  );
};
