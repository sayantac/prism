/* eslint-disable @typescript-eslint/no-explicit-any */
// src/cemnnoopst / product / ProductFilters.tsx;
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Filter, X } from "lucide-react";
import { useState } from "react";
import { useGetCategoriesQuery } from "../../store/api/productApi";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

interface FilterState {
  categories: string[];
  priceRange: [number, number];
  brands: string[];
  rating: number;
  inStock: boolean | null;
}

interface ProductFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClear: () => void;
  className?: string;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  onFiltersChange,
  onClear,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: categories } = useGetCategoriesQuery({});

  const updateFilters = (updates: Partial<FilterState>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const newCategories = checked
      ? [...filters.categories, categoryId]
      : filters.categories.filter((id) => id !== categoryId);
    updateFilters({ categories: newCategories });
  };

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.brands.length > 0 ||
    filters.rating > 0 ||
    filters.inStock !== null ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < 10000;

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
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-base-content">
                Filters
              </h3>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClear}
                  icon={<X className="w-4 h-4" />}
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Categories */}
            {categories && categories.length > 0 && (
              <div className="border-b pb-3">
                <h4 className="font-medium text-base-content mb-3">Categories</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {categories.map((category: any) => (
                    <label
                      key={category.id}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(category.id)}
                        onChange={(e) =>
                          handleCategoryChange(category.id, e.target.checked)
                        }
                        className="rounded border-gray-300 text-primary/20 focus:ring-primary"
                      />
                      <span className="text-sm text-base-content">
                        {category.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range */}
            <div>
              <h4 className="font-medium text-base-content mb-3">Price Range</h4>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.priceRange[0] || ""}
                  onChange={(e) =>
                    updateFilters({
                      priceRange: [
                        Number(e.target.value) || 0,
                        filters.priceRange[1],
                      ],
                    })
                  }
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.priceRange[1] || ""}
                  onChange={(e) =>
                    updateFilters({
                      priceRange: [
                        filters.priceRange[0],
                        Number(e.target.value) || 10000,
                      ],
                    })
                  }
                />
              </div>
            </div>

            {/* Availability */}
            <div>
              <h4 className="font-medium text-base-content mb-3">Availability</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="availability"
                    checked={filters.inStock === null}
                    onChange={() => updateFilters({ inStock: null })}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-base-content">All Products</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="availability"
                    checked={filters.inStock === true}
                    onChange={() => updateFilters({ inStock: true })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-base-content">In Stock</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="availability"
                    checked={filters.inStock === false}
                    onChange={() => updateFilters({ inStock: false })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-base-content">Out of Stock</span>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// src/components/product/ProductFilters.tsx
// import { AnimatePresence, motion } from "framer-motion";
// import { ChevronDown, Filter, X } from "lucide-react";
// import { useState } from "react";
// import { useGetCategoriesQuery } from "../../store/api/productApi";
// import { Button } from "../ui/Button";
// import { Input } from "../ui/Input";

// interface FilterState {
//   categories: string[];
//   priceRange: [number, number];
//   brands: string[];
//   rating: number;
//   inStock: boolean | null;
// }

// interface ProductFiltersProps {
//   filters: FilterState;
//   onFiltersChange: (filters: FilterState) => void;
//   onClear: () => void;
//   className?: string;
// }

// export const ProductFilters: React.FC<ProductFiltersProps> = ({
//   filters,
//   onFiltersChange,
//   onClear,
//   className = "",
// }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const { data: categories } = useGetCategoriesQuery({});

//   const updateFilters = (updates: Partial<FilterState>) => {
//     onFiltersChange({ ...filters, ...updates });
//   };

//   const handleCategoryChange = (categoryId: string, checked: boolean) => {
//     const newCategories = checked
//       ? [...filters.categories, categoryId]
//       : filters.categories.filter((id) => id !== categoryId);
//     updateFilters({ categories: newCategories });
//   };

//   const hasActiveFilters =
//     filters.categories.length > 0 ||
//     filters.brands.length > 0 ||
//     filters.rating > 0 ||
//     filters.inStock !== null ||
//     filters.priceRange[0] > 0 ||
//     filters.priceRange[1] < 10000;

//   return (
//     <div className={className}>
//       {/* Mobile Filter Toggle */}
//       <div className="lg:hidden mb-4">
//         <Button
//           variant="outline"
//           onClick={() => setIsOpen(!isOpen)}
//           icon={<Filter className="w-4 h-4" />}
//           className="w-full justify-between"
//         >
//           Filters{" "}
//           {hasActiveFilters &&
//             `(${filters.categories.length + filters.brands.length})`}
//           <ChevronDown
//             className={`w-4 h-4 transform transition-transform ${
//               isOpen ? "rotate-180" : ""
//             }`}
//           />
//         </Button>
//       </div>

//       {/* Filter Panel */}
//       <AnimatePresence>
//         {(isOpen || window.innerWidth >= 1024) && (
//           <motion.div
//             initial={{ height: 0, opacity: 0 }}
//             animate={{ height: "auto", opacity: 1 }}
//             exit={{ height: 0, opacity: 0 }}
//             className="card bg-base-100 shadow-lg border border-base-200 lg:block"
//           >
//             <div className="card-body p-6 space-y-6">
//               {/* Header */}
//               <div className="flex items-center justify-between">
//                 <h3 className="card-title text-base-content">Filters</h3>
//                 {hasActiveFilters && (
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={onClear}
//                     icon={<X className="w-4 h-4" />}
//                   >
//                     Clear
//                   </Button>
//                 )}
//               </div>

//               {/* Categories */}
//               {categories && categories.length > 0 && (
//                 <div className="form-control">
//                   <h4 className="font-medium text-base-content mb-3">Categories</h4>
//                   <div className="space-y-2 max-h-48 overflow-y-auto">
//                     {categories.map((category: any) => (
//                       <label key={category.id} className="label cursor-pointer justify-start gap-2">
//                         <input
//                           type="checkbox"
//                           checked={filters.categories.includes(category.id)}
//                           onChange={(e) =>
//                             handleCategoryChange(category.id, e.target.checked)
//                           }
//                           className="checkbox checkbox-primary checkbox-sm"
//                         />
//                         <span className="label-text text-base-content">
//                           {category.name}
//                         </span>
//                       </label>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* Price Range */}
//               <div className="form-control">
//                 <h4 className="font-medium text-base-content mb-3">Price Range</h4>
//                 <div className="grid grid-cols-2 gap-2">
//                   <Input
//                     type="number"
//                     placeholder="Min"
//                     value={filters.priceRange[0] || ""}
//                     onChange={(e) =>
//                       updateFilters({
//                         priceRange: [
//                           Number(e.target.value) || 0,
//                           filters.priceRange[1],
//                         ],
//                       })
//                     }
//                     inputSize="sm"
//                   />
//                   <Input
//                     type="number"
//                     placeholder="Max"
//                     value={filters.priceRange[1] || ""}
//                     onChange={(e) =>
//                       updateFilters({
//                         priceRange: [
//                           filters.priceRange[0],
//                           Number(e.target.value) || 10000,
//                         ],
//                       })
//                     }
//                     inputSize="sm"
//                   />
//                 </div>
//               </div>

//               {/* Rating Filter */}
//               <div className="form-control">
//                 <h4 className="font-medium text-base-content mb-3">Minimum Rating</h4>
//                 <div className="rating rating-md">
//                   {[1, 2, 3, 4, 5].map((star) => (
//                     <input
//                       key={star}
//                       type="radio"
//                       name="rating"
//                       className="mask mask-star-2 bg-warning"
//                       checked={filters.rating === star}
//                       onChange={() => updateFilters({ rating: star })}
//                     />
//                   ))}
//                 </div>
//                 {filters.rating > 0 && (
//                   <button
//                     onClick={() => updateFilters({ rating: 0 })}
//                     className="btn btn-ghost btn-xs mt-2 text-base-content opacity-70"
//                   >
//                     Clear rating
//                   </button>
//                 )}
//               </div>

//               {/* Availability */}
//               <div className="form-control">
//                 <h4 className="font-medium text-base-content mb-3">Availability</h4>
//                 <div className="space-y-2">
//                   <label className="label cursor-pointer justify-start gap-2">
//                     <input
//                       type="radio"
//                       name="availability"
//                       checked={filters.inStock === null}
//                       onChange={() => updateFilters({ inStock: null })}
//                       className="radio radio-primary radio-sm"
//                     />
//                     <span className="label-text text-base-content">All Products</span>
//                   </label>
//                   <label className="label cursor-pointer justify-start gap-2">
//                     <input
//                       type="radio"
//                       name="availability"
//                       checked={filters.inStock === true}
//                       onChange={() => updateFilters({ inStock: true })}
//                       className="radio radio-primary radio-sm"
//                     />
//                     <span className="label-text text-base-content">In Stock</span>
//                   </label>
//                   <label className="label cursor-pointer justify-start gap-2">
//                     <input
//                       type="radio"
//                       name="availability"
//                       checked={filters.inStock === false}
//                       onChange={() => updateFilters({ inStock: false })}
//                       className="radio radio-primary radio-sm"
//                     />
//                     <span className="label-text text-base-content">Out of Stock</span>
//                   </label>
//                 </div>
//               </div>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// };
