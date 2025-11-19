/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/cart/CartDrawer.tsx
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks";
import {
  useGetCartQuery,
  useRemoveFromCartMutation,
  useUpdateCartItemMutation,
} from "../../store/api/cartApi";
import { setCartDrawerOpen } from "../../store/slices/uiSlice";
import type { RootState } from "@/store";
import { EmptyState } from "../common/EmptyState";
import { PriceDisplay } from "../common/PriceDisplay";
import { Button } from "../ui/Button";

export const CartDrawer: React.FC = () => {
  const dispatch = useDispatch();
  const { cartDrawerOpen } = useSelector((state: RootState) => state.ui);
  const { isAuthenticated } = useAuth();

  const { data: cart, isLoading } = useGetCartQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [updateCartItem] = useUpdateCartItemMutation();
  const [removeFromCart] = useRemoveFromCartMutation();

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    try {
      await updateCartItem({ itemId, quantity }).unwrap();
    } catch (error) {
      console.error("Failed to update cart item:", error);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    try {
      await removeFromCart(productId).unwrap();
    } catch (error) {
      console.error("Failed to remove cart item:", error);
    }
  };

  return (
    <AnimatePresence>
      {cartDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 bg-opacity-50 z-40"
            onClick={() => dispatch(setCartDrawerOpen(false))}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed right-0 top-0 bottom-0 w-96 bg-base-200 border-l border-base-300 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-base-300">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-base-content">
                  Shopping Cart{" "}
                  {cart?.total_items ? `(${cart.total_items})` : ""}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dispatch(setCartDrawerOpen(false))}
                  icon={<X className="w-5 h-5" />}
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-4">
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex space-x-3">
                        <div className="w-16 h-16 bg-base-200 rounded"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-base-200 rounded w-3/4"></div>
                          <div className="h-4 bg-base-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : !cart?.items?.length ? (
                <div className="p-4">
                  <EmptyState
                    title="Your cart is empty"
                    description="Add some products to get started"
                    action={{
                      label: "Continue Shopping",
                      onClick: () => {
                        dispatch(setCartDrawerOpen(false));
                      },
                    }}
                  />
                </div>
              ) : (
                <div className="p-4 space-y-4 border border-base-300 m-2 rounded-md">
                  {cart.items.map((item: any) => (
                    <div
                      key={item.product.id}
                      className="flex space-x-3 pb-4 border-b border-base-300 last:border-b-0"
                    >
                      <img
                        src={item.product.images[0] || "/placeholder.jpg"}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />

                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-base-content truncate">
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-base-content truncate">
                          {item.product.brand}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <PriceDisplay price={item.product.price} size="sm" />

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() =>
                                handleUpdateQuantity(
                                  item.product.id,
                                  item.quantity - 1
                                )
                              }
                              className="p-1 hover:bg-primary rounded"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </button>

                            <span className="text-sm font-medium w-8 text-center">
                              {item.quantity}
                            </span>

                            <button
                              onClick={() =>
                                handleUpdateQuantity(
                                  item.product.id,
                                  item.quantity + 1
                                )
                              }
                              className="p-1 hover:bg-primary rounded"
                            >
                              <Plus className="w-3 h-3" />
                            </button>

                            <button
                              onClick={() => handleRemoveItem(item.product.id)}
                              className="p-1 hover:bg-gray-100 rounded text-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart?.items?.length > 0 && (
              <div className="p-4 border-t border-base-300 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium text-base-content">
                    Total
                  </span>
                  <PriceDisplay price={cart.total_amount} size="lg" />
                </div>

                <div className="space-y-2">
                  <Link
                    to="/cart"
                    onClick={() => dispatch(setCartDrawerOpen(false))}
                    className="block"
                  >
                    <Button variant="outline" className="w-full">
                      View Cart
                    </Button>
                  </Link>

                  <Link
                    to="/checkout"
                    onClick={() => dispatch(setCartDrawerOpen(false))}
                    className="block"
                  >
                    <Button className="w-full">Checkout</Button>
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
