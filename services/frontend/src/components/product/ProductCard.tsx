// src/components/product/ProductCard.tsx
import { Eye, Heart, ShoppingCart, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks";
import { useAddToCartMutation } from "../../store/api/cartApi";
import { useAddToRecentlyViewedMutation } from "../../store/api/productApi";
import { setQuickViewProduct } from "../../store/slices/uiSlice";
import { PriceDisplay } from "../common/PriceDisplay";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { resolveProductImage } from "@/utils/media";

interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  images: string[];
  rating?: number;
  reviews_count?: number;
  in_stock: boolean;
  brand?: string;
  category?: string;
  discount_percentage?: number;
}

interface Recommendation {
  score: number;
  algorithm: string;
  explanation: string;
}

interface ProductCardProps {
  product: Product;
  recommendation?: Recommendation;
  className?: string;
  showQuickView?: boolean;
}
export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  recommendation,
  className = "",
  showQuickView = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();

  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();
  const [addToRecentlyViewed] = useAddToRecentlyViewedMutation();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Please login to add items to cart");
      return;
    }

    try {
      await addToCart({ product_id: product.id, quantity: 1 }).unwrap();
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      toast.error("Failed to add item to cart");
      console.error("Error adding to cart:", error);
    }
  };

  const handleProductView = () => {
    if (isAuthenticated) {
      addToRecentlyViewed(product.id);
    }
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(setQuickViewProduct(product));
  };

  return (
    <div
      className={`card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/products/${product.id}`} onClick={handleProductView}>
        <figure className="px-4 pt-4 relative overflow-hidden">
          {/* Product Image */}
          <div className="relative w-full h-48 bg-base-200 rounded-xl overflow-hidden">
            <img
                src={resolveProductImage(product.images)}
              alt={product.name}
              className={`w-full h-full object-cover transition-all duration-300 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              } group-hover:scale-105`}
              onLoad={() => setImageLoaded(true)}
            />

            {/* Loading placeholder */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="loading loading-spinner loading-md"></div>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col space-y-1">
              {product.discount_percentage && (
                <Badge variant="error" size="sm">
                  -{product.discount_percentage}%
                </Badge>
              )}
              {!product.in_stock && (
                <Badge variant="warning" size="sm">
                  Out of Stock
                </Badge>
              )}
              {recommendation && recommendation.score > 0.5 && (
                <Badge variant="accent" size="sm" className="flex items-center">
                  <Zap className="w-3 h-3 mr-1" />
                  AI Pick
                </Badge>
              )}
            </div>

            {/* Hover Actions */}
            {isHovered && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center space-x-2 transition-opacity duration-300">
                {showQuickView && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleQuickView}
                    className="btn-circle bg-base-100/90 hover:bg-base-100"
                    icon={<Eye className="w-4 h-4" />}
                  />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="btn-circle bg-base-100/90 hover:bg-base-100"
                  icon={<Heart className="w-4 h-4" />}
                />
              </div>
            )}
          </div>
        </figure>

        <div className="card-body px-4 pb-4">
          {/* Brand */}
          {product.brand && (
            <p className="text-xs text-base-content/60 uppercase tracking-wider">
              {product.brand}
            </p>
          )}

          {/* Product Name */}
          <h2 className="card-title text-sm font-medium line-clamp-2 mb-2">
            {product.name}
          </h2>

          {/* AI Recommendation */}
          {recommendation && (
            <div className="mb-2">
              <p className="text-xs text-accent font-medium">
                {recommendation.explanation}
              </p>
              <div className="flex items-center space-x-1 mt-1">
                <span className="text-xs text-base-content/60 capitalize">
                  {recommendation.algorithm
                    ?.replace("_", " ")
                    .toLocaleLowerCase()
                    .replace("vector", "")
                    .replace("fbt", "Frequently Bought toygether")}
                </span>
                {recommendation.score > 0.5 && (
                  <span className="text-xs text-accent">
                    {Math.round(recommendation.score * 100)}% match
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Price */}
          <div className="mb-3">
            <PriceDisplay
              price={product.price}
              originalPrice={product.original_price}
              size="md"
            />
          </div>

          {/* Add to Cart Button */}
          <div className="card-actions">
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddToCart}
              disabled={!product.in_stock || isAddingToCart}
              loading={isAddingToCart}
              icon={<ShoppingCart className="w-4 h-4" />}
              className="w-full"
            >
              {product.in_stock ? "Add to Cart" : "Out of Stock"}
            </Button>
          </div>
        </div>
      </Link>
    </div>
  );
};
