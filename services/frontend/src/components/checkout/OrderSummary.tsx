import { CreditCard, Package, Tag, Truck } from "lucide-react";
import { PriceDisplay } from "../common/PriceDisplay";
import { resolveProductImage } from "@/utils/media";

interface OrderItem {
  product: {
    id: string;
    name: string;
    images: string[];
    price: number;
  };
  quantity: number;
  added_at: string;
}

interface OrderSummaryProps {
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount?: number;
  total: number;
  promoCode?: string;
  onPromoCodeApply?: (code: string) => void;
  className?: string;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  subtotal,
  shipping,
  tax,
  discount = 0,
  total,
  promoCode,
  onPromoCodeApply,
  className = "",
}) => {
  return (
    <div className={`bg-base-100 rounded-lg p-6 space-y-6 ${className}`}>
      <h3 className="text-lg font-semibold">Order Summary</h3>

      {/* Order Items */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-base-content/70">
          <Package className="w-4 h-4" />
          <span className="text-sm">{items.length} items in your order</span>
        </div>

        {items.map((item) => (
          <div key={item.product.id} className="flex space-x-3">
            <img
              src={resolveProductImage(item.product?.images, "/api/placeholder/60/60")}
              alt={item.product?.name || "Product"}
              className="w-12 h-12 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-2">
                {item.product?.name || "Product"}
              </p>
              <p className="text-xs text-base-content/60">
                Qty: {item.quantity}
              </p>
            </div>
            <div className="text-sm font-medium">
              <PriceDisplay price={item.product.price * item.quantity} />
            </div>
          </div>
        ))}
      </div>

      <div className="divider"></div>

      {/* Promo Code */}
      {onPromoCodeApply && (
        <div>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter promo code"
              className="input input-bordered flex-1"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  onPromoCodeApply((e.target as HTMLInputElement).value);
                }
              }}
            />
            <button
              className="btn btn-outline"
              onClick={() => {
                const input = document.querySelector(
                  'input[placeholder="Enter promo code"]'
                ) as HTMLInputElement;
                if (input?.value) {
                  onPromoCodeApply(input.value);
                }
              }}
            >
              Apply
            </button>
          </div>
          {promoCode && (
            <div className="flex items-center space-x-2 mt-2 text-sm text-success">
              <Tag className="w-4 h-4" />
              <span>Promo code "{promoCode}" applied</span>
            </div>
          )}
        </div>
      )}

      {/* Price Breakdown */}
      <div className="space-y-3">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <PriceDisplay price={subtotal} />
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Truck className="w-4 h-4" />
            <span>Shipping</span>
          </div>
          {shipping === 0 ? (
            <span className="text-success font-medium">Free</span>
          ) : (
            <PriceDisplay price={shipping} />
          )}
        </div>

        <div className="flex justify-between">
          <span>Tax</span>
          <PriceDisplay price={tax} />
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-success">
            <span>Discount</span>
            <span>
              -<PriceDisplay price={discount} />
            </span>
          </div>
        )}

        <div className="divider my-2"></div>

        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <PriceDisplay price={total} size="lg" />
        </div>
      </div>

      {/* Features */}
      <div className="space-y-2 text-sm text-base-content/70">
        <div className="flex items-center space-x-2">
          <Truck className="w-4 h-4" />
          <span>Free shipping on orders over $50</span>
        </div>
        <div className="flex items-center space-x-2">
          <CreditCard className="w-4 h-4" />
          <span>Secure payment processing</span>
        </div>
      </div>
    </div>
  );
};
    