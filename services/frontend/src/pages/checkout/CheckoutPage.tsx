/* eslint-disable @typescript-eslint/no-explicit-any */
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { AddressForm } from "../../components/checkout/AddressForm";
import { CheckoutSteps } from "../../components/checkout/CheckoutSteps";
import { OrderSummary } from "../../components/checkout/OrderSummary";
import { PaymentForm } from "../../components/checkout/PaymentForm";
import { Button } from "../../components/ui/Button";
import { Loading } from "../../components/ui/Loading";
import { useGetCartQuery } from "../../store/api/cartApi";
import { useCreateOrderMutation } from "../../store/api/orderApi";

interface Address {
  id?: string;
  name: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  phone?: string;
  address_type: "home" | "work" | "other";
  is_default?: boolean;
}

interface PaymentMethod {
  id: string;
  type: "cash_on_delivery" | "credit_card" | "debit_card";
  name: string;
  description: string;
  icon: React.ReactNode;
  fee?: number;
}

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: cart, isLoading: cartLoading } = useGetCartQuery({});
  const [createOrder, { isLoading: orderLoading }] = useCreateOrderMutation();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>({
    id: "1",
    name: "John Doe",
    street: "123 Main Street",
    apartment: "Apt 4B",
    city: "New York",
    state: "NY",
    zip_code: "10001",
    country: "United States",
    phone: "+1 (555) 123-4567",
    address_type: "home",
    is_default: true,
  });
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(
    null
  );
  const [orderNotes, setOrderNotes] = useState("");
  const [promoCode, setPromoCode] = useState("");

  const steps = ["Address", "Payment", "Review"];

  // Mock saved addresses (replace with actual API call)
  const savedAddresses: Address[] = [
    {
      id: "1",
      name: "John Doe",
      street: "123 Main Street",
      apartment: "Apt 4B",
      city: "New York",
      state: "NY",
      zip_code: "10001",
      country: "United States",
      phone: "+1 (555) 123-4567",
      address_type: "home",
      is_default: true,
    },
  ];

  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      navigate("/cart");
    }
  }, [cart, navigate]);

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
  };

  const handlePaymentSelect = (payment: PaymentMethod) => {
    setSelectedPayment(payment);
  };

  const handleNext = () => {
    if (currentStep === 0 && !selectedAddress) {
      toast.error("Please select or add a delivery address");
      return;
    }
    if (currentStep === 1 && !selectedPayment) {
      toast.error("Please select a payment method");
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress || !selectedPayment || !cart) {
      toast.error("Please complete all checkout steps");
      return;
    }

    try {
      const orderData = {
        billing_address: {
          name: selectedAddress.name,
          street: selectedAddress.street,
          city: selectedAddress.city,
          state: selectedAddress.state,
          zip_code: selectedAddress.zip_code,
          country: selectedAddress.country,
        },
        shipping_address: {
          name: selectedAddress.name,
          street: selectedAddress.street,
          city: selectedAddress.city,
          state: selectedAddress.state,
          zip_code: selectedAddress.zip_code,
          country: selectedAddress.country,
        },
        payment_method: selectedPayment.type,
        order_notes: orderNotes,
        recommendation_source: "checkout",
      };

      const result = await createOrder(orderData).unwrap();

      toast.success("Order placed successfully!");
      navigate(`/orders/`);
      navigate(`/orders/${result.id}`);
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to place order");
    }
  };

  const calculateTotals = () => {
    if (!cart) return { subtotal: 0, shipping: 0, tax: 0, total: 0 };

    const subtotal = cart.subtotal;
    const shipping = subtotal > 50 ? 0 : 9.99;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    return { subtotal, shipping, tax, total };
  };

  if (cartLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <Loading size="lg" />
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return null; // Will redirect
  }

  const totals = calculateTotals();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/cart")}
          icon={<ArrowLeft className="w-5 h-5" />}
        >
          Back to Cart
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-base-content">Checkout</h1>
          <p className="text-base-content/70">Complete your purchase</p>
        </div>
      </div>

      {/* Checkout Steps */}
      <CheckoutSteps currentStep={currentStep} steps={steps} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Step 1: Address */}
          {currentStep === 0 && (
            <AddressForm
              selectedAddress={selectedAddress}
              onAddressSelect={handleAddressSelect}
              savedAddresses={savedAddresses}
            />
          )}

          {/* Step 2: Payment */}
          {currentStep === 1 && (
            <PaymentForm
              selectedPayment={selectedPayment}
              onPaymentSelect={handlePaymentSelect}
            />
          )}

          {/* Step 3: Review */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Review Your Order</h3>

              {/* Address Summary */}
              <div className="bg-base-100 rounded-lg p-4">
                <h4 className="font-medium mb-2">Delivery Address</h4>
                {selectedAddress && (
                  <div className="text-sm text-base-content/70">
                    <p className="font-medium text-base-content">
                      {selectedAddress.name}
                    </p>
                    <p>
                      {selectedAddress.street}
                      {selectedAddress.apartment &&
                        `, ${selectedAddress.apartment}`}
                    </p>
                    <p>
                      {selectedAddress.city}, {selectedAddress.state}{" "}
                      {selectedAddress.zip_code}
                    </p>
                    <p>{selectedAddress.country}</p>
                    {selectedAddress.phone && <p>{selectedAddress.phone}</p>}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(0)}
                  className="mt-2"
                >
                  Change Address
                </Button>
              </div>

              {/* Payment Summary */}
              <div className="bg-base-100 rounded-lg p-4">
                <h4 className="font-medium mb-2">Payment Method</h4>
                {selectedPayment && (
                  <div className="flex items-center space-x-3">
                    {selectedPayment.icon}
                    <div>
                      <p className="font-medium">{selectedPayment.name}</p>
                      <p className="text-sm text-base-content/70">
                        {selectedPayment.description}
                      </p>
                    </div>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(1)}
                  className="mt-2"
                >
                  Change Payment
                </Button>
              </div>

              {/* Order Notes */}
              <div>
                <label className="label">
                  <span className="label-text">Order Notes (Optional)</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  rows={3}
                  placeholder="Any special instructions for your order..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Previous
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button variant="primary" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handlePlaceOrder}
                loading={orderLoading}
                icon={<CheckCircle className="w-5 h-5" />}
                size="lg"
              >
                Place Order
              </Button>
            )}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <OrderSummary
              items={cart.items}
              subtotal={totals.subtotal}
              shipping={totals.shipping}
              tax={totals.tax}
              total={totals.total}
              promoCode={promoCode}
              onPromoCodeApply={setPromoCode}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// // src/pages/checkout/CheckoutPage.tsx - New checkout page for new API
// import { CreditCard, MapPin, ShoppingBag, User } from "lucide-react";
// import { useState } from "react";
// import { useForm } from "react-hook-form";
// import toast from "react-hot-toast";
// import { useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import { PriceDisplay } from "../../components/common/PriceDisplay";
// import { Button } from "../../components/ui/Button";
// import { Input } from "../../components/ui/Input";
// import { useGetCartQuery } from "../../store/api/cartApi";
// import type { Address, CreateOrderRequest } from "../../store/api/orderApi";
// import { useCreateOrderMutation } from "../../store/api/orderApi";
// import { useGetPersonalizedRecommendationsQuery } from "../../store/api/productApi";
// import type { RootState } from "../../store/store";

// interface CheckoutFormData {
//   // Billing Address
//   billing_street: string;
//   billing_city: string;
//   billing_state: string;
//   billing_zip_code: string;
//   billing_country: string;

//   // Shipping Address
//   same_as_billing: boolean;
//   shipping_street: string;
//   shipping_city: string;
//   shipping_state: string;
//   shipping_zip_code: string;
//   shipping_country: string;

//   // Payment
//   payment_method: string;

//   // Optional
//   order_notes: string;
// }

// export const CheckoutPage: React.FC = () => {
//   const navigate = useNavigate();
//   const { isAuthenticated } = useSelector((state: RootState) => state.auth);

//   const { data: cart, isLoading: cartLoading } = useGetCartQuery(undefined, {
//     skip: !isAuthenticated,
//   });

//   const { data: recommendations } = useGetPersonalizedRecommendationsQuery(
//     { recommendation_type: "checkout", limit: 4 },
//     { skip: !isAuthenticated }
//   );

//   const [createOrder, { isLoading: isCreatingOrder }] =
//     useCreateOrderMutation();

//   const [currentStep, setCurrentStep] = useState(1);
//   const [sameAsBilling, setSameAsBilling] = useState(true);

