import { twMerge } from "tailwind-merge";

interface PriceDisplayProps {
  price: number;
  originalPrice?: number;
  currency?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  originalPrice,
  currency = "$",
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const formatPrice = (amount: number) => {
    return `${currency}${amount?.toFixed(2)}`;
  };

  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <div className={twMerge("flex items-center space-x-2", className)}>
      <span
        className={twMerge("font-semibold text-primary", sizeClasses[size])}
      >
        $ {price?.toFixed(2)}
      </span>
      {originalPrice && originalPrice > price && (
        <>
          <span
            className={twMerge(
              "line-through text-base-content/50",
              sizeClasses[size]
            )}
          >
            {originalPrice}
          </span>
          <span className="badge badge-error badge-sm">-{discount}%</span>
        </>
      )}
    </div>
  );
};
// // src/components/common/PriceDisplay.tsx
// interface PriceDisplayProps {
//   price: number;
//   originalPrice?: number;
//   currency?: string;
//   size?: "xs" | "sm" | "md" | "lg";
//   showDiscount?: boolean;
// }

// export const PriceDisplay: React.FC<PriceDisplayProps> = ({
//   price,
//   originalPrice,
//   currency = "USD",
//   size = "md",
//   showDiscount = true,
// }) => {
//   const formatPrice = (amount: number) => {
//     return new Intl.NumberFormat("en-US", {
//       style: "currency",
//       currency,
//     }).format(amount);
//   };

//   const sizeClasses = {
//     xs: "text-xs",
//     sm: "text-sm",
//     md: "text-base",
//     lg: "text-lg",
//   };

//   const discountPercentage =
//     originalPrice && originalPrice > price
//       ? Math.round(((originalPrice - price) / originalPrice) * 100)
//       : null;

//   return (
//     <div className="flex items-center gap-2 flex-wrap">
//       {/* Current Price */}
//       <span className={`font-bold text-base-content ${sizeClasses[size]}`}>
//         {formatPrice(price)}
//       </span>

//       {/* Original Price */}
//       {originalPrice && originalPrice > price && (
//         <span
//           className={`text-base-content/50 line-through ${
//             size === "lg" ? "text-base" : "text-sm"
//           }`}
//         >
//           {formatPrice(originalPrice)}
//         </span>
//       )}

//       {/* Discount Badge */}
//       {showDiscount && discountPercentage && discountPercentage > 0 && (
//         <div className="badge badge-success badge-sm">
//           -{discountPercentage}%
//         </div>
//       )}
//     </div>
//   );
// };
