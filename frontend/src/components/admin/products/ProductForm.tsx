/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { ImageUpload } from "./ImageUpload";

interface ProductFormData {
  name: string;
  description: string;
  brand: string;
  sku: string;
  price: number;
  currency: string;
  stock_quantity: number;
  category_id: string;
  images: string[];
  features: string[];
  specifications: Record<string, any>;
  is_active: boolean;
}

interface ProductFormProps {
  product?: any;
  categories: Array<{ id: string; name: string }>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  categories,
  onSubmit,
  onCancel,
  loading,
}) => {
  const [features, setFeatures] = useState<string[]>(product?.features || []);
  const [newFeature, setNewFeature] = useState("");
  const [specifications, setSpecifications] = useState(
    product?.specifications || {}
  );
  const [newSpecKey, setNewSpecKey] = useState("");
  const [newSpecValue, setNewSpecValue] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ProductFormData>({
    defaultValues: {
      name: "",
      description: "",
      brand: "",
      sku: "",
      price: 0,
      currency: "USD",
      stock_quantity: 0,
      category_id: "",
      images: [],
      features: [],
      specifications: {},
      is_active: true,
    },
  });

  const watchedImages = watch("images");

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description,
        brand: product.brand,
        sku: product.sku,
        price: product.price,
        currency: product.currency,
        stock_quantity: product.stock_quantity,
        category_id: product.category?.id || "",
        images: product.images || [],
        features: product.features || [],
        specifications: product.specifications || {},
        is_active: product.is_active,
      });
      setFeatures(product.features || []);
      setSpecifications(product.specifications || {});
    }
  }, [product, reset]);

  const addFeature = () => {
    if (newFeature.trim()) {
      const updatedFeatures = [...features, newFeature.trim()];
      setFeatures(updatedFeatures);
      setValue("features", updatedFeatures);
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    const updatedFeatures = features.filter((_, i) => i !== index);
    setFeatures(updatedFeatures);
    setValue("features", updatedFeatures);
  };

  const addSpecification = () => {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      const updatedSpecs = {
        ...specifications,
        [newSpecKey.trim()]: newSpecValue.trim(),
      };
      setSpecifications(updatedSpecs);
      setValue("specifications", updatedSpecs);
      setNewSpecKey("");
      setNewSpecValue("");
    }
  };

  const removeSpecification = (key: string) => {
    const updatedSpecs = { ...specifications };
    delete updatedSpecs[key];
    setSpecifications(updatedSpecs);
    setValue("specifications", updatedSpecs);
  };

  const onFormSubmit = async (data: ProductFormData) => {
    await onSubmit({
      ...data,
      features,
      specifications,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">Basic Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Product Name *</span>
              </label>
              <Input
                {...register("name", { required: "Product name is required" })}
                placeholder="Enter product name"
                className={errors.name ? "input-error" : ""}
              />
              {errors.name && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.name.message}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">SKU *</span>
              </label>
              <Input
                {...register("sku", { required: "SKU is required" })}
                placeholder="Enter SKU"
                className={errors.sku ? "input-error" : ""}
              />
              {errors.sku && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.sku.message}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Brand</span>
              </label>
              <Input {...register("brand")} placeholder="Enter brand name" />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Category *</span>
              </label>
              <select
                {...register("category_id", {
                  required: "Category is required",
                })}
                className={`select select-bordered ${
                  errors.category_id ? "select-error" : ""
                }`}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.category_id.message}
                  </span>
                </label>
              )}
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Description</span>
            </label>
            <textarea
              {...register("description")}
              className="textarea textarea-bordered h-24"
              placeholder="Enter product description"
            />
          </div>
        </div>
      </div>

      {/* Pricing & Inventory */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">Pricing & Inventory</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Price *</span>
              </label>
              <Input
                type="number"
                step="0.01"
                {...register("price", {
                  required: "Price is required",
                  min: { value: 0, message: "Price must be positive" },
                })}
                placeholder="0.00"
                className={errors.price ? "input-error" : ""}
              />
              {errors.price && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.price.message}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Currency</span>
              </label>
              <select
                {...register("currency")}
                className="select select-bordered"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Stock Quantity *</span>
              </label>
              <Input
                type="number"
                {...register("stock_quantity", {
                  required: "Stock quantity is required",
                  min: { value: 0, message: "Stock cannot be negative" },
                })}
                placeholder="0"
                className={errors.stock_quantity ? "input-error" : ""}
              />
              {errors.stock_quantity && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.stock_quantity.message}
                  </span>
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">Product Images</h3>
          <ImageUpload
            images={watchedImages}
            onChange={(images:any[]) => setValue("images", images)}
          />
        </div>
      </div>

      {/* Features */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">Features</h3>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Add a feature"
                className="flex-1"
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addFeature())
                }
              />
              <Button type="button" onClick={addFeature}>
                Add
              </Button>
            </div>

            <div className="space-y-2">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-base-200 rounded"
                >
                  <span className="flex-1">{feature}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFeature(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Specifications */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">Specifications</h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Input
                value={newSpecKey}
                onChange={(e) => setNewSpecKey(e.target.value)}
                placeholder="Specification name"
              />
              <div className="flex gap-2">
                <Input
                  value={newSpecValue}
                  onChange={(e) => setNewSpecValue(e.target.value)}
                  placeholder="Specification value"
                  className="flex-1"
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(), addSpecification())
                  }
                />
                <Button type="button" onClick={addSpecification}>
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {Object.entries(specifications).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center gap-2 p-2 bg-base-200 rounded"
                >
                  <span className="font-medium">{key}:</span>
                  <span className="flex-1">{value}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSpecification(key)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">Status</h3>

          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">Active Product</span>
              <input
                type="checkbox"
                {...register("is_active")}
                className="toggle toggle-primary"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={loading}>
          {product ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
};