//   const {
//     register,
//     handleSubmit,
//     watch,
//     formState: { errors },
//   } = useForm<CheckoutFormData>({
//     defaultValues: {
//       same_as_billing: true,
//       payment_method: "credit_card",
//       billing_country: "US",
//       shipping_country: "US",
//     },
//   });

//   const watchSameAsBilling = watch("same_as_billing");

//   if (!isAuthenticated) {
//     return (
//       <div className="container mx-auto px-4 py-8">
//         <div className="max-w-6xl mx-auto text-center">
//           <h1 className="text-3xl font-bold text-gray-900 mb-4">
//             Please Login
//           </h1>
//           <p className="text-gray-600 mb-8">
//             You need to be logged in to checkout.
//           </p>
//           <Button onClick={() => navigate("/login")}>Login</Button>
//         </div>
//       </div>
//     );
//   }

//   if (cartLoading || !cart || cart.items.length === 0) {
//     return (
//       <div className="container mx-auto px-4 py-8">
//         <div className="max-w-6xl mx-auto text-center">
//           <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
//           <h1 className="text-3xl font-bold text-gray-900 mb-4">
//             Your cart is empty
//           </h1>
//           <p className="text-gray-600 mb-8">
//             Add some items to your cart before checking out.
//           </p>
//           <Button onClick={() => navigate("/products")}>
//             Continue Shopping
//           </Button>
//         </div>
//       </div>
//     );
//   }

//   const subtotal = cart.subtotal;
//   const taxAmount = subtotal * 0.08; // 8% tax
//   const shippingAmount = subtotal > 50 ? 0 : 10; // Free shipping over $50
//   const total = subtotal + taxAmount + shippingAmount;

//   const onSubmit = async (data: CheckoutFormData) => {
//     try {
//       const billingAddress: Address = {
//         street: data.billing_street,
//         city: data.billing_city,
//         state: data.billing_state,
//         zip_code: data.billing_zip_code,
//         country: data.billing_country,
//       };

//       const shippingAddress: Address = data.same_as_billing
//         ? billingAddress
//         : {
//             street: data.shipping_street,
//             city: data.shipping_city,
//             state: data.shipping_state,
//             zip_code: data.shipping_zip_code,
//             country: data.shipping_country,
//           };

//       const orderData: CreateOrderRequest = {
//         billing_address: billingAddress,
//         shipping_address: shippingAddress,
//         payment_method: data.payment_method,
//         recommendation_source: "checkout_recommendations",
//         order_notes: data.order_notes || undefined,
//       };

//       const order = await createOrder(orderData).unwrap();

//       toast.success("Order placed successfully!");
//       navigate(`/orders/${order.id}`);
//     } catch (error) {
//       toast.error("Failed to place order");
//       console.error("Checkout error:", error);
//     }
//   };

//   const steps = [
//     { id: 1, title: "Shipping", icon: MapPin },
//     { id: 2, title: "Payment", icon: CreditCard },
//     { id: 3, title: "Review", icon: User },
//   ];

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <div className="max-w-6xl mx-auto">
//         {/* Header */}
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-gray-900 mb-4">Checkout</h1>

//           {/* Progress Steps */}
//           <div className="flex items-center justify-center space-x-8 mb-8">
//             {steps.map((step, index) => (
//               <div key={step.id} className="flex items-center">
//                 <div
//                   className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
//                     currentStep >= step.id
//                       ? "bg-blue-600 border-blue-600 text-white"
//                       : "border-gray-300 text-gray-400"
//                   }`}
//                 >
//                   <step.icon className="w-5 h-5" />
//                 </div>
//                 <span
//                   className={`ml-2 text-sm font-medium ${
//                     currentStep >= step.id ? "text-gray-900" : "text-gray-400"
//                   }`}
//                 >
//                   {step.title}
//                 </span>
//                 {index < steps.length - 1 && (
//                   <div
//                     className={`w-12 h-px mx-4 ${
//                       currentStep > step.id ? "bg-blue-600" : "bg-gray-300"
//                     }`}
//                   />
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>

//         <form onSubmit={handleSubmit(onSubmit)}>
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//             {/* Main Content */}
//             <div className="lg:col-span-2 space-y-8">
//               {/* Step 1: Shipping Information */}
//               {currentStep >= 1 && (
//                 <div className="bg-white rounded-lg border border-gray-200 p-6">
//                   <h2 className="text-xl font-semibold text-gray-900 mb-6">
//                     Shipping Information
//                   </h2>

