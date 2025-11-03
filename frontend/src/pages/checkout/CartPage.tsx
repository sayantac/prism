/* eslint-disable @typescript-eslint/no-explicit-any */
import { ArrowLeft, ArrowRight, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { CartItem } from "../../components/cart/CartItem";
import { CartSummary } from "../../components/cart/CartSummary";
import { EmptyState } from "../../components/common/EmptyState";
import { RecommendationSection } from "../../components/common/RecommendationSection";
import { Button } from "../../components/ui/Button";
import { Loading } from "../../components/ui/Loading";
import { useAuth } from "../../hooks/useAuth";
import { useClearCartMutation, useGetCartQuery } from "../../store/api/cartApi";
import {
  useGetCartRecommendationsQuery,
  useGetRecommendationsQuery,
} from "../../store/api/recommendationApi";

export const CartPage: React.FC = () => {
  const { data: cart, isLoading } = useGetCartQuery({});

  const { user, isAuthenticated } = useAuth();
  const { data: cartRecommendations } = useGetCartRecommendationsQuery(
    user?.id,
    { skip: !user?.id }
  );

  const { data: recommendations, isLoading: recommendationsLoading } =
    useGetRecommendationsQuery(user?.id, {
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
              <CartItem key={item.id} item={item} />
            ))}
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <CartSummary
                cart={{
                  subtotal: cart.subtotal,
                  shipping: cart.subtotal > 50 ? 0 : 9.99,
                  tax: cart.subtotal * 0.08,
                  total:
                    cart.subtotal +
                    (cart.subtotal > 50 ? 0 : 9.99) +
                    cart.subtotal * 0.08,
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
// // src/pages/checkout/CartPage.tsx - Updated for new API structure
// import { AnimatePresence, motion } from "framer-motion";
// import {
//   ArrowLeft,
//   CreditCard,
//   Minus,
//   Plus,
//   ShoppingCart,
//   Trash2,
// } from "lucide-react";
// import { useState } from "react";
// import { useSelector } from "react-redux";
// import { Link, useNavigate } from "react-router-dom";
// import { EmptyState } from "../../components/common/EmptyState";
// import { PriceDisplay } from "../../components/common/PriceDisplay";
// import { ProductCarousel } from "../../components/product/ProductCarousel";
// import { Button } from "../../components/ui/Button";
// import {
//   useClearCartMutation,
//   useGetCartQuery,
//   useRemoveCartItemMutation,
//   useUpdateCartItemMutation,
// } from "../../store/api/cartApi";
// import { useGetPersonalizedRecommendationsQuery } from "../../store/api/productApi";
// import type { RootState } from "../../store/store";

// export const CartPage: React.FC = () => {
//   const navigate = useNavigate();
//   const { data: cart, isLoading } = useGetCartQuery({});
//   const [updateCartItem] = useUpdateCartItemMutation();
//   const [removeFromCart] = useRemoveCartItemMutation();
//   const [clearCart] = useClearCartMutation();

//   const [promoCode, setPromoCode] = useState("");
//   const { isAuthenticated } = useSelector((state: RootState) => state.auth);

//   // Get cart-based recommendations
//   const { data: recommendations, isLoading: recommendationsLoading } =
//     useGetPersonalizedRecommendationsQuery(
//       {
//         recommendation_type: "cart",
//         limit: 8,
//       },
//       { skip: !isAuthenticated }
//     );

//   const handleUpdateQuantity = async (itemId: string, quantity: number) => {
//     if (quantity < 1) return;
//     try {
//       await updateCartItem({ item_id: itemId, quantity }).unwrap();
//     } catch (error) {
//       console.error("Failed to update cart item:", error);
//     }
//   };

//   const handleRemoveItem = async (itemId: string) => {
//     try {
//       await removeFromCart(itemId).unwrap();
//     } catch (error) {
//       console.error("Failed to remove cart item:", error);
//     }
//   };

//   const handleClearCart = async () => {
//     if (window.confirm("Are you sure you want to clear your cart?")) {
//       try {
//         await clearCart().unwrap();
//       } catch (error) {
//         console.error("Failed to clear cart:", error);
//       }
//     }
//   };

//   const calculateEstimatedTax = () => {
//     return (cart?.subtotal || 0) * 0.08; // 8% tax rate
//   };

//   const calculateTotal = () => {
//     const subtotal = cart?.subtotal || 0;
//     const shipping = subtotal > 50 ? 0 : 10; // Free shipping over $50
//     const tax = calculateEstimatedTax();
//     return subtotal + shipping + tax;
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="loading loading-spinner loading-lg"></div>
//       </div>
//     );
//   }

//   // Empty cart state
//   if (!cart?.items || cart.items.length === 0) {
//     return (
//       <div className="min-h-screen bg-base-200 py-8">
//         <div className="container mx-auto px-4">
//           <EmptyState
//             icon={<ShoppingCart className="w-16 h-16" />}
//             title="Your cart is empty"
//             description="Looks like you haven't added anything to your cart yet."
//             action={
//               <Button
//                 onClick={() => navigate("/products")}
//                 variant="primary"
//                 size="lg"
//               >
//                 Start Shopping
//               </Button>
//             }
//           />

//           {/* Show recommendations even when cart is empty */}
//           {recommendations && recommendations.length > 0 && (
//             <div className="mt-12">
//               <h2 className="text-2xl font-bold text-base-content mb-6 text-center">
//                 Recommended for You
//               </h2>
//               <ProductCarousel products={recommendations} />
//             </div>
//           )}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-base-200 py-8">
//       <div className="container mx-auto px-4">
//         <div className="max-w-7xl mx-auto">
//           {/* Header */}
//           <div className="flex items-center justify-between mb-8">
//             <div>
//               <h1 className="text-3xl font-bold text-base-content">
//                 Shopping Cart
//               </h1>
//               <p className="text-base-content opacity-70 mt-2">
//                 {cart.total_items} {cart.total_items === 1 ? "item" : "items"}{" "}
//                 in your cart
//               </p>
//             </div>
//             <Button
//               variant="ghost"
//               onClick={() => navigate("/products")}
//               icon={<ArrowLeft className="w-4 h-4" />}
//             >
//               Continue Shopping
//             </Button>
//           </div>

//           <div className="grid lg:grid-cols-3 gap-8">
//             {/* Cart Items */}
//             <div className="lg:col-span-2 space-y-4">
//               <div className="card bg-base-100 shadow-xl">
//                 <div className="card-body">
//                   <div className="flex items-center justify-between mb-4">
//                     <h2 className="text-xl font-semibold">
//                       Items ({cart.item_count})
//                     </h2>
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={handleClearCart}
//                       className="text-error hover:bg-error/10"
//                     >
//                       Clear Cart
//                     </Button>
//                   </div>

//                   <AnimatePresence>
//                     {cart.items.map((item: any) => (
//                       <motion.div
//                         key={item.id}
//                         initial={{ opacity: 1, height: "auto" }}
//                         exit={{ opacity: 0, height: 0 }}
//                         transition={{ duration: 0.2 }}
//                         className="flex items-center gap-4 py-4 border-b border-base-300 last:border-b-0"
//                       >
//                         {/* Product Image */}
//                         <div className="avatar">
//                           <div className="w-20 h-20 rounded-lg">
//                             <img
//                               src={
//                                 item.product.images?.[0] || "/placeholder.jpg"
//                               }
//                               alt={item.product.name}
//                               className="object-cover"
//                             />
//                           </div>
//                         </div>

//                         {/* Product Details */}
//                         <div className="flex-1">
//                           <Link
//                             to={`/products/${item.product_id}`}
//                             className="font-medium text-base-content hover:text-primary transition-colors"
//                           >
//                             {item.product.name}
//                           </Link>
//                           <div className="flex items-center gap-4 mt-2">
//                             <PriceDisplay amount={item.unit_price} />
//                             {item.product.stock_quantity <= 5 && (
//                               <span className="badge badge-warning badge-sm">
//                                 Only {item.product.stock_quantity} left
//                               </span>
//                             )}
//                           </div>
//                         </div>

//                         {/* Quantity Controls */}
//                         <div className="flex items-center gap-2">
//                           <button
//                             onClick={() =>
//                               handleUpdateQuantity(item.id, item.quantity - 1)
//                             }
//                             disabled={item.quantity <= 1}
//                             className="btn btn-square btn-outline btn-sm"
//                           >
//                             <Minus className="w-4 h-4" />
//                           </button>
//                           <input
//                             type="number"
//                             min="1"
//                             max={item.product.stock_quantity}
//                             value={item.quantity}
//                             onChange={(e) => {
//                               const newQuantity = parseInt(e.target.value) || 1;
//                               handleUpdateQuantity(item.id, newQuantity);
//                             }}
//                             className="input input-bordered w-16 text-center input-sm"
//                           />
//                           <button
//                             onClick={() =>
//                               handleU pdateQuantity(item.id, item.quantity + 1)
//                             }
//                             disabled={
//                               item.quantity >= item.product.stock_quantity
//                             }
//                             className="btn btn-square btn-outline btn-sm"
//                           >
//                             <Plus className="w-4 h-4" />
//                           </button>
//                         </div>

//                         {/* Item Total */}
//                         <div className="text-right min-w-[100px]">
//                           <PriceDisplay
//                             amount={item.total_price}
//                             className="font-semibold"
//                           />
//                         </div>

//                         {/* Remove Button */}
//                         <button
//                           onClick={() => handleRemoveItem(item.id)}
//                           className="btn btn-ghost btn-sm btn-square text-error hover:bg-error/10"
//                         >
//                           <Trash2 className="w-4 h-4" />
//                         </button>
//                       </motion.div>
//                     ))}
//                   </AnimatePresence>
//                 </div>
//               </div>
//             </div>

//             {/* Order Summary */}
//             <div className="lg:col-span-1">
//               <div className="card bg-base-100 shadow-xl sticky top-4">
//                 <div className="card-body">
//                   <h3 className="text-lg font-semibold mb-4">Order Summary</h3>

//                   {/* Promo Code */}
//                   <div className="form-control mb-4">
//                     <label className="label">
//                       <span className="label-text">Promo Code</span>
//                     </label>
//                     <div className="join">
//                       <input
//                         type="text"
//                         placeholder="Enter code"
//                         className="input input-bordered join-item flex-1"
//                         value={promoCode}
//                         onChange={(e) => setPromoCode(e.target.value)}
//                       />
//                       <Button className="join-item" variant="outline" size="sm">
//                         Apply
//                       </Button>
//                     </div>
//                   </div>

//                   <div className="divider"></div>

//                   {/* Price Breakdown */}
//                   <div className="space-y-2">
//                     <div className="flex justify-between">
//                       <span>Subtotal ({cart.total_items} items)</span>
//                       <PriceDisplay amount={cart.subtotal} />
//                     </div>
//                     <div className="flex justify-between">
//                       <span>Shipping</span>
//                       {(cart.subtotal || 0) > 50 ? (
//                         <span className="text-success">Free</span>
//                       ) : (
//                         <PriceDisplay amount={10} />
//                       )}
//                     </div>
//                     <div className="flex justify-between">
//                       <span>Estimated Tax</span>
//                       <PriceDisplay amount={calculateEstimatedTax()} />
//                     </div>
//                   </div>

//                   <div className="divider"></div>

//                   <div className="flex justify-between font-bold text-lg">
//                     <span>Total</span>
//                     <PriceDisplay amount={calculateTotal()} />
//                   </div>

//                   <Button
//                     onClick={() => navigate("/checkout")}
//                     variant="primary"
//                     size="lg"
//                     block
//                     className="mt-4"
//                     icon={<CreditCard className="w-5 h-5" />}
//                   >
//                     Proceed to Checkout
//                   </Button>

//                   {(cart.subtotal || 0) < 50 && (
//                     <div className="mt-4 p-3 bg-info/10 rounded-lg">
//                       <p className="text-sm text-info">
//                         Add <PriceDisplay amount={50 - (cart.subtotal || 0)} />{" "}
//                         more for free shipping!
//                       </p>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Recommendations */}
//           {recommendations && recommendations.length > 0 && (
//             <div className="mt-12">
//               <h2 className="text-2xl font-bold text-base-content mb-6">
//                 You might also like
//               </h2>
//               <ProductCarousel
//                 products={recommendations}
//                 loading={recommendationsLoading}
//               />
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };
