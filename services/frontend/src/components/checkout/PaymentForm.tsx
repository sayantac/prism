/* eslint-disable @typescript-eslint/no-explicit-any */
import { Banknote, CreditCard, Shield, Truck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "../ui/Input";

interface PaymentMethod {
  id: string;
  type: "cash_on_delivery" | "credit_card" | "debit_card" | "bank_transfer";
  name: string;
  description: string;
  icon: React.ReactNode;
  fee?: number;
}

interface PaymentFormProps {
  selectedPayment?: PaymentMethod;
  onPaymentSelect: (payment: PaymentMethod) => void;
  onPaymentDetailsSubmit?: (details: any) => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  selectedPayment,
  onPaymentSelect,
  onPaymentDetailsSubmit,
}) => {
  const [showCardForm, setShowCardForm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const paymentMethods: PaymentMethod[] = [
    {
      id: "cod",
      type: "cash_on_delivery",
      name: "Cash on Delivery",
      description: "Pay when your order arrives. No additional fees.",
      icon: <Banknote className="w-6 h-6" />,
    },
    {
      id: "credit",
      type: "credit_card",
      name: "Credit Card",
      description: "Visa, Mastercard, American Express",
      icon: <CreditCard className="w-6 h-6" />,
    },
    {
      id: "debit",
      type: "debit_card",
      name: "Debit Card",
      description: "Pay directly from your bank account",
      icon: <CreditCard className="w-6 h-6" />,
    },
  ];

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    onPaymentSelect(method);
    setShowCardForm(
      method.type === "credit_card" || method.type === "debit_card"
    );
  };

  const onSubmit = (data: any) => {
    onPaymentDetailsSubmit?.(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Payment Method</h3>

        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedPayment?.id === method.id
                  ? "border-primary bg-primary/5"
                  : "border-base-300 hover:border-base-400"
              }`}
              onClick={() => handlePaymentMethodSelect(method)}
            >
              <div className="flex items-center space-x-4">
                <div className="text-primary">{method.icon}</div>
                <div className="flex-1">
                  <p className="font-medium">{method.name}</p>
                  <p className="text-sm text-base-content/70">
                    {method.description}
                  </p>
                  {method.fee && (
                    <p className="text-sm text-warning">
                      Additional fee: ${method.fee}
                    </p>
                  )}
                </div>
                {selectedPayment?.id === method.id && (
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card Details Form */}
      {showCardForm && (
        <div className="space-y-4">
          <h4 className="font-medium">Card Details</h4>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Card Number"
              placeholder="1234 5678 9012 3456"
              error={errors.cardNumber?.message}
              {...register("cardNumber", {
                required: "Card number is required",
                pattern: {
                  value: /^[0-9\s]{13,19}$/,
                  message: "Invalid card number",
                },
              })}
            />

            <Input
              label="Cardholder Name"
              placeholder="John Doe"
              error={errors.cardholderName?.message}
              {...register("cardholderName", {
                required: "Cardholder name is required",
              })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Expiry Date"
                placeholder="MM/YY"
                error={errors.expiryDate?.message}
                {...register("expiryDate", {
                  required: "Expiry date is required",
                  pattern: {
                    value: /^(0[1-9]|1[0-2])\/\d{2}$/,
                    message: "Invalid expiry date (MM/YY)",
                  },
                })}
              />
              <Input
                label="CVV"
                placeholder="123"
                error={errors.cvv?.message}
                {...register("cvv", {
                  required: "CVV is required",
                  pattern: {
                    value: /^\d{3,4}$/,
                    message: "Invalid CVV",
                  },
                })}
              />
            </div>

            <div className="flex items-center space-x-2 text-sm text-base-content/70">
              <Shield className="w-4 h-4" />
              <span>Your payment information is secure and encrypted</span>
            </div>
          </form>
        </div>
      )}

      {/* COD Information */}
      {selectedPayment?.type === "cash_on_delivery" && (
        <div className="bg-info/10 border border-info/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Truck className="w-5 h-5 text-info mt-0.5" />
            <div>
              <h4 className="font-medium text-info">Cash on Delivery</h4>
              <p className="text-sm text-base-content/70 mt-1">
                You can pay with cash when your order is delivered to your
                doorstep. Please keep the exact amount ready for a smooth
                transaction.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