//                   {/* Billing Address */}
//                   <div className="mb-6">
//                     <h3 className="text-lg font-medium text-gray-900 mb-4">
//                       Billing Address
//                     </h3>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       <div className="md:col-span-2">
//                         <Input
//                           label="Street Address"
//                           {...register("billing_street", {
//                             required: "Street address is required",
//                           })}
//                           error={errors.billing_street?.message}
//                         />
//                       </div>
//                       <Input
//                         label="City"
//                         {...register("billing_city", {
//                           required: "City is required",
//                         })}
//                         error={errors.billing_city?.message}
//                       />
//                       <Input
//                         label="State"
//                         {...register("billing_state", {
//                           required: "State is required",
//                         })}
//                         error={errors.billing_state?.message}
//                       />
//                       <Input
//                         label="ZIP Code"
//                         {...register("billing_zip_code", {
//                           required: "ZIP code is required",
//                         })}
//                         error={errors.billing_zip_code?.message}
//                       />
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">
//                           Country
//                         </label>
//                         <select
//                           {...register("billing_country")}
//                           className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                         >
//                           <option value="US">United States</option>
//                           <option value="CA">Canada</option>
//                         </select>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Same as Billing Checkbox */}
//                   <div className="mb-6">
//                     <label className="flex items-center">
//                       <input
//                         type="checkbox"
//                         {...register("same_as_billing")}
//                         className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
//                       />
//                       <span className="ml-2 text-sm text-gray-700">
//                         Shipping address is the same as billing address
//                       </span>
//                     </label>
//                   </div>

//                   {/* Shipping Address */}
//                   {!watchSameAsBilling && (
//                     <div>
//                       <h3 className="text-lg font-medium text-gray-900 mb-4">
//                         Shipping Address
//                       </h3>
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                         <div className="md:col-span-2">
//                           <Input
//                             label="Street Address"
//                             {...register("shipping_street", {
//                               required: !watchSameAsBilling
//                                 ? "Street address is required"
//                                 : false,
//                             })}
//                             error={errors.shipping_street?.message}
//                           />
//                         </div>
//                         <Input
//                           label="City"
//                           {...register("shipping_city", {
//                             required: !watchSameAsBilling
//                               ? "City is required"
//                               : false,
//                           })}
//                           error={errors.shipping_city?.message}
//                         />
//                         <Input
//                           label="State"
//                           {...register("shipping_state", {
//                             required: !watchSameAsBilling
//                               ? "State is required"
//                               : false,
//                           })}
//                           error={errors.shipping_state?.message}
//                         />
//                         <Input
//                           label="ZIP Code"
//                           {...register("shipping_zip_code", {
//                             required: !watchSameAsBilling
//                               ? "ZIP code is required"
//                               : false,
//                           })}
//                           error={errors.shipping_zip_code?.message}
//                         />
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                             Country
//                           </label>
//                           <select
//                             {...register("shipping_country")}
//                             className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                           >
//                             <option value="US">United States</option>
//                             <option value="CA">Canada</option>
//                           </select>
//                         </div>
//                       </div>
//                     </div>
//                   )}

//                   {currentStep === 1 && (
//                     <div className="mt-6">
//                       <Button onClick={() => setCurrentStep(2)}>
//                         Continue to Payment
//                       </Button>
//                     </div>
//                   )}
//                 </div>
//               )}

//               {/* Step 2: Payment Information */}
//               {currentStep >= 2 && (
//                 <div className="bg-white rounded-lg border border-gray-200 p-6">
//                   <h2 className="text-xl font-semibold text-gray-900 mb-6">
//                     Payment Information
//                   </h2>

//                   <div className="space-y-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Payment Method
//                       </label>
//                       <div className="space-y-2">
//                         <label className="flex items-center">
//                           <input
//                             type="radio"
//                             value="credit_card"
//                             {...register("payment_method")}
//                             className="text-blue-600 focus:ring-blue-500"
//                           />
//                           <span className="ml-2">Credit Card</span>
//                         </label>
//                         <label className="flex items-center">
//                           <input
//                             type="radio"
//                             value="paypal"
//                             {...register("payment_method")}
//                             className="text-blue-600 focus:ring-blue-500"
//                           />
//                           <span className="ml-2">PayPal</span>
//                         </label>
//                       </div>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         Order Notes (Optional)
//                       </label>
//                       <textarea
//                         {...register("order_notes")}
//                         rows={3}
//                         className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                         placeholder="Any special instructions for your order..."
//                       />
//                     </div>
//                   </div>

