/* eslint-disable @typescript-eslint/no-explicit-any */
import { Edit, MoreHorizontal, Package, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";

interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  is_active: boolean;
  products_count?: number;
}

interface CategoryManagerProps {
  categories: Category[];
  onCreateCategory: (data: any) => Promise<void>;
  onUpdateCategory: (id: string, data: any) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  loading?: boolean;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  loading,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data: any) => {
    try {
      if (editingCategory) {
        await onUpdateCategory(editingCategory.id, data);
        setEditingCategory(null);
      } else {
        await onCreateCategory(data);
        setShowForm(false);
      }
      reset();
    } catch (error) {
      console.error("Failed to save category:", error);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowForm(true);
    reset({
      name: category.name,
      description: category.description,
      parent_id: category.parent_id,
      is_active: category.is_active,
    });
  };

  const handleDelete = async (category: Category) => {
    if (category.products_count && category.products_count > 0) {
      alert(
        `Cannot delete category "${category.name}" as it contains ${category.products_count} products.`
      );
      return;
    }

    if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
      await onDeleteCategory(category.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Categories</h2>
        <Button
          variant="primary"
          onClick={() => setShowForm(true)}
          disabled={showForm}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {showForm && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">
              {editingCategory ? "Edit Category" : "Create Category"}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Category Name *</span>
                  </label>
                  <Input
                    {...register("name", {
                      required: "Category name is required",
                    })}
                    placeholder="Enter category name"
                    className={errors.name ? "input-error" : ""}
                  />
                  {errors.name && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.name.message as string}
                      </span>
                    </label>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Parent Category</span>
                  </label>
                  <select
                    {...register("parent_id")}
                    className="select select-bordered"
                  >
                    <option value="">None (Root Category)</option>
                    {categories
                      .filter((cat) => cat.id !== editingCategory?.id)
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  {...register("description")}
                  className="textarea textarea-bordered"
                  placeholder="Enter category description"
                />
              </div>

              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Active Category</span>
                  <input
                    type="checkbox"
                    {...register("is_active")}
                    className="toggle toggle-primary"
                    defaultChecked={true}
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingCategory(null);
                    reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={loading}>
                  {editingCategory ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div key={category.id} className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="card-title">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-base-content/70 mt-1">
                      {category.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className={`badge ${
                        category.is_active ? "badge-success" : "badge-error"
                      }`}
                    >
                      {category.is_active ? "Active" : "Inactive"}
                    </div>
                    {category.products_count !== undefined && (
                      <div className="badge badge-ghost">
                        {category.products_count} products
                      </div>
                    )}
                  </div>
                </div>

                <div className="dropdown dropdown-end">
                  <Button variant="ghost" size="sm" shape="square">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                  <div className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-40">
                    <li>
                      <button onClick={() => handleEdit(category)}>
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleDelete(category)}
                        className="text-error"
                        disabled={
                          category.products_count && category.products_count > 0
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </li>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
          <h3 className="text-lg font-semibold text-base-content/70">
            No categories yet
          </h3>
          <p className="text-base-content/50">
            Create your first category to organize products
          </p>
        </div>
      )}
    </div>
  );
};
