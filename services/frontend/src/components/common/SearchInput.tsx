// // src/components/common/SearchInput.tsx
// import { Search, X } from "lucide-react";
// import { useEffect, useState } from "react";

// interface SearchInputProps {
//   placeholder?: string;
//   onSearch: (query: string) => void;
//   onClear?: () => void;
//   debounceMs?: number;
//   initialValue?: string;
//   size?: "xs" | "sm" | "md" | "lg";
// }

// export const SearchInput: React.FC<SearchInputProps> = ({
//   placeholder = "Search products...",
//   onSearch,
//   onClear,
//   debounceMs = 300,
//   initialValue = "",
//   size = "md",
// }) => {
//   const [query, setQuery] = useState(initialValue);

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       if (query !== initialValue) {
//         onSearch(query);
//       }
//     }, debounceMs);

//     return () => clearTimeout(timer);
//   }, [query, onSearch, debounceMs, initialValue]);

//   const handleClear = () => {
//     setQuery("");
//     onClear?.();
//   };

//   const sizeClasses = {
//     xs: "input-xs",
//     sm: "input-sm",
//     md: "input-md",
//     lg: "input-lg",
//   };

//   return (
//     <div className="form-control w-full">
//       <div className="relative">
//         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//           <Search className="w-5 h-5 text-base-content/40" />
//         </div>

//         <input
//           type="text"
//           value={query}
//           onChange={(e) => setQuery(e.target.value)}
//           placeholder={placeholder}
//           className={`input input-bordered w-full pl-10 pr-10 bg-base-100 text-base-content placeholder:text-base-content/50 focus:border-primary ${sizeClasses[size]}`}
//         />

//         {query && (
//           <button
//             onClick={handleClear}
//             className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/40 hover:text-base-content/60 transition-colors"
//           >
//             <X className="w-5 h-5" />
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };
import { Search } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface SearchInputProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  defaultValue?: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  placeholder = "Search...",
  defaultValue = "",
  className = "",
}) => {
  const [query, setQuery] = useState(defaultValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        icon={<Search className="w-5 h-5" />}
        className="pr-12"
      />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="absolute right-1 top-1/2 transform -translate-y-1/2 btn-circle"
        icon={<Search className="w-4 h-4" />}
      />
    </form>
  );
};
