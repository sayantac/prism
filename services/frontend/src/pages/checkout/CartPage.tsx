/* eslint-disable @typescript-eslint/no-explicit-any */
import { ArrowLeft, ArrowRight, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { CartItem } from "../../components/cart/CartItem";
import { CartSummary } from "../../components/cart/CartSummary";
import { EmptyState } from "../../components/common/EmptyState";
import { RecommendationSection } from "../../components/common/RecommendationSection";
import { Button } from "../../components/ui/Button";
import { Loading } from "../../components/ui/Loading";
import { useAuth } from "@/hooks";
import { useClearCartMutation, useGetCartQuery } from "../../store/api/cartApi";
import {
  useGetRecommendationsQuery,
} from "../../store/api/recommendationApi";

export const CartPage: React.FC = () => {
  const { data: cart, isLoading } = useGetCartQuery({});

  const { user, isAuthenticated } = useAuth();
  const { data: cartRecommendations } = useGetRecommendationsQuery(user?.id ?? "", {
    skip: !isAuthenticated || !user?.id,
  });

  const { data: recommendations, isLoading: recommendationsLoading } =
    useGetRecommendationsQuery(user?.id ?? "", {
      skip: !isAuthenticated || !user?.id,
    });

  const [clearCart, { isLoading: isClearing }] = useClearCartMutation();

  const handleClearCart = async () => {
    if (window.confirm("Are you sure you want to clear your cart?")) {
      try {
        await clearCart({}).unwrap();
      } catch (error) {
        console.error("Failed to clear cart:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <Loading size="lg" />
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          icon={<ShoppingBag className="w-20 h-20 text-base-content/30" />}
          title="Your cart is empty"
          description="Looks like you haven't added any items to your cart yet. Start shopping to fill it up!"
          action={{
            label: "Continue Shopping",
            onClick: () => (window.location.href = "/products"),
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-base-content">
              Shopping Cart
            </h1>
            <p className="text-base-content/70 mt-1">
              {cart.total_items} {cart.total_items === 1 ? "item" : "items"} in
              your cart
            </p>
          </div>

          <div className="flex space-x-4">
            <Link to="/products">
              <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />}>
                Continue Shopping
              </Button>
            </Link>

            {cart.items.length > 0 && (
              <Button
                variant="outline"
                onClick={handleClearCart}
                loading={isClearing}
              >
                Clear Cart
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item: any) => (
              <CartItem key={item.product.id} item={item} />
            ))}
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <CartSummary
                cart={{
                  subtotal: cart.total_amount,
                  shipping: cart.total_amount > 50 ? 0 : 9.99,
                  tax: cart.total_amount * 0.08,
                  total:
                    cart.total_amount +
                    (cart.total_amount > 50 ? 0 : 9.99) +
                    cart.total_amount * 0.08,
                  total_items: cart.total_items,
                }}
              />

              <div className="mt-6 space-y-3">
                <Link to="/checkout" className="block">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    icon={<ArrowRight className="w-5 h-5" />}
                    iconPosition="right"
                  >
                    Proceed to Checkout
                  </Button>
                </Link>

                <Link to="/products" className="block">
                  <Button variant="outline" size="lg" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Cart Recommendations */}
        {cartRecommendations && cartRecommendations.length > 0 && (
          <div className="mt-16">
            <RecommendationSection
              title="You might also like"
              products={cartRecommendations}
              limit={4}
              className="bg-base-100 rounded-lg p-6"
            />
          </div>
        )}
      </div>
      {isAuthenticated &&
        recommendations &&
        recommendations.recommendations.length > 0 &&
        !recommendationsLoading && (
          <section className="py-6 bg-base-300">
            <div className="container mx-auto px-4">
              <div className="text-center mb-4">
                <div className="badge badge-secondary badge-lg mb-4">
                  You may like it too
                </div>

                <p className="text-lg text-base-content/70">
                  Based on your shopping preferences
                </p>
              </div>
              <RecommendationSection
                title="Recommended Just for You"
                products={recommendations.recommendations}
                isLoading={recommendationsLoading}
                viewAllLink="/recommendations"
                className=""
              />
              {/* <ProductGrid
              products={recommendations}
              loading={recommendationsLoading}
              columns={4}
            /> */}
            </div>
          </section>
        )}
    </div>
  );
};
