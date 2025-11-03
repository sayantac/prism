/* eslint-disable @typescript-eslint/no-explicit-any */
import { Eye, Package, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "../../components/common/EmptyState";
import { Pagination } from "../../components/common/Pagination";
import { PriceDisplay } from "../../components/common/PriceDisplay";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Loading } from "../../components/ui/Loading";
import { useGetAdminOrdersQuery } from "../../store/api/adminApi";

export const AdminOrders: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const { data: ordersData, isLoading } = useGetAdminOrdersQuery({
    page: currentPage,
    page_size: 20,
    status: statusFilter || undefined,
  });

  const orders = ordersData?.items || [];
  const totalPages = ordersData?.pages || 1;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Orders</h1>
          <p className="text-base-content/70 mt-1">
            Manage and track customer orders
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="form-control">
              <select
                className="select select-bordered"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Orders</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {orders.length > 0 ? (
        <div className="card bg-base-100 shadow-xl">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: any) => (
                  <tr key={order.id}>
                    <td>
                      <div>
                        <div className="font-bold">#{order.order_number}</div>
                        <div className="text-sm opacity-50">
                          {order.payment_method}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="font-medium">
                          {order.customer_name || "Customer"}
                        </div>
                        <div className="text-sm opacity-50">
                          {order.customer_email}
                        </div>
                      </div>
                    </td>
                    <td>
                      <PriceDisplay price={order.total_amount || 0} />
                    </td>
                    <td>
                      <Badge
                        variant={
                          order.status === "delivered"
                            ? "success"
                            : order.status === "shipped"
                            ? "info"
                            : order.status === "cancelled"
                            ? "error"
                            : "warning"
                        }
                      >
                        {order.status || "pending"}
                      </Badge>
                    </td>
                    <td>
                      {new Date(
                        order.created_at || Date.now()
                      ).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Eye className="w-4 h-4" />}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Package className="w-4 h-4" />}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<ShoppingCart className="w-20 h-20 text-base-content/30" />}
          title="No orders found"
          description="No orders match your current filters."
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};
