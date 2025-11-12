import { AnimatePresence, motion } from "framer-motion";
import {
  Banknote,
  CheckCircle,
  Clock,
  CreditCard,
  Eye,
  IndianRupee,
  Package,
  RotateCcw,
  Truck,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { EmptyState } from "../../components/common/EmptyState";
import { Pagination } from "../../components/common/Pagination";
import { PriceDisplay } from "../../components/common/PriceDisplay";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import {
  useCancelOrderMutation,
  useGetOrderByIdQuery,
  useGetOrdersQuery,
  useRequestReturnMutation,
} from "../../store/api/orderApi";

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  product_name: string;
  product_code: string | null;
}

interface Address {
  city: string;
  name: string;
  state: string;
  street: string;
  country: string;
  zip_code: string;
}

interface Order {
  id: string;
  order_number: string;
  subtotal: string;
  tax_amount: string;
  shipping_amount: string;
  discount_amount: string;
  total_amount: string;
  status: string;
  payment_status: string;
  billing_address: Address;
  shipping_address: Address;
  payment_method: string;
  recommendation_source?: string;
  recommendation_session_id?: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export const OrdersPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: ordersData,
    isLoading,
    error,
  } = useGetOrdersQuery({
    page: currentPage,
    page_size: 10,
    status: statusFilter || undefined,
  });

  const { data: selectedOrder } = useGetOrderByIdQuery(selectedOrderId!, {
    skip: !selectedOrderId,
  });

  useEffect(() => {
    if (id && ordersData) {
      setSelectedOrderId(id);
    }
  }, [id, ordersData]);

  const [cancelOrder] = useCancelOrderMutation();
  const [requestReturn] = useRequestReturnMutation();

  const totalPages = ordersData?.pages || 1;
  const orders: Order[] = ordersData?.items || [];

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "confirmed":
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case "processing":
        return <Package className="w-4 h-4 text-purple-500" />;
      case "shipped":
        return <Truck className="w-4 h-4 text-indigo-500" />;
      case "delivered":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Package className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-purple-100 text-purple-800";
      case "shipped":
        return "bg-indigo-100 text-indigo-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case "cod":
        return <IndianRupee className="w-4 h-4 text-blue-500" />;
      case "bank_transfer":
        return <Banknote className="w-4 h-4 text-green-500" />;
      default:
        return <CreditCard className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleCancelOrder = async (orderId: string) => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      try {
        await cancelOrder(orderId).unwrap();
      } catch (error) {
        console.error("Failed to cancel order:", error);
      }
    }
  };

  const handleRequestReturn = async () => {
    if (!selectedOrderId || !returnReason.trim()) return;

    try {
      await requestReturn({
        orderId: selectedOrderId,
        reason: returnReason,
      }).unwrap();
      setShowReturnModal(false);
      setReturnReason("");
      setSelectedOrderId(null);
    } catch (error) {
      console.error("Failed to request return:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-100 p-6 rounded-lg border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32" />
                      <div className="h-4 bg-gray-200 rounded w-24" />
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-20" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                My Orders
              </h1>
              <p className="text-gray-600">Track and manage your orders</p>
            </div>

            {/* Status Filter */}
            <div className="mt-4 sm:mt-0">
              <select
                className="select select-bordered w-full sm:w-auto"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Orders</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              Failed to load orders. Please try again.
            </div>
          )}

          {/* Empty State */}
          {!orders.length && !isLoading && (
            <EmptyState
              icon={<Package className="w-16 h-16 text-gray-400" />}
              title="No orders found"
              description={
                statusFilter
                  ? `No orders with status "${statusFilter}"`
                  : "You haven't placed any orders yet."
              }
              action={{
                label: "Start Shopping",
                onClick: () => (window.location.href = "/products"),
              }}
            />
          )}

          {/* Orders List */}
          <div className="space-y-6">
            <AnimatePresence>
              {orders.map((order: Order, index: number) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    {/* Order Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          Order #{order.order_number}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Placed on {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusIcon(order.status)}
                          <span className="ml-2 capitalize">
                            {order.status}
                          </span>
                        </span>
                        <PriceDisplay
                          price={parseFloat(order.total_amount)}
                          size="lg"
                          className="font-bold text-gray-900"
                        />
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {/* Payment Method */}
                      <div className="flex items-center">
                        <span className="mr-2">
                          {getPaymentMethodIcon(order.payment_method)}
                        </span>
                        <span className="text-sm text-gray-600 capitalize">
                          {order.payment_method.replace("_", " ")} •{" "}
                          {order.payment_status}
                        </span>
                      </div>

                      {/* Items Count */}
                      <div className="text-sm text-gray-600">
                        {order.items.length}{" "}
                        {order.items.length === 1 ? "item" : "items"}
                      </div>

                      {/* Recommendation Source */}
                      {order.recommendation_source && (
                        <div className="text-sm text-gray-600">
                          Recommended via {order.recommendation_source}
                        </div>
                      )}
                    </div>

                    {/* Order Items Preview */}
                    <div className="mb-4">
                      <div className="flex -space-x-2">
                        {order.items.slice(0, 5).map((item, idx) => (
                          <div
                            key={idx}
                            className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600"
                          >
                            {item.quantity}x
                          </div>
                        ))}
                        {order.items.length > 5 && (
                          <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                            +{order.items.length - 5}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOrderId(order.id)}
                        icon={<Eye className="w-4 h-4" />}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        View Details
                      </Button>

                      {order.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelOrder(order.id)}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          Cancel Order
                        </Button>
                      )}

                      {order.status === "delivered" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrderId(order.id);
                            setShowReturnModal(true);
                          }}
                          icon={<RotateCcw className="w-4 h-4" />}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          Request Return
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>

          {/* Order Details Modal */}
          <Modal
            isOpen={!!selectedOrderId && !showReturnModal}
            onClose={() => setSelectedOrderId(null)}
            title={`Order #${selectedOrder?.order_number}`}
            size="lg"
          >
            {selectedOrder && (
              <div className="space-y-6">
                {/* Order Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Order Date
                    </h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDate(selectedOrder.created_at)}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Order Status
                    </h4>
                    <div className="mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          selectedOrder.status
                        )}`}
                      >
                        {getStatusIcon(selectedOrder.status)}
                        <span className="ml-1 capitalize">
                          {selectedOrder.status}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Payment Method
                    </h4>
                    <div className="mt-1 flex items-center">
                      {getPaymentMethodIcon(selectedOrder.payment_method)}
                      <span className="ml-1 text-sm text-gray-900 capitalize">
                        {selectedOrder.payment_method.replace("_", " ")} •{" "}
                        {selectedOrder.payment_status}
                      </span>
                    </div>
                  </div>
                  {selectedOrder.recommendation_source && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Recommendation
                      </h4>
                      <p className="mt-1 text-sm text-gray-900 capitalize">
                        {selectedOrder.recommendation_source}
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Order Items
                  </h3>
                  <div className="space-y-4">
                    {selectedOrder.items.map((item: OrderItem) => (
                      <div
                        key={item.id}
                        className="flex gap-4 p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                          <Package className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-medium text-gray-900 truncate">
                            {item.product_name}
                          </h5>
                          <p className="text-sm text-gray-500">
                            Quantity: {item.quantity}
                          </p>
                          <PriceDisplay
                            price={parseFloat(item.total_price)}
                            size="sm"
                            className="text-gray-900 font-medium"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Addresses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Billing Address
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{selectedOrder.billing_address.name}</p>
                      <p>{selectedOrder.billing_address.street}</p>
                      <p>
                        {selectedOrder.billing_address.city},{" "}
                        {selectedOrder.billing_address.state}{" "}
                        {selectedOrder.billing_address.zip_code}
                      </p>
                      <p>{selectedOrder.billing_address.country}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Shipping Address
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{selectedOrder.shipping_address.name}</p>
                      <p>{selectedOrder.shipping_address.street}</p>
                      <p>
                        {selectedOrder.shipping_address.city},{" "}
                        {selectedOrder.shipping_address.state}{" "}
                        {selectedOrder.shipping_address.zip_code}
                      </p>
                      <p>{selectedOrder.shipping_address.country}</p>
                    </div>
                  </div>
                </div>

                {/* Order Totals */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Order Summary
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Subtotal</span>
                      <PriceDisplay price={parseFloat(selectedOrder.subtotal)} size="sm" />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Shipping</span>
                      <PriceDisplay
                        price={parseFloat(selectedOrder.shipping_amount || "0")}
                        size="sm"
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tax</span>
                      <PriceDisplay
                        price={parseFloat(selectedOrder.tax_amount || "0")}
                        size="sm"
                      />
                    </div>
                    {selectedOrder.discount_amount && parseFloat(selectedOrder.discount_amount) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Discount</span>
                        <PriceDisplay
                          price={-parseFloat(selectedOrder.discount_amount)}
                          size="sm"
                          className="text-green-600"
                        />
                      </div>
                    )}
                    <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                      <span className="text-base font-medium text-gray-900">
                        Total
                      </span>
                      <PriceDisplay
                        price={parseFloat(selectedOrder.total_amount)}
                        size="lg"
                        className="font-bold text-gray-900"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Modal>

          {/* Return Request Modal */}
          <Modal
            isOpen={showReturnModal}
            onClose={() => {
              setShowReturnModal(false);
              setReturnReason("");
            }}
            title="Request Return"
          >
            <div className="space-y-4">
              <p className="text-gray-600">
                Please provide a reason for returning this order.
              </p>
              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Reason for return..."
                className="w-full h-32 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReturnModal(false);
                    setReturnReason("");
                  }}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRequestReturn}
                  disabled={!returnReason.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-300"
                >
                  Submit Request
                </Button>
              </div>
            </div>
          </Modal>
        </motion.div>
      </div>
    </div>
  );
};
