import { CreditCard, Shield, Truck } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useGetRecommendationsQuery } from "../../store/api/recommendationApi";
import { PriceDisplay } from "../common/PriceDisplay";
import { RecommendationSection } from "../common/RecommendationSection";

interface CartSummaryData {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  total_items: number;
}

interface CartSummaryProps {
  cart: CartSummaryData;
  showShippingInfo?: boolean;
  className?: string;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  cart,
  showShippingInfo = true,
  className = "",
}) => {
  const freeShippingThreshold = 50;
  const remainingForFreeShipping = Math.max(
    0,
    freeShippingThreshold - cart.subtotal
  );

  return (
    <div>
      <div className={`bg-base-100 rounded-lg p-6 space-y-4 ${className}`}>
        <h3 className="text-lg font-semibold">Order Summary</h3>

        {/* Order Details */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Subtotal ({cart.total_items} items)</span>
            <PriceDisplay price={cart.subtotal} />
          </div>

          <div className="flex justify-between">
            <span>Shipping</span>
            {cart.shipping === 0 ? (
              <span className="text-success font-medium">Free</span>
            ) : (
              <PriceDisplay price={cart.shipping} />
            )}
          </div>

          <div className="flex justify-between">
            <span>Tax</span>
            <PriceDisplay price={cart.tax} />
          </div>

          <div className="divider my-2"></div>

          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <PriceDisplay price={cart.total} size="lg" />
          </div>
        </div>

        {/* Free Shipping Progress */}
        {showShippingInfo && remainingForFreeShipping > 0 && (
          <div className="alert alert-info/20">
            <div className="flex-1">
              <p className="text-sm flex gap-2 items-end-safe">
                Add{" "}
                <PriceDisplay
                  price={remainingForFreeShipping}
                  className="font-semibold"
                />{" "}
                more for FREE shipping!
              </p>
              <div className="w-full bg-base-300 rounded-full h-2 mt-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      (cart.subtotal / freeShippingThreshold) * 100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        {showShippingInfo && (
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <Truck className="w-5 h-5 text-primary" />
              <span>Free shipping on orders over $50</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <Shield className="w-5 h-5 text-primary" />
              <span>Secure checkout with SSL encryption</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <CreditCard className="w-5 h-5 text-primary" />
              <span>Cash on Delivery available</span>
            </div>
          </div>
        )}
      </div>

      
    </div>
  );
};
