// src/components/product/SponsoredProductCard.tsx
import { Eye, Heart, ShoppingCart, Star, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useAddToCartMutation } from "../../store/api/cartApi";
import { useAddToRecentlyViewedMutation } from "../../store/api/productApi";
import { setQuickViewProduct } from "../../store/slices/uiSlice";
import { PriceDisplay } from "../common/PriceDisplay";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface SponsoredProduct {
  id: string;
  name: string;
  brand: number;
  stock_quantity: number;
  category: string;
  price: string;
  description: string;
  images: string;
  product_url: string;
  is_amazon_seller: string;
  ctr_score: number;
}

interface SponsoredProductCardProps {
  product: SponsoredProduct;
  className?: string;
  showQuickView?: boolean;
}

export const SponsoredProductCard: React.FC<SponsoredProductCardProps> = ({
  product,
  className = "",
  showQuickView = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();

  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();
  const [addToRecentlyViewed] = useAddToRecentlyViewedMutation();

  // Extract first valid image URL (exclude transparent pixel placeholder)
  const getFirstImage = () => {
    const images = product.images.split("|");
    const validImage = images.find((url) => !url.includes("transparent-pixel"));
    return validImage || "/placeholder-product.jpg";
  };

  // Parse price (remove $ sign and convert to number)
  const parsePrice = () => {
    return parseFloat(product.price.replace(/[^0-9.]/g, "")) || 0;
  };

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
    dispatch(
      setQuickViewProduct({
        ...product,
        price: parsePrice(),
        images: [getFirstImage()],
        in_stock: product.stock_quantity > 0,
      })
    );
  };

  return (
    <div
      className={`card bg-base-100  transition-all duration-300 group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        to={product.product_url}
        target="_blank"
        onClick={handleProductView}
      >
        <figure className="px-4 pt-4 relative overflow-hidden">
          {/* Product Image */}
          <div className="relative w-full h-48 bg-base-200 rounded-xl overflow-hidden">
            <img
              src={getFirstImage()}
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
                          <Badge variant="warning" size="sm">
                              <Star className="h-4 w-5"/>
                Sponsored
              </Badge>
              {product.stock_quantity <= 0 && (
                <Badge variant="warning" size="sm">
                  Out of Stock
                </Badge>
              )}
              {product.ctr_score > 0.3 && (
                <Badge variant="accent" size="sm" className="flex items-center">
                  <Zap className="w-3 h-3 mr-1" />
                  Popular
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
          <p className="text-xs text-base-content/60 uppercase tracking-wider">
            Brand {product.brand}
          </p>

          {/* Product Name */}
          <h2 className="card-title text-sm font-medium line-clamp-2 mb-2">
            {product.name}
          </h2>

          {/* Short Description */}
          <p className="text-xs text-base-content/70 line-clamp-2 mb-3">
            {product.description.split("|")[0]}
          </p>

          {/* Price */}
          <div className="mb-3">
            <PriceDisplay price={parsePrice()} size="md" />
          </div>

          {/* Add to Cart Button */}
          <div className="card-actions">
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddToCart}
              disabled={product.stock_quantity <= 0 || isAddingToCart}
              loading={isAddingToCart}
              icon={<ShoppingCart className="w-4 h-4" />}
              className="w-full"
            >
              {product.stock_quantity > 0 ? "Add to Cart" : "Out of Stock"}
            </Button>
          </div>
        </div>
      </Link>
    </div>
  );
};
