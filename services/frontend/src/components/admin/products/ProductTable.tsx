/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Eye, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../ui/Button";
import { DataTable } from "../../ui/admin/DataTable";
import { BulkActionBar } from "./BulkActionBar";
// import { BulkActionBar } from "./BulkActionBar";

interface ProductTableProps {
  products: any[];
  loading: boolean;
  onEdit: (arg0: any) => void;
  onDelete: (arg0: any) => void;
  onBulkAction: (action: string, productIds: string[]) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  loading,
  onEdit,
  onDelete,
  onBulkAction,
}) => {
  const navigate = useNavigate();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const columns: ColumnDef<any>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          className="checkbox checkbox-sm"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => {
            table.toggleAllPageRowsSelected(e.target.checked);
            if (e.target.checked) {
              setSelectedProducts(products.map((p) => p.id));
            } else {
              setSelectedProducts([]);
            }
          }}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="checkbox checkbox-sm"
          checked={selectedProducts.includes(row.original.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedProducts([...selectedProducts, row.original.id]);
            } else {
              setSelectedProducts(
                selectedProducts.filter((id) => id !== row.original.id)
              );
            }
          }}
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: "Product",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.images?.[0] && (
            <div className="avatar">
              <div className="mask mask-squircle w-12 h-12">
                <img
                  src={row.original.images[0]}
                  alt={row.original.name}
                  className="object-cover"
                />
              </div>
            </div>
          )}
          <div>
            <div className="font-bold">{row.original.name}</div>
            <div className="text-sm opacity-50">{row.original.sku}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "category.name",
      header: "Category",
      cell: ({ row }) => (
        <div className="badge badge-ghost">{row.original.category?.name}</div>
      ),
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => (
        <div className="font-mono">
          ${row.original.price} {row.original.currency}
        </div>
      ),
    },
    {
      accessorKey: "stock_quantity",
      header: "Stock",
      cell: ({ row }) => (
        <div
          className={`badge ${
            row.original.stock_quantity > 10
              ? "badge-success"
              : row.original.stock_quantity > 0
              ? "badge-warning"
              : "badge-error"
          }`}
        >
          {row.original.stock_quantity}
        </div>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <div
          className={`badge ${
            row.original.is_active ? "badge-success" : "badge-error"
          }`}
        >
          {row.original.is_active ? "Active" : "Inactive"}
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.original.created_at).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="dropdown dropdown-end">
          <Button variant="ghost" size="sm" shape="square">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
          <div className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
            <li>
              <button
                onClick={() => navigate(`/products/${row.original.id}`)}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View
              </button>
            </li>
            <li>
              <button
                onClick={() => onEdit(row.original)}
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            </li>
            <li>
              <button
                onClick={() => onDelete(row.original)}
                className="flex items-center gap-2 text-error"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </li>
          </div>
        </div>
      ),
      enableHiding: false,
      enableSorting: false,
    },
  ];

  return (
    <div className="space-y-4">
      {selectedProducts.length > 0 && (
        <BulkActionBar
          selectedCount={selectedProducts.length}
          onAction={(action: any) => onBulkAction(action, selectedProducts)}
          onClear={() => setSelectedProducts([])}
        />
      )}

      <DataTable
        data={products}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search products..."
        onRowClick={(product) => navigate(`/admin/products/${product.id}`)}
      />
    </div>
  );
};
