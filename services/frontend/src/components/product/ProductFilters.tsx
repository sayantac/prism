/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, Filter, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useGetCategoriesQuery } from "@/store/api/productApi";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface FilterState {
  categories: string[];
  priceRange: [number, number];
  rating: number;
  inStock: boolean | null;
  brands: string[];
  search_term?: any;
}

interface ProductFiltersProps {
  filters?: FilterState;
  onFiltersChange: (filters: any) => void;
  onClear?: () => void;
  className?: string;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  onFiltersChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: [0, 4200],
    rating: 0,
    inStock: null,
    brands: [],
  });

  const [expandedSections, setExpandedSections] = useState({
    categories: false,
    price: false,
    rating: true,
    availability: false,
    brands: false,
  });

  const { data: categories } = useGetCategoriesQuery();

  useEffect(() => {
    onFiltersChange?.(filters);
  }, [filters, onFiltersChange]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateFilters = (key: keyof FilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      categories: [],
      priceRange: [0, 4200],
      rating: 0,
      inStock: null,
      brands: [],
    });
  };

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < 4200 ||
    filters.rating > 0 ||
    filters.inStock ||
    filters.brands.length > 0;

  return (
    <div className={className}>
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          icon={<Filter className="w-4 h-4" />}
          className="w-full justify-between"
        >
          Filters{" "}
          {hasActiveFilters &&
            `(${filters.categories.length + filters.brands.length})`}
          <ChevronDown
            className={`w-4 h-4 transform transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </Button>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {(isOpen || window.innerWidth >= 1024) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-base-100 border border-base-300 rounded-lg p-6 space-y-6 lg:block"
          >
            {/* Header */}
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Filters</h3>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  icon={<X className="w-4 h-4" />}
                >
                  Clear All
                </Button>
              )}
            </div>

            {/* Categories */}
            <div>
              <button
                onClick={() => toggleSection("categories")}
                className="flex justify-between items-center w-full text-left font-medium mb-3"
              >
                Categories
                {expandedSections.categories ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {expandedSections.categories && (
                <div className="space-y-2">
                  {categories?.map((category: any) => (
                    <label
                      key={category.id}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="category"
                        className="radio radio-sm"
                        checked={filters.categories.includes(category.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateFilters("categories", [category.id]);
                          }
                        }}
                      />
                      <span className="text-sm">{category.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Price Range */}
            <div>
              <button
                onClick={() => toggleSection("price")}
                className="flex justify-between items-center w-full text-left font-medium mb-3"
              >
                Price Range
                {expandedSections.price ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {expandedSections.price && (
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.priceRange[0]}
                      onChange={(e) =>
                        updateFilters("priceRange", [
                          Number(e.target.value),
                          filters.priceRange[1],
                        ])
                      }
                      className="w-full"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.priceRange[1]}
                      onChange={(e) =>
                        updateFilters("priceRange", [
                          filters.priceRange[0],
                          Number(e.target.value),
                        ])
                      }
                      className="w-full"
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="4200"
                    value={filters.priceRange[1]}
                    onChange={(e) =>
                      updateFilters("priceRange", [
                        filters.priceRange[0],
                        Number(e.target.value),
                      ])
                    }
                    className="range range-primary range-sm"
                  />
                </div>
              )}
            </div>

            {/* Availability */}
            <div>
              <button
                onClick={() => toggleSection("availability")}
                className="flex justify-between items-center w-full text-left font-medium mb-3"
              >
                Availability
                {expandedSections.availability ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {expandedSections.availability && (
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={filters.inStock === true}
                      onChange={(e) =>
                        updateFilters("inStock", e.target.checked)
                      }
                    />
                    <span className="text-sm">In Stock Only</span>
                  </label>
                </div>
              )}
            </div>
            {hasActiveFilters && (
              <div>
                <h4 className="font-medium mb-2">Active Filters:</h4>
                <div className="flex flex-wrap gap-2">
                  {filters.categories.map((categoryId) => {
                    const category = categories?.find(
                      (c: any) => c.id === categoryId
                    );
                    return (
                      <Badge
                        key={categoryId}
                        variant="primary"
                        className="cursor-pointer"
                        onClick={() => {
                          const newCategories = filters.categories.filter(
                            (id) => id !== categoryId
                          );
                          updateFilters("categories", newCategories);
                        }}
                      >
                        {category?.name} ×
                      </Badge>
                    );
                  })}

                  {filters.inStock && (
                    <Badge
                      variant="primary"
                      className="cursor-pointer"
                      onClick={() => updateFilters("inStock", false)}
                    >
                      In Stock ×
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
