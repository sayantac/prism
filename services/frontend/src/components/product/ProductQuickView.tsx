/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/product/ProductQuickView.tsx
import { Heart, Minus, Plus, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAddToCartMutation } from "../../store/api/cartApi";
import { PriceDisplay } from "../common/PriceDisplay";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

interface ProductQuickViewProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductQuickView: React.FC<ProductQuickViewProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addToCart, { isLoading }] = useAddToCartMutation();

  const images = product?.images || [product?.image_url].filter(Boolean);

  const handleAddToCart = async () => {
    try {
      await addToCart({
        product_id: product.id,
        quantity,
      }).unwrap();
      onClose();
    } catch (error) {
      console.error("Failed to add to cart:", error);
    }
  };

  if (!product) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" showCloseButton={false}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-base-200 rounded-lg overflow-hidden">
            <img
              src={images[selectedImage] || "/placeholder.jpg"}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto">
              {images.map((image: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                    selectedImage === index
                      ? "border-secondary"
                      : "border-gray-200"
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {product.brand && (
                <p className="text-sm font-medium text-base-content uppercase tracking-wide">
                  {product.brand}
                </p>
              )}
              <h2 className="text-2xl font-bold text-base-content mt-1">
                {product.name}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              icon={<X className="w-5 h-5" />}
            />
          </div>

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-base-content">
                {product.rating} ({product.review_count || 0} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <PriceDisplay
            price={product.price}
            originalPrice={product.original_price}
            currency={product.currency}
            size="lg"
          />

          {/* Description */}
          {product.description && (
            <p className="text-base-content leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Stock Status */}
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                product.in_stock ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span
              className={`text-sm font-medium ${
                product.in_stock ? "text-green-700" : "text-red-700"
              }`}
            >
              {product.in_stock ? "In Stock" : "Out of Stock"}
            </span>
          </div>

          {/* Quantity Selector */}
          {product.in_stock && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-base-content mb-2">
                  Quantity
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 border border-gray-300 rounded-lg hover:text-primary-content hover:bg-primary"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-lg font-medium w-12 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 border border-gray-300 rounded-lg hove:text-primary-content hover:bg-primary"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <Button
                  onClick={handleAddToCart}
                  loading={isLoading}
                  className="flex-1"
                  icon={<ShoppingCart className="w-4 h-4" />}
                >
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  className="bg-secondary/70 hover:bg-secondary text-secondary-content"
                  icon={<Heart className="w-4 h-4" />}
                >
                  Wishlist
                </Button>
              </div>
            </div>
          )}

          {/* View Details Link */}
          <Link
            to={`/products/${product.id}`}
            onClick={onClose}
            className="block text-center text-primary/50 hover:text-primary font-medium"
          >
            View Full Details →
          </Link>
        </div>
      </div>
    </Modal>
  );
};
