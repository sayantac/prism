/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/product/ProductCarousel.tsx
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react"; // Assuming icons for navigation
import { useEffect, useRef, useState } from "react";
import { EmptyState } from "../common/EmptyState";
import { ProductQuickView } from "./ProductQuickView";
import { SponsoredProductCard } from "./SponsoredProductCard";

interface ProductCarouselProps {
  products: any[];
  loading?: boolean;
  className?: string;
  itemsPerView?: 1 | 2 | 3 | 4 | 5 | 6; // Similar to columns in ProductGrid
}

export const ProductCarousel: React.FC<ProductCarouselProps> = ({
  products,
  loading = false,
  className = "",
  itemsPerView = 4,
}) => {
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Responsive items per view based on screen size
  const responsiveItems = {
    1: { base: 1, sm: 1, lg: 1, xl: 1, "2xl": 1 },
    2: { base: 1, sm: 2, lg: 2, xl: 2, "2xl": 2 },
    3: { base: 1, sm: 2, lg: 3, xl: 3, "2xl": 3 },
    4: { base: 1, sm: 2, lg: 3, xl: 4, "2xl": 4 },
    5: { base: 1, sm: 2, lg: 3, xl: 4, "2xl": 5 },
    6: { base: 1, sm: 2, lg: 6, xl: 6, "2xl": 6 },
  };

  // Calculate total slides based on itemsPerView and products length
  const getItemsPerView = () => {
    if (window.innerWidth >= 1536) return responsiveItems[itemsPerView]["2xl"];
    if (window.innerWidth >= 1280) return responsiveItems[itemsPerView].xl;
    if (window.innerWidth >= 1024) return responsiveItems[itemsPerView].lg;
    if (window.innerWidth >= 640) return responsiveItems[itemsPerView].sm;
    return responsiveItems[itemsPerView].base;
  };

  const [visibleItems, setVisibleItems] = useState(getItemsPerView());
  const totalSlides = Math.ceil(products.length / visibleItems);

  // Update visible items on window resize
  useEffect(() => {
    const handleResize = () => {
      setVisibleItems(getItemsPerView());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [itemsPerView]);

  // Navigation handlers
  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, totalSlides - 1));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  // Scroll to current index
  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollTo({
        left: currentIndex * carouselRef.current.offsetWidth,
        behavior: "smooth",
      });
    }
  }, [currentIndex]);

  if (loading) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <div
          className="flex gap-6"
          style={{ width: `${100 * Math.ceil(8 / visibleItems)}%` }}
        >
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="flex-none bg-base-100 rounded-xl border border-base-content overflow-hidden"
              style={{ width: `${100 / visibleItems}%` }}
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
      <div className={`relative overflow-hidden ${className}`}>
        {/* Carousel Container */}
        <motion.div
          ref={carouselRef}
          className="flex gap-6 overflow-x-hidden"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              className="flex-none p-2"
              style={{ width: `${100 / visibleItems}%` }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <SponsoredProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>

        {/* Navigation Buttons */}
        {totalSlides > 1 && (
          <>
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-base-100 rounded-full p-2 shadow-md disabled:opacity-50"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === totalSlides - 1}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-base-100 rounded-full p-2 shadow-md disabled:opacity-50"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Pagination Dots */}
        {totalSlides > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            {[...Array(totalSlides)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-3 h-3 rounded-full ${
                  i === currentIndex ? "bg-primary" : "bg-base-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      <AnimatePresence>
        {quickViewProduct && (
          <ProductQuickView
            product={quickViewProduct}
            isOpen={!!quickViewProduct}
            onClose={() => setQuickViewProduct(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
