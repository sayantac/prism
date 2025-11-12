import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  useUpdateCartItemMutation,
  useRemoveFromCartMutation,
} from "../../store/api/cartApi";
import { Button } from "../ui/Button";
import { PriceDisplay } from "../common/PriceDisplay";

interface CartItemData {
  product: {
    id: string;
    name: string;
    images: string[];
    in_stock: boolean;
    price: number;
  };
  quantity: number;
  added_at: string;
}

interface CartItemProps {
  item: CartItemData;
  showProductLink?: boolean;
  className?: string;
}

export const CartItem: React.FC<CartItemProps> = ({
  item,
  showProductLink = true,
  className = "",
}) => {
  const [quantity, setQuantity] = useState(item.quantity);
  const [isUpdating, setIsUpdating] = useState(false);

  const [updateCartItem] = useUpdateCartItemMutation();
  const [removeFromCart] = useRemoveFromCartMutation();

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return;

    setIsUpdating(true);
    setQuantity(newQuantity);

    try {
      await updateCartItem({
        itemId: item.product.id,
        quantity: newQuantity,
      }).unwrap();
    } catch (error) {
      setQuantity(item.quantity); // Revert on error
      toast.error("Failed to update quantity");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    try {
      await removeFromCart(item.product.id).unwrap();
      toast.success("Item removed from cart");
    } catch (error) {
      toast.error("Failed to remove item");
    }
  };

  const productImage = item.product?.images?.[0] || "/api/placeholder/80/80";
  const productName = item.product?.name || "Product";

  return (
    <div
      className={`flex space-x-4 p-4 bg-base-100 rounded-lg border border-base-200 ${className}`}
    >
      {/* Product Image */}
      <div className="flex-shrink-0">
        {showProductLink ? (
          <Link to={`/products/${item.product.id}`}>
            <img
              src={productImage}
              alt={productName}
              className="w-16 h-16 object-cover rounded-lg hover:opacity-80 transition-opacity"
            />
          </Link>
        ) : (
          <img
            src={productImage}
            alt={productName}
            className="w-16 h-16 object-cover rounded-lg"
          />
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            {showProductLink ? (
              <Link
                to={`/products/${item.product.id}`}
                className="font-medium text-base-content hover:text-primary line-clamp-2"
              >
                {productName}
              </Link>
            ) : (
              <h3 className="font-medium text-base-content line-clamp-2">
                {productName}
              </h3>
            )}

            {!item.product?.in_stock && (
              <span className="text-xs text-warning">Out of Stock</span>
            )}
          </div>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            icon={<Trash2 className="w-4 h-4" />}
            className="btn-circle text-error hover:bg-error/10"
          />
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1 || isUpdating}
              icon={<Minus className="w-3 h-3" />}
              className="btn-square btn-xs"
            />

            <span className="text-sm font-medium min-w-[2rem] text-center">
              {quantity}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={isUpdating || !item.product?.in_stock}
              icon={<Plus className="w-3 h-3" />}
              className="btn-square btn-xs"
            />
          </div>

          {/* Total Price */}
          <div className="text-right">
            <PriceDisplay
              price={item.product.price * item.quantity}
              size="sm"
              className="font-semibold"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