//                   {currentStep === 2 && (
//                     <div className="mt-6 flex space-x-4">
//                       <Button
//                         variant="outline"
//                         onClick={() => setCurrentStep(1)}
//                       >
//                         Back
//                       </Button>
//                       <Button onClick={() => setCurrentStep(3)}>
//                         Review Order
//                       </Button>
//                     </div>
//                   )}
//                 </div>
//               )}

//               {/* Step 3: Order Review */}
//               {currentStep >= 3 && (
//                 <div className="bg-white rounded-lg border border-gray-200 p-6">
//                   <h2 className="text-xl font-semibold text-gray-900 mb-6">
//                     Review Your Order
//                   </h2>

//                   {/* Order Items */}
//                   <div className="space-y-4 mb-6">
//                     {cart.items.map((item) => (
//                       <div
//                         key={item.id}
//                         className="flex items-center space-x-4 py-4 border-b border-gray-200"
//                       >
//                         <img
//                           src={item.product.images[0] || "/placeholder.jpg"}
//                           alt={item.product.name}
//                           className="w-16 h-16 object-cover rounded-lg"
//                         />
//                         <div className="flex-1">
//                           <h3 className="font-medium text-gray-900">
//                             {item.product.name}
//                           </h3>
//                           <p className="text-sm text-gray-600">
//                             Quantity: {item.quantity}
//                           </p>
//                         </div>
//                         <PriceDisplay price={item.total_price} />
//                       </div>
//                     ))}
//                   </div>

//                   <div className="flex space-x-4">
//                     <Button variant="outline" onClick={() => setCurrentStep(2)}>
//                       Back
//                     </Button>
//                     <Button
//                       type="submit"
//                       disabled={isCreatingOrder}
//                       className="flex-1"
//                     >
//                       {isCreatingOrder ? "Placing Order..." : "Place Order"}
//                     </Button>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Order Summary Sidebar */}
//             <div className="lg:col-span-1">
//               <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
//                 <h2 className="text-lg font-semibold text-gray-900 mb-4">
//                   Order Summary
//                 </h2>

//                 <div className="space-y-3 mb-6">
//                   <div className="flex justify-between text-sm">
//                     <span>Subtotal ({cart.total_items} items)</span>
//                     <PriceDisplay price={subtotal} size="sm" />
//                   </div>
//                   <div className="flex justify-between text-sm">
//                     <span>Tax</span>
//                     <PriceDisplay price={taxAmount} size="sm" />
//                   </div>
//                   <div className="flex justify-between text-sm">
//                     <span>Shipping</span>
//                     {shippingAmount === 0 ? (
//                       <span className="font-medium text-green-600">Free</span>
//                     ) : (
//                       <PriceDisplay price={shippingAmount} size="sm" />
//                     )}
//                   </div>
//                   <div className="border-t pt-3">
//                     <div className="flex justify-between text-lg font-semibold">
//                       <span>Total</span>
//                       <PriceDisplay price={total} size="lg" />
//                     </div>
//                   </div>
//                 </div>

//                 {/* Security Badge */}
//                 <div className="text-center text-xs text-gray-500">
//                   <div className="flex items-center justify-center space-x-1 mb-2">
//                     <CreditCard className="w-4 h-4" />
//                     <span>Secure checkout</span>
//                   </div>
//                   <p>Your payment information is encrypted and secure</p>
//                 </div>
//               </div>

//               {/* Recommendations */}
//               {recommendations && recommendations.length > 0 && (
//                 <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
//                   <h3 className="text-lg font-semibold text-gray-900 mb-4">
//                     You might also like
//                   </h3>
//                   <div className="space-y-4">
//                     {recommendations.slice(0, 3).map((rec) => (
//                       <div
//                         key={rec.product_id}
//                         className="flex items-center space-x-3"
//                       >
//                         <img
//                           src={rec.product.images[0] || "/placeholder.jpg"}
//                           alt={rec.product.name}
//                           className="w-12 h-12 object-cover rounded-lg"
//                         />
//                         <div className="flex-1 min-w-0">
//                           <p className="text-sm font-medium text-gray-900 truncate">
//                             {rec.product.name}
//                           </p>
//                           <PriceDisplay price={rec.product.price} size="sm" />
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };
