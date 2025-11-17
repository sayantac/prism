/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  FileText,
  ImagePlus,
  Package,
  Plus,
  Save,
  Sparkles,
  Tag,
  Trash2,
  Type,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { EmptyState } from "../../../components/common/EmptyState";
import { Pagination } from "../../../components/common/Pagination";
import { PriceDisplay } from "../../../components/common/PriceDisplay";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Loading } from "../../../components/ui/Loading";
import { Tabs } from "../../../components/ui/Tabs";
import toast from "react-hot-toast";
import {
  useCreateProductMutation,
  useGenerateProductContentMutation,
  useGetAdminProductsQuery,
  useGetProductCategoriesQuery,
  useUploadProductImageMutation,
} from "../../../store/api/adminApi";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose }) => {
  const [productForm, setProductForm] = useState({
    name: "",
    brand: "",
    sku: "",
    category: "",
    language: "English",
    price: "",
    compareAtPrice: "",
    stock: "",
    context: "",
  });

  const [contentDraft, setContentDraft] = useState({
    description: "",
    title: "",
    seoTitle: "",
    seoMeta: "",
    seoKeywords: "",
    descriptionBullets: [] as string[],
  });

  const [activeTab, setActiveTab] = useState("description");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [generateProductContent, { isLoading: isGenerating }] =
    useGenerateProductContentMutation();
  const { data: categoriesData, isLoading: isLoadingCategories } =
    useGetProductCategoriesQuery();
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [uploadProductImage] = useUploadProductImageMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const categoryOptions =
    categoriesData
      ?.filter((category) => category?.is_active !== false)
      .map((category) => ({
        label: category.name,
        value: category.id,
      })) ?? [];

  useEffect(() => {
    const urls = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  useEffect(() => {
    if (selectedFiles.length === 0) {
      if (activeImageIndex !== 0) {
        setActiveImageIndex(0);
      }
      return;
    }

    if (activeImageIndex > selectedFiles.length - 1) {
      setActiveImageIndex(selectedFiles.length - 1);
    }
  }, [selectedFiles, activeImageIndex]);

  if (!isOpen) {
    return null;
  }

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }

    setSelectedFiles((previous) => [...previous, ...files]);
    event.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    setSelectedFiles((previous) => previous.filter((_, idx) => idx !== index));
    setActiveImageIndex((previous) => {
      if (previous > index) {
        return previous - 1;
      }

      if (previous === index) {
        return Math.max(0, previous - 1);
      }

      return previous;
    });
  };

  const handleProductFormChange = (
    field: keyof typeof productForm,
    value: string
  ) => {
    setProductForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleContentDraftChange = (
    field: Exclude<keyof typeof contentDraft, "descriptionBullets">,
    value: string
  ) => {
    setContentDraft((previous) => ({
      ...previous,
      [field]: value,
    }));
  };
  function extractJsonFromString(input: string): any | null {
    const jsonRegex = /{[\s\S]*?}/g;
    const matches = input.match(jsonRegex);
    if (!matches) return null;

    for (const match of matches) {
      try {
        return JSON.parse(match); // return first valid JSON found
      } catch {
        continue;
      }
    }
    return null;
  }

  const handleGenerateAllContent = async () => {
    if (isGenerating) {
      return;
    }

    setGenerationError(null);

    try {
      const response = await generateProductContent({
        mode: "all",
        product: {
          name: productForm.name,
          brand: productForm.brand,
          sku: productForm.sku,
          category: productForm.category,
          context: productForm.context,
          language: productForm.language,
        },
        files: selectedFiles,
      }).unwrap();

      if (response?.status !== "ok") {
        setGenerationError(response?.message ?? "Generation failed. Please try again.");
        return;
      }

      const rawAnswer =
        typeof response?.rawAnswer === "string" ? response.rawAnswer.trim() : "";
      const content =
        (response?.content && typeof response.content === "object"
          ? response.content
          : {}) ?? {};
      const parsed = extractJsonFromString(rawAnswer);
      const resolvedContent = {
        ...(typeof content === "object" && content !== null ? content : {}),
        ...(parsed && typeof parsed === "object" ? parsed : {}),
      } as Record<string, any>;

      const descriptionText =
        typeof resolvedContent.description === "string"
          ? resolvedContent.description
          : "";

      const bulletsArray = Array.isArray(resolvedContent.bullets)
        ? resolvedContent.bullets
        : [];

      const combinedDescription = descriptionText
        ? descriptionText +
          (bulletsArray.length
            ? "\n\n" + bulletsArray.map((b: string) => `• ${b}`).join("\n")
            : "")
        : "";

      const titleValue =
        typeof resolvedContent.title === "string" ? resolvedContent.title : "";

      const seoTitleValue =
        typeof resolvedContent.seoTitle === "string" ? resolvedContent.seoTitle : "";

      const seoMetaValue =
        typeof resolvedContent.seoMeta === "string" ? resolvedContent.seoMeta : "";

      let seoKeywordsArray: string[] = [];
      if (Array.isArray(resolvedContent.seoKeywords)) {
        seoKeywordsArray = resolvedContent.seoKeywords as string[];
      } else if (typeof resolvedContent.seoKeywords === "string") {
        seoKeywordsArray = resolvedContent.seoKeywords
          .split(",")
          .map((keyword: string) => keyword.trim())
          .filter(Boolean);
      }

      setContentDraft((previous) => ({
        ...previous,
        description:
          combinedDescription.trim().length > 0
            ? combinedDescription
            : previous.description,
        descriptionBullets:
          bulletsArray.length > 0 ? bulletsArray : previous.descriptionBullets,
        title: titleValue.trim().length > 0 ? titleValue.trim() : previous.title,
        seoTitle:
          seoTitleValue.trim().length > 0 ? seoTitleValue.trim() : previous.seoTitle,
        seoMeta: seoMetaValue.trim().length > 0 ? seoMetaValue.trim() : previous.seoMeta,
        seoKeywords:
          seoKeywordsArray.length > 0
            ? seoKeywordsArray.map((keyword) => keyword.trim()).filter(Boolean).join(", ")
            : previous.seoKeywords,
      }));
    } catch (error: any) {
      const fallbackMessage =
        error?.data?.message ||
        error?.error ||
        (typeof error?.status === "number"
          ? `Generation failed with status ${error.status}.`
          : "Unable to generate content right now. Please try again.");
      setGenerationError(fallbackMessage);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting || isCreating) {
      return;
    }

    const trimmedName = productForm.name.trim();
    const trimmedSku = productForm.sku.trim();
  const priceValue = Number.parseFloat(productForm.price || "");
    const stockValue = Number.parseInt(productForm.stock || "0", 10);
    const descriptionValue = (contentDraft.description || "").trim()
      || productForm.context.trim();

    const validationErrors: string[] = [];

    if (!trimmedName) {
      validationErrors.push("Product name is required.");
    }

    if (!trimmedSku) {
      validationErrors.push("SKU / Code is required.");
    }

    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      validationErrors.push("Enter a valid price greater than zero.");
    }

    if (!descriptionValue) {
      validationErrors.push("Provide a description or generate one with AI.");
    }

    if (validationErrors.length > 0) {
      const message = validationErrors.join(" ");
      setFormError(message);
      toast.error(message);
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      let uploadedImageUrls: string[] = [];

      if (selectedFiles.length > 0) {
        const uploads = await Promise.all(
          selectedFiles.map(async (file) => {
            const result = await uploadProductImage(file).unwrap();
            return result.url;
          }),
        );
        uploadedImageUrls = uploads;
      }

      const keywordTags = contentDraft.seoKeywords
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean);

      const finalName = contentDraft.title.trim()
        ? contentDraft.title.trim()
        : trimmedName;

      const customFields: Record<string, unknown> = {};

      if (productForm.context.trim()) {
        customFields.brief = productForm.context.trim();
      }

      if (contentDraft.descriptionBullets.length > 0) {
        customFields.description_bullets = contentDraft.descriptionBullets;
      }

      if (productForm.language) {
        customFields.language = productForm.language;
      }

      if (trimmedName && finalName !== trimmedName) {
        customFields.seed_name = trimmedName;
      }

      if (productForm.brand.trim()) {
        customFields.brand_input = productForm.brand.trim();
      }

      customFields.ai_generated = true;
      customFields.generated_at = new Date().toISOString();

      const payload = {
        name: finalName,
        code: trimmedSku,
        brand: productForm.brand.trim() || undefined,
        category_id: productForm.category || undefined,
        price: priceValue.toFixed(2),
        description: descriptionValue,
        images: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
        stock_quantity: Number.isNaN(stockValue) ? 0 : Math.max(0, stockValue),
        in_stock: Number.isNaN(stockValue) ? true : stockValue > 0,
        meta_title: contentDraft.seoTitle.trim()
          ? contentDraft.seoTitle.trim()
          : finalName,
        meta_description: contentDraft.seoMeta.trim() || undefined,
        tags: keywordTags.length > 0 ? keywordTags : undefined,
        custom_fields:
          Object.keys(customFields).length > 0 ? customFields : undefined,
        config: {
          show_in_search: true,
          show_in_recommendations: true,
          reranking_priority: 0,
          is_sponsored: false,
          sponsored_priority: 0,
          featured: false,
          boost_factor: 1,
        },
      };

      await createProduct(payload).unwrap();

      toast.success("Product saved to catalog");

      setProductForm({
        name: "",
        brand: "",
        sku: "",
        category: "",
        language: "English",
        price: "",
        compareAtPrice: "",
        stock: "",
        context: "",
      });
      setContentDraft({
        description: "",
        title: "",
        seoTitle: "",
        seoMeta: "",
        seoKeywords: "",
        descriptionBullets: [],
      });
      setSelectedFiles([]);
      setActiveImageIndex(0);
      onClose();
    } catch (error: any) {
      const message =
        error?.data?.detail ||
        error?.message ||
        "Failed to save product. Please try again.";
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextImage = () => {
    if (selectedFiles.length <= 1) {
      return;
    }

    setActiveImageIndex((previous) =>
      previous + 1 > selectedFiles.length - 1 ? 0 : previous + 1
    );
  };

  const handlePrevImage = () => {
    if (selectedFiles.length <= 1) {
      return;
    }

    setActiveImageIndex((previous) =>
      previous - 1 < 0 ? selectedFiles.length - 1 : previous - 1
    );
  };

  const contentTabs = [
    { id: "description", label: "Description", icon: <FileText className="w-4 h-4" /> },
    { id: "title", label: "Title", icon: <Type className="w-4 h-4" /> },
    { id: "seo", label: "SEO", icon: <Tag className="w-4 h-4" /> },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex min-h-full items-start justify-center overflow-y-auto bg-black/50 backdrop-blur px-4 py-6 sm:items-center sm:px-6 sm:py-10"
      onClick={onClose}
    >
      <div
        className="card relative w-full max-w-5xl overflow-hidden bg-base-100 shadow-2xl max-h-[calc(100vh-3rem)] h-full"
        onClick={(event) => event.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex h-full max-h-full flex-col">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-base-200 px-6 py-5 mb-2">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-base-content">
                Product Content Builder
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={<Save className="w-4 h-4" />}
              >
                Save draft
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={<Share2 className="w-4 h-4" />}
              >
                Share
              </Button> */}
              <Button
                type="button"
                variant="ghost"
                shape="circle"
                size="sm"
                onClick={onClose}
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-5 space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-base-content">
                        Item Details
                      </h3>
                      <p className="text-sm text-base-content/70">
                        Provide the essentials that anchor the generated content.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    <Input
                      label="Product Name"
                      placeholder="Wireless noise-cancelling headphones"
                      value={productForm.name}
                      onChange={(event) =>
                        handleProductFormChange("name", event.target.value)
                      }
                    />
                    <Input
                      label="Brand"
                      placeholder="Acme Audio"
                      value={productForm.brand}
                      onChange={(event) =>
                        handleProductFormChange("brand", event.target.value)
                      }
                    />
                    <Input
                      label="SKU / Code"
                      placeholder="SKU-12345"
                      value={productForm.sku}
                      onChange={(event) =>
                        handleProductFormChange("sku", event.target.value)
                      }
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="label">
                          <span className="label-text text-base-content font-medium">
                            Category
                          </span>
                        </label>
                        <select
                          className="select select-bordered w-full"
                          value={productForm.category}
                          onChange={(event) =>
                            handleProductFormChange("category", event.target.value)
                          }
                        >
                          <option value="">Select category</option>
                          {categoryOptions.length > 0 ? (
                            categoryOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))
                          ) : (
                            <option value="" disabled>
                              {isLoadingCategories
                                ? "Loading categories..."
                                : "No categories available"}
                            </option>
                          )}
                        </select>
                      </div>
                      <Input
                        label="Price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="199.99"
                        value={productForm.price}
                        onChange={(event) =>
                          handleProductFormChange("price", event.target.value)
                        }
                      />
                    </div>

                    <Input
                      label="Stock Quantity"
                      type="number"
                      min="0"
                      placeholder="50"
                      value={productForm.stock}
                      onChange={(event) =>
                        handleProductFormChange("stock", event.target.value)
                      }
                    />

                    <div>
                      <label className="label">
                        <span className="label-text text-base-content font-medium">
                          Product Narrative
                        </span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered w-full min-h-[140px]"
                        placeholder="Key product highlights, use cases, or technical specifications"
                        value={productForm.context}
                        onChange={(event) =>
                          handleProductFormChange("context", event.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>

              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm">
                  <div className="mb-4 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={<ImagePlus className="w-4 h-4" />}
                      onClick={openFileDialog}
                    >
                      Add images
                    </Button>
                  </div>

                  <div className="relative h-[360px] w-full">
                    {previewUrls.length === 0 ? (
                      <button
                        type="button"
                        onClick={openFileDialog}
                        className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-base-300 bg-base-200/30 text-center text-base-content/70 transition hover:border-primary/70 hover:text-primary"
                      >
                        <ImagePlus className="h-10 w-10" />
                        <div className="space-y-1">
                          <p className="text-base font-medium">
                            Drop product imagery or browse files
                          </p>
                          <p className="text-sm">
                            Recommended: 1200 × 1200px, PNG or JPG
                          </p>
                        </div>
                      </button>
                    ) : (
                      <div className="relative h-full w-full overflow-hidden rounded-xl border border-dashed border-base-300 bg-base-200/40">
                        <img
                          src={previewUrls[activeImageIndex]}
                          alt={`Product preview ${activeImageIndex + 1}`}
                          className="h-full w-full object-cover"
                        />

                        <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-black/40 px-4 py-2 text-sm text-white">
                          <span>
                            {activeImageIndex + 1} / {previewUrls.length}
                          </span>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              shape="circle"
                              size="sm"
                              className="text-white/80 hover:text-white"
                              onClick={() => handleRemoveImage(activeImageIndex)}
                              aria-label="Remove image"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {previewUrls.length > 1 && (
                          <>
                            <button
                              type="button"
                              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-base-100/80 p-2 text-base-content shadow-md transition hover:bg-base-100"
                              onClick={handlePrevImage}
                              aria-label="Previous image"
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                              type="button"
                              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-base-100/80 p-2 text-base-content shadow-md transition hover:bg-base-100"
                              onClick={handleNextImage}
                              aria-label="Next image"
                            >
                              <ChevronRight className="h-5 w-5" />
                            </button>
                          </>
                        )}

                        {previewUrls.length > 1 && (
                          <div className="absolute inset-x-4 bottom-4 flex gap-3 overflow-x-auto rounded-lg bg-base-100/80 p-2">
                            {previewUrls.map((url, index) => (
                              <button
                                type="button"
                                key={`${url}-${index}`}
                                onClick={() => setActiveImageIndex(index)}
                                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border ${activeImageIndex === index
                                  ? "border-primary"
                                  : "border-transparent"
                                  }`}
                                aria-label={`Show image ${index + 1}`}
                              >
                                <img
                                  src={url}
                                  alt={`Thumbnail ${index + 1}`}
                                  className="h-full w-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm">
              <div className="flex items-center gap-6">
                <div className="w-[340px]">
                  <Tabs
                    tabs={contentTabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    variant="lifted"
                  />
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  icon={<Sparkles className="w-4 h-4" />}
                  onClick={handleGenerateAllContent}
                  loading={isGenerating}
                  disabled={isGenerating}
                >
                  Generate
                </Button>
              </div>

              {generationError && (
                <p className="mt-2 text-sm text-error">{generationError}</p>
              )}

              <div className="mt-4 space-y-4">
                {activeTab === "description" && (
                  <div className="space-y-4">
                    <textarea
                      className="textarea textarea-bordered w-full min-h-[220px]"
                      placeholder="Draft a compelling, benefit-driven product story highlighting differentiators."
                      value={contentDraft.description}
                      onChange={(event) =>
                        handleContentDraftChange("description", event.target.value)
                      }
                    />
                  </div>
                )}

                {activeTab === "title" && (
                  <div className="space-y-4">
                    <Input
                      placeholder="UltraClear Pro ANC Wireless Headphones"
                      value={contentDraft.title}
                      onChange={(event) =>
                        handleContentDraftChange("title", event.target.value)
                      }
                    />
                  </div>
                )}

                {activeTab === "seo" && (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Input
                        label="Title Tag"
                        placeholder="UltraClear Pro ANC Headphones | 35hr Battery"
                        value={contentDraft.seoTitle}
                        onChange={(event) =>
                          handleContentDraftChange("seoTitle", event.target.value)
                        }
                      />
                      <Input
                        label="Keywords"
                        placeholder="wireless headphones, noise cancelling, long battery life"
                        value={contentDraft.seoKeywords}
                        onChange={(event) =>
                          handleContentDraftChange("seoKeywords", event.target.value)
                        }
                      />
                    </div>

                    <div>
                      <label className="label">
                        <span className="label-text text-base-content font-medium">
                          Meta Description
                        </span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered w-full min-h-[140px]"
                        placeholder="Experience studio-grade sound, adaptive ANC, and 35 hours of battery life with our flagship wireless headphones."
                        value={contentDraft.seoMeta}
                        onChange={(event) =>
                          handleContentDraftChange("seoMeta", event.target.value)
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {formError && (
            <div className="px-6">
              <p className="text-sm text-error">{formError}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-base-200 px-6 py-5">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Save className="w-4 h-4" />}
              loading={isSubmitting || isCreating}
              disabled={isSubmitting || isCreating}
            >
              Save Product
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AdminProducts: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data: productsData, isLoading } = useGetAdminProductsQuery({
    page: currentPage,
    page_size: 20,
    search_term: searchQuery || undefined,
    category: categoryFilter || undefined,
  });
  const { data: adminCategories } = useGetProductCategoriesQuery();
  const categoryFilterOptions =
    adminCategories
      ?.filter((category) => category?.is_active !== false)
      .map((category) => ({
        label: category.name,
        value: category.id,
      })) ?? [];
  const products = productsData?.items || [];
  const totalPages = productsData?.pages || 1;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <>
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-base-content">Products</h1>
            <p className="text-base-content/70 mt-1">
              Manage your product catalouge
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="w-5 h-5" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Product
          </Button>
        </div>

        {/* Filters */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="form-control flex-1">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="input input-bordered"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="form-control">
                <select
                  className="select select-bordered"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categoryFilterOptions.length > 0 ? (
                    categoryFilterOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      {adminCategories ? "No categories available" : "Loading categories..."}
                    </option>
                  )}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        {products.length > 0 ? (
          <div className="card bg-base-100 shadow-xl">
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product: any) => (
                    <tr key={product.id}>
                      <td>
                        <div className="flex items-center space-x-3">
                          <div className="avatar">
                            <div className="mask mask-squircle w-12 h-12">
                              <img
                                src={
                                  product.images?.[0] || "/api/placeholder/50/50"
                                }
                                alt={product.name}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="font-bold">{product.name}</div>
                            <div className="text-sm opacity-50">
                              {product.code}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <PriceDisplay price={product.price} />
                      </td>
                      <td>{product.stock_quantity || 0} units</td>
                      <td>
                        <Badge variant={product.is_active ? "success" : "error"}>
                          {product.is_active ? "Active" : "Inactive"}
                        </Badge>
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
                            icon={<Edit className="w-4 h-4" />}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 className="w-4 h-4" />}
                            className="text-error"
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
            icon={<Package className="w-20 h-20 text-base-content/30" />}
            title="No products found"
            description="Start by adding your first product to the catalog."
            action={{
              label: "Add Product",
              onClick: () => console.log("Add product"),
            }}
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
    </>
  );
};
