/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BarChart3,
  Eye,
  MousePointer,
  Package,
  Percent,
  Play,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "@/hooks";
const AdBannerPortal = () => {
  const [activeTab, setActiveTab] = useState("create");
  const [banners, setBanners] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedSegment, setSelectedSegment] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [dealType, setDealType] = useState("discount");
  const [dealData, setDealData] = useState<any>({});
  const [generatedBanner, setGeneratedBanner] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerDescription, setBannerDescription] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Your specific segments data
  const userSegments = [
    {
      id: "New_Customers",
      name: "New Customers",
      user_count: 182,
      avg_order_value: 171.3,
      conversion_rate: 154.4,
      revenue_contribution: 48136.12,
    },
    {
      id: "Young Adults",
      name: "Young Adults",
      user_count: 100,
      avg_order_value: 163.53,
      conversion_rate: 233.0,
      revenue_contribution: 38103.04,
    },
    {
      id: "High Value Customers",
      name: "High Value Customers",
      user_count: 50,
      avg_order_value: 301.45,
      conversion_rate: 354.0,
      revenue_contribution: 53356.64,
    },
    {
      id: "Electronics_Enthusiasts",
      name: "Electronics Enthusiasts",
      user_count: 36,
      avg_order_value: 292.72,
      conversion_rate: 366.67,
      revenue_contribution: 38638.9,
    },
  ];

  // API integration functions using the correct search endpoint
  const { token } = useAuth();
  const fetchProducts = async (search = "", page = 1, pageSize = 20) => {
    setIsLoadingProducts(true);
    try {
      const queryParams = new URLSearchParams({
        q: search,
        page: page.toString(),
        page_size: pageSize.toString(),
        sort: "relevance",
      });

      const response = await fetch(
        `http://localhost:8000/api/v1/search/?${queryParams}`,
        {
          headers: {
            Accept: "*/*",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setProducts(data.products || []);
      } else {
        console.error("Failed to fetch products:", data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const generateBannerContent = async () => {
    setIsGenerating(true);
    try {
      const requestData = {
        target_segment: selectedSegment,
        deal_type: dealType,
        deal_data: dealData,
        ...(selectedProduct && { product_id: selectedProduct }),
      };

      const response = await fetch(
        "http://localhost:8000/api/v1/admin/banners/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setGeneratedBanner(data);
        setBannerTitle(data.suggested_title);
        setShowPreview(true);
        toast.success("Banner content generated successfully!");
      }
    } catch (error) {
      console.error("Error generating banner:", error);
      alert("Error generating banner");
    } finally {
      setIsGenerating(false);
    }
  };

  const createBannerWithGeneration = async () => {
    try {
      const bannerData = {
        title: bannerTitle,
        description: bannerDescription,
        target_segment: selectedSegment,
        deal_type: dealType,
        deal_data: JSON.stringify(dealData),
        banner_text: generatedBanner?.banner_text,
        call_to_action: generatedBanner?.call_to_action,
        start_time: startTime || null,
        end_time: endTime || null,
        ...(selectedProduct && { product_id: selectedProduct }),
      };

      const response = await fetch(
        "http://localhost:8000/api/v1/admin/banners/create-with-generation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(bannerData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Banner created successfully!");
        resetForm();
        fetchBanners();
      }
      //   } else {
      //     alert("Failed to create banner: " + data.detail);
      //   }
    } catch (error) {
      console.error("Error creating banner:", error);
      alert("Error creating banner");
    }
  };

  const fetchBanners = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/v1/admin/banners",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();

      if (response.ok) {
        setBanners(data.banners || []);
      }
    } catch (error) {
      console.error("Error fetching banners:", error);
    }
  };

  const publishBanner = async (bannerId: any) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/admin/banners/${bannerId}/publish`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            start_time: null,
            end_time: null,
          }),
        }
      );

      if (response.ok) {
        alert("Banner published successfully!");
        fetchBanners();
      } else {
        alert("Banner published successfully!");
      }
    } catch (error) {
      console.error("Error publishing banner:", error);
    }
  };

  const regenerateImage = async (bannerId: any) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/admin/banners/${bannerId}/regenerate-image`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        alert("Image regenerated successfully!");
        fetchBanners();
      } else {
        alert("Failed to regenerate image");
      }
    } catch (error) {
      console.error("Error regenerating image:", error);
    }
  };

  const deleteBanner = async (bannerId: any) => {
    if (confirm("Are you sure you want to delete this banner?")) {
      try {
        const response = await fetch(
          `http://localhost:8000/api/v1/admin/banners/${bannerId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          toast.success("Banner deleted successfully!");
        } 
        fetchBanners();
      } catch (error) {
        console.error("Error deleting banner:", error);
      }
    }
  };

  const resetForm = () => {
    setSelectedSegment("");
    setSelectedProduct("");
    setDealType("discount");
    setDealData({});
    setGeneratedBanner(null);
    setShowPreview(false);
    setBannerTitle("");
    setBannerDescription("");
    setStartTime("");
    setEndTime("");
  };

  // Load initial data
  useEffect(() => {
    fetchProducts();
    fetchBanners();
  }, []);

  // Load products when search changes
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchProducts(productSearch);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [productSearch]);

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="navbar   border-b border-base-300">
        <div className="navbar-start">
          <h1 className="text-2xl font-bold text-base-content">
            Personalized Banner Ad Content Generation
          </h1>
        </div>
        <div className="navbar-end">
          <div className="tabs tabs-boxed">
            <button
              onClick={() => setActiveTab("create")}
              className={`tab gap-2 ${
                activeTab === "create" ? "tab-active" : ""
              }`}
            >
              <Plus className="w-4 h-4" />
              Create Banner
            </button>
            <button
              onClick={() => setActiveTab("manage")}
              className={`tab gap-2 ${
                activeTab === "manage" ? "tab-active" : ""
              }`}
            >
              <Settings className="w-4 h-4" />
              Manage Banners
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`tab gap-2 ${
                activeTab === "analytics" ? "tab-active" : ""
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Create Banner Tab */}
        {activeTab === "create" && (
          <div className="space-y-8">
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-xl mb-6">Create New Banner</h2>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        Banner Title
                      </span>
                    </label>
                    <input
                      type="text"
                      value={bannerTitle}
                      onChange={(e) => setBannerTitle(e.target.value)}
                      className="input input-bordered w-full"
                      placeholder="Enter banner title"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        Description
                      </span>
                    </label>
                    <input
                      type="text"
                      value={bannerDescription}
                      onChange={(e) => setBannerDescription(e.target.value)}
                      className="input input-bordered w-full"
                      placeholder="Banner description"
                    />
                  </div>
                </div>

                {/* User Segment Selection */}
                <div className="mb-6">
                  <label className="label">
                    <span className="label-text font-medium">
                      Select Target Segment
                    </span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {userSegments.map((segment) => (
                      <div
                        key={segment.id}
                        onClick={() => setSelectedSegment(segment.id)}
                        className={`card bg-base-100 border-2 cursor-pointer transition-all hover:shadow-md ${
                          selectedSegment === segment.id
                            ? "border-primary bg-primary/5"
                            : "border-base-300 hover:border-primary/50"
                        }`}
                      >
                        <div className="card-body p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Users className="w-5 h-5 text-primary" />
                            <div className="badge badge-success">
                              {segment.user_count} users
                            </div>
                          </div>
                          <h3 className="font-medium text-base-content mb-2">
                            {segment.name}
                          </h3>
                          <div className="text-xs text-base-content/70 space-y-1">
                            <div>
                              AOV: ${segment.avg_order_value.toFixed(2)}
                            </div>
                            <div>
                              Conv: {segment.conversion_rate.toFixed(1)}%
                            </div>
                            <div>
                              Revenue: $
                              {segment.revenue_contribution.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deal Type Selection */}
                <div className="mb-6">
                  <label className="label">
                    <span className="label-text font-medium">
                      Campaign Type
                    </span>
                  </label>
                  <br className="m-2" />
                  <div className="join">
                    <button
                      onClick={() => setDealType("discount")}
                      className={`btn join-item ${
                        dealType === "discount" ? "btn-primary" : "btn-outline"
                      }`}
                    >
                      <Percent className="w-4 h-4 mr-2" />
                      Discount Deal
                    </button>
                    <button
                      onClick={() => setDealType("product")}
                      className={`btn join-item ${
                        dealType === "product" ? "btn-primary" : "btn-outline"
                      }`}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Product Showcase
                    </button>
                    <button
                      onClick={() => setDealType("promotion")}
                      className={`btn join-item ${
                        dealType === "promotion" ? "btn-primary" : "btn-outline"
                      }`}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Special Promotion
                    </button>
                  </div>
                </div>

                {/* Product Selection */}
                {(dealType === "product" || dealType === "discount") && (
                  <div className="mb-6">
                    <label className="label">
                      <span className="label-text font-medium">
                        Select Product (Optional)
                      </span>
                    </label>
                    <div className="form-control mb-4">
                      <div className="input-group">
                        {/* <span className="bg-base-200">
                          <Search className="w-4 h-4" />
                        </span> */}
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="input input-bordered w-full"
                          placeholder="Search products..."
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto border border-base-300 rounded-lg bg-base-100">
                      {isLoadingProducts ? (
                        <div className="p-4 text-center">
                          <span className="loading loading-spinner loading-md"></span>
                          <div className="text-base-content/70 mt-2">
                            Loading products...
                          </div>
                        </div>
                      ) : products.length > 0 ? (
                        products.map((product: any) => (
                          <div
                            key={product.id}
                            onClick={() => setSelectedProduct(product.id)}
                            className={`p-3 border-b border-base-200 cursor-pointer hover:bg-base-200 transition-colors ${
                              selectedProduct === product.id
                                ? "bg-primary/10 border-primary"
                                : ""
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-medium text-base-content">
                                  {product.name}
                                </h4>
                                <p className="text-sm text-base-content/70">
                                  {product.category?.name}
                                </p>
                              </div>
                              <div className="badge badge-primary">
                                ${product.price}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-base-content/70">
                          No products found
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Deal Data Input */}
                {dealType === "discount" && (
                  <div className="mb-6">
                    <label className="label">
                      <span className="label-text font-medium">
                        Discount Details
                      </span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control">
                        <input
                          type="number"
                          placeholder="Discount percentage"
                          value={dealData.discount || ""}
                          onChange={(e) =>
                            setDealData({
                              ...dealData,
                              discount: e.target.value,
                            })
                          }
                          className="input input-bordered"
                        />
                      </div>
                      <div className="form-control">
                        <input
                          type="text"
                          placeholder="Product name (if specific)"
                          value={dealData.product_name || ""}
                          onChange={(e) =>
                            setDealData({
                              ...dealData,
                              product_name: e.target.value,
                            })
                          }
                          className="input input-bordered"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {dealType === "promotion" && (
                  <div className="mb-6">
                    <label className="label">
                      <span className="label-text font-medium">
                        Promotion Details
                      </span>
                    </label>
                    <div className="form-control">
                      <input
                        type="text"
                        placeholder="Promotion name"
                        value={dealData.promotion_name || ""}
                        onChange={(e) =>
                          setDealData({
                            ...dealData,
                            promotion_name: e.target.value,
                          })
                        }
                        className="input input-bordered"
                      />
                    </div>
                  </div>
                )}

                {/* Scheduling */}
                <div className="mb-6">
                  <label className="label">
                    <span className="label-text font-medium">
                      Schedule (Optional)
                    </span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text-alt">Start Time</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="input input-bordered"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text-alt">End Time</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="input input-bordered"
                      />
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <div className="card-actions justify-center">
                  <button
                    onClick={generateBannerContent}
                    disabled={!selectedSegment || isGenerating}
                    className="btn btn-primary btn-lg gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Generating with Google Imagen 4.0...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Generate Banner
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Preview Section */}
            {showPreview && generatedBanner && (
              <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="card-title">Banner Preview</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={generateBannerContent}
                        className="btn btn-warning gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Regenerate
                      </button>
                      <button
                        onClick={createBannerWithGeneration}
                        className="btn btn-success gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Create Banner
                      </button>
                    </div>
                  </div>

                  {/* Generated Banner Display */}
                  <div className="border-2 border-dashed border-base-300 rounded-lg p-8 text-center bg-base-200">
                    {generatedBanner.design_suggestions?.image_base64 ? (
                      <div className="space-y-4">
                        <img
                          src={`data:image/png;base64,${generatedBanner.design_suggestions.image_base64}`}
                          alt="Generated Banner"
                          className="mx-auto max-w-full h-auto rounded-lg shadow-lg"
                          style={{ aspectRatio: "9/6" }}
                        />
                        <div className="text-sm text-base-content/70">
                          Generated with Google Imagen 4.0 Ultra (9:6 aspect
                          ratio)
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-full h-64 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center text-primary-content">
                          <div className="text-center">
                            <h3 className="text-2xl font-bold mb-2">
                              {generatedBanner.banner_text}
                            </h3>
                            <button className="btn btn-outline btn-sm">
                              {generatedBanner.call_to_action}
                            </button>
                          </div>
                        </div>
                        {generatedBanner.design_suggestions?.error && (
                          <div className="alert alert-error">
                            <span>
                              Image generation failed:{" "}
                              {generatedBanner.design_suggestions.error}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Banner Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="card bg-base-200">
                      <div className="card-body p-4">
                        <h4 className="card-title text-sm">Banner Text</h4>
                        <p className="text-base-content/80">
                          {generatedBanner.banner_text}
                        </p>
                      </div>
                    </div>
                    <div className="card bg-base-200">
                      <div className="card-body p-4">
                        <h4 className="card-title text-sm">Call to Action</h4>
                        <p className="text-base-content/80">
                          {generatedBanner.call_to_action}
                        </p>
                      </div>
                    </div>
                    <div className="card bg-base-200">
                      <div className="card-body p-4">
                        <h4 className="card-title text-sm">Target Segment</h4>
                        <p className="text-base-content/80">
                          {selectedSegment}
                        </p>
                      </div>
                    </div>
                  </div>

                  {generatedBanner.design_suggestions?.prompt_used && (
                    <div className="collapse collapse-arrow bg-base-200 mt-4">
                      <input type="checkbox" />
                      <div className="collapse-title text-sm font-medium">
                        View AI Prompt Used
                      </div>
                      <div className="collapse-content">
                        <div className="text-xs text-base-content/70 bg-base-300 p-3 rounded">
                          {generatedBanner.design_suggestions.prompt_used}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manage Banners Tab */}
        {activeTab === "manage" && (
          <div className="space-y-6">
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title border-b border-base-300 pb-4 mb-6">
                  Manage Banners
                </h2>
                {banners.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-base-content/40 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-base-content mb-2">
                      No banners yet
                    </h3>
                    <p className="text-base-content/70 mb-4">
                      Create your first banner to get started.
                    </p>
                    <button
                      onClick={() => setActiveTab("create")}
                      className="btn btn-primary"
                    >
                      Create Banner
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {banners.map((banner: any) => (
                      <div
                        key={banner.id}
                        className="card bg-base-200 border border-base-300"
                      >
                        <div className="card-body p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-4">
                                {banner.image_url && (
                                  <div className="avatar">
                                    <div className="w-24 h-16 rounded">
                                      <img
                                        src={`http://localhost:8001${banner.image_url}`}
                                        alt={banner.title}
                                        className="object-cover"
                                      />
                                    </div>
                                  </div>
                                )}
                                <div>
                                  <h3 className="font-medium text-base-content">
                                    {banner.title}
                                  </h3>
                                  <p className="text-sm text-base-content/70">
                                    {banner.description}
                                  </p>
                                  <div className="flex items-center space-x-4 mt-2">
                                    <div className="badge badge-outline gap-1">
                                      <Users className="w-3 h-3" />
                                      {banner.target_segment}
                                    </div>
                                    <div className="badge badge-outline gap-1">
                                      <Eye className="w-3 h-3" />
                                      {banner.impression_count} views
                                    </div>
                                    <div className="badge badge-outline gap-1">
                                      <MousePointer className="w-3 h-3" />
                                      {banner.click_count} clicks
                                    </div>
                                    <div
                                      className={`badge gap-1 ${
                                        banner.status === "published"
                                          ? "badge-success"
                                          : banner.status === "draft"
                                          ? "badge-warning"
                                          : "badge-neutral"
                                      }`}
                                    >
                                      {banner.status}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {banner.status === "draft" && (
                                <button
                                  onClick={() => publishBanner(banner.id)}
                                  className="btn btn-success btn-sm gap-1"
                                >
                                  <Play className="w-3 h-3" />
                                  Publish
                                </button>
                              )}
                              <button
                                onClick={() => regenerateImage(banner.id)}
                                className="btn btn-primary btn-sm gap-1"
                              >
                                <RefreshCw className="w-3 h-3" />
                                Regenerate
                              </button>
                              <button
                                onClick={() => deleteBanner(banner.id)}
                                className="btn btn-error btn-sm gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {userSegments.map((segment: any) => {
                const segmentBanners = banners.filter(
                  (b: any) => b.target_segment === segment.id
                );
                const totalImpressions = segmentBanners.reduce(
                  (sum, b: any) => sum + b.impression_count,
                  0
                );
                const totalClicks = segmentBanners.reduce(
                  (sum, b: any) => sum + b.click_count,
                  0
                );
                const ctr =
                  totalImpressions > 0
                    ? ((totalClicks / totalImpressions) * 100).toFixed(2)
                    : "0.00";

                return (
                  <div key={segment.id} className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="card-title text-base">{segment.name}</h3>
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-base-content/70">
                            Active Banners:
                          </span>
                          <div className="badge badge-primary">
                            {
                              segmentBanners.filter((b: any) => b.is_active)
                                .length
                            }
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-base-content/70">
                            Total Impressions:
                          </span>
                          <span className="font-semibold text-info">
                            {totalImpressions.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-base-content/70">
                            Total Clicks:
                          </span>
                          <span className="font-semibold text-warning">
                            {totalClicks.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-base-content/70">
                            CTR:
                          </span>
                          <div className="badge badge-success">{ctr}%</div>
                        </div>
                        <div className="divider my-2"></div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-base-content/70">
                            Segment Size:
                          </span>
                          <span className="font-medium">
                            {segment.user_count} users
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-base-content/70">
                            AOV:
                          </span>
                          <span className="font-medium text-success">
                            ${segment.avg_order_value.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Overall Analytics */}
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h3 className="card-title mb-6">Overall Performance</h3>
                <div className="stats stats-vertical lg:stats-horizontal shadow">
                  <div className="stat">
                    <div className="stat-figure text-primary">
                      <Package className="w-8 h-8" />
                    </div>
                    <div className="stat-title">Total Banners</div>
                    <div className="stat-value text-primary">
                      {banners.length}
                    </div>
                    <div className="stat-desc">All created banners</div>
                  </div>

                  <div className="stat">
                    <div className="stat-figure text-success">
                      <Play className="w-8 h-8" />
                    </div>
                    <div className="stat-title">Published</div>
                    <div className="stat-value text-success">
                      {
                        banners.filter((b: any) => b.status === "published")
                          .length
                      }
                    </div>
                    <div className="stat-desc">Currently active</div>
                  </div>

                  <div className="stat">
                    <div className="stat-figure text-info">
                      <Eye className="w-8 h-8" />
                    </div>
                    <div className="stat-title">Total Impressions</div>
                    <div className="stat-value text-info">
                      {banners
                        .reduce((sum, b: any) => sum + b.impression_count, 0)
                        .toLocaleString()}
                    </div>
                    <div className="stat-desc">Banner views</div>
                  </div>

                  <div className="stat">
                    <div className="stat-figure text-warning">
                      <MousePointer className="w-8 h-8" />
                    </div>
                    <div className="stat-title">Total Clicks</div>
                    <div className="stat-value text-warning">
                      {banners
                        .reduce((sum, b: any) => sum + b.click_count, 0)
                        .toLocaleString()}
                    </div>
                    <div className="stat-desc">User interactions</div>
                  </div>
                </div>

                {/* Performance Chart Placeholder */}
                <div className="mt-8">
                  <h4 className="text-lg font-semibold mb-4">
                    Performance Trends
                  </h4>
                  <div className="card bg-base-200 border-2 border-dashed border-base-300">
                    <div className="card-body text-center py-12">
                      <BarChart3 className="w-12 h-12 text-base-content/40 mx-auto mb-4" />
                      <p className="text-base-content/70">
                        Performance charts coming soon
                      </p>
                      <p className="text-sm text-base-content/50">
                        Integration with analytics dashboard in development
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdBannerPortal;
// /* eslint-disable @typescript-eslint/no-explicit-any */
// import {
//   BarChart3,
//   Eye,
//   MousePointer,
//   Package,
//   Percent,
//   Play,
//   Plus,
//   RefreshCw,
//   Search,
//   Settings,
//   Trash2,
//   Users,
// } from "lucide-react";
// import { useEffect, useState } from "react";

// const AdBannerPortal = () => {
//   const [activeTab, setActiveTab] = useState("create");
//   const [banners, setBanners] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [selectedSegment, setSelectedSegment] = useState("");
//   const [selectedProduct, setSelectedProduct] = useState("");
//   const [dealType, setDealType] = useState("discount");
//   const [dealData, setDealData] = useState<any>({});
//   const [generatedBanner, setGeneratedBanner] = useState<any>(null);
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [showPreview, setShowPreview] = useState(false);
//   const [startTime, setStartTime] = useState("");
//   const [endTime, setEndTime] = useState("");
//   const [bannerTitle, setBannerTitle] = useState("");
//   const [bannerDescription, setBannerDescription] = useState("");
//   const [productSearch, setProductSearch] = useState("");
//   const [isLoadingProducts, setIsLoadingProducts] = useState(false);

//   // Your specific segments data
//   const userSegments = [
//     {
//       id: "New_Customers",
//       name: "New Customers",
//       user_count: 182,
//       avg_order_value: 171.3,
//       conversion_rate: 154.4,
//       revenue_contribution: 48136.12,
//     },
//     {
//       id: "Young Adults",
//       name: "Young Adults",
//       user_count: 100,
//       avg_order_value: 163.53,
//       conversion_rate: 233.0,
//       revenue_contribution: 38103.04,
//     },
//     {
//       id: "High Value Customers",
//       name: "High Value Customers",
//       user_count: 50,
//       avg_order_value: 301.45,
//       conversion_rate: 354.0,
//       revenue_contribution: 53356.64,
//     },
//     {
//       id: "Electronics_Enthusiasts",
//       name: "Electronics Enthusiasts",
//       user_count: 36,
//       avg_order_value: 292.72,
//       conversion_rate: 366.67,
//       revenue_contribution: 38638.9,
//     },
//   ];

//   // API integration functions
//   const fetchProducts = async (search = "", page = 1, limit = 20) => {
//     setIsLoadingProducts(true);
//     try {
//       const queryParams = new URLSearchParams({
//         page: page.toString(),
//         limit: limit.toString(),
//         ...(search && { search }),
//       });

//       const response = await fetch(`/api/v1/products?${queryParams}`);
//       const data = await response.json();

//       if (response.ok) {
//         setProducts(data.products || []);
//       } else {
//         console.error("Failed to fetch products:", data);
//       }
//     } catch (error) {
//       console.error("Error fetching products:", error);
//     } finally {
//       setIsLoadingProducts(false);
//     }
//   };

//   const generateBannerContent = async () => {
//     setIsGenerating(true);
//     try {
//       const requestData = {
//         target_segment: selectedSegment,
//         deal_type: dealType,
//         deal_data: dealData,
//         ...(selectedProduct && { product_id: selectedProduct }),
//       };

//       const response = await fetch(
//         "http://localhost:8000/api/v1/admin/banners/generate",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//           body: JSON.stringify(requestData),
//         }
//       );

//       const data = await response.json();

//       if (response.ok) {
//         setGeneratedBanner(data);
//         setBannerTitle(data.suggested_title);
//         setShowPreview(true);
//       } else {
//         alert("Failed to generate banner: " + data.detail);
//       }
//     } catch (error) {
//       console.error("Error generating banner:", error);
//       alert("Error generating banner");
//     } finally {
//       setIsGenerating(false);
//     }
//   };

//   const createBannerWithGeneration = async () => {
//     try {
//       const bannerData = {
//         title: bannerTitle,
//         description: bannerDescription,
//         target_segment: selectedSegment,
//         deal_type: dealType,
//         deal_data: JSON.stringify(dealData),
//         banner_text: generatedBanner?.banner_text,
//         call_to_action: generatedBanner?.call_to_action,
//         start_time: startTime || null,
//         end_time: endTime || null,
//         ...(selectedProduct && { product_id: selectedProduct }),
//       };

//       const response = await fetch(
//         "http://localhost:8000/api/v1/admin/banners/create-with-generation",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//           body: JSON.stringify(bannerData),
//         }
//       );

//       const data = await response.json();

//       if (response.ok) {
//         alert("Banner created successfully!");
//         resetForm();
//         fetchBanners();
//       } else {
//         alert("Failed to create banner: " + data.detail);
//       }
//     } catch (error) {
//       console.error("Error creating banner:", error);
//       alert("Error creating banner");
//     }
//   };

//   const fetchBanners = async () => {
//     try {
//       const response = await fetch(
//         "http://localhost:8000/api/v1/admin/banners",
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//         }
//       );
//       const data = await response.json();

//       if (response.ok) {
//         setBanners(data.banners || []);
//       }
//     } catch (error) {
//       console.error("Error fetching banners:", error);
//     }
//   };

//   const publishBanner = async (bannerId: any) => {
//     try {
//       const response = await fetch(
//         `http://localhost:8000/api/v1/admin/banners/${bannerId}/publish`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//           body: JSON.stringify({
//             start_time: null,
//             end_time: null,
//           }),
//         }
//       );

//       if (response.ok) {
//         alert("Banner published successfully!");
//         fetchBanners();
//       } else {
//         alert("Failed to publish banner");
//       }
//     } catch (error) {
//       console.error("Error publishing banner:", error);
//     }
//   };

//   const regenerateImage = async (bannerId: any) => {
//     try {
//       const response = await fetch(
//         `http://localhost:8000/api/v1/admin/banners/${bannerId}/regenerate-image`,
//         {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//         }
//       );

//       if (response.ok) {
//         alert("Image regenerated successfully!");
//         fetchBanners();
//       } else {
//         alert("Failed to regenerate image");
//       }
//     } catch (error) {
//       console.error("Error regenerating image:", error);
//     }
//   };

//   const deleteBanner = async (bannerId: any) => {
//     if (confirm("Are you sure you want to delete this banner?")) {
//       try {
//         const response = await fetch(
//           `http://localhost:8000/api/v1/admin/banners/${bannerId}`,
//           {
//             method: "DELETE",
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem("token")}`,
//             },
//           }
//         );

//         if (response.ok) {
//           alert("Banner deleted successfully!");
//           fetchBanners();
//         } else {
//           alert("Failed to delete banner");
//         }
//       } catch (error) {
//         console.error("Error deleting banner:", error);
//       }
//     }
//   };

//   const resetForm = () => {
//     setSelectedSegment("");
//     setSelectedProduct("");
//     setDealType("discount");
//     setDealData({});
//     setGeneratedBanner(null);
//     setShowPreview(false);
//     setBannerTitle("");
//     setBannerDescription("");
//     setStartTime("");
//     setEndTime("");
//   };

//   // Load initial data
//   useEffect(() => {
//     fetchProducts();
//     fetchBanners();
//   }, []);

//   // Load products when search changes
//   useEffect(() => {
//     const delayedSearch = setTimeout(() => {
//       fetchProducts(productSearch);
//     }, 300);

//     return () => clearTimeout(delayedSearch);
//   }, [productSearch]);

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <div className="bg-white shadow-sm border-b">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center py-4">
//             <h1 className="text-2xl font-bold text-gray-900">
//               Ad Banner Portal
//             </h1>
//             <div className="flex space-x-4">
//               <button
//                 onClick={() => setActiveTab("create")}
//                 className={`px-4 py-2 rounded-lg font-medium ${
//                   activeTab === "create"
//                     ? "bg-blue-600 text-white"
//                     : "text-gray-600 hover:text-gray-900"
//                 }`}
//               >
//                 <Plus className="w-4 h-4 inline mr-2" />
//                 Create Banner
//               </button>
//               <button
//                 onClick={() => setActiveTab("manage")}
//                 className={`px-4 py-2 rounded-lg font-medium ${
//                   activeTab === "manage"
//                     ? "bg-blue-600 text-white"
//                     : "text-gray-600 hover:text-gray-900"
//                 }`}
//               >
//                 <Settings className="w-4 h-4 inline mr-2" />
//                 Manage Banners
//               </button>
//               <button
//                 onClick={() => setActiveTab("analytics")}
//                 className={`px-4 py-2 rounded-lg font-medium ${
//                   activeTab === "analytics"
//                     ? "bg-blue-600 text-white"
//                     : "text-gray-600 hover:text-gray-900"
//                 }`}
//               >
//                 <BarChart3 className="w-4 h-4 inline mr-2" />
//                 Analytics
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Create Banner Tab */}
//         {activeTab === "create" && (
//           <div className="space-y-8">
//             <div className="bg-white rounded-lg shadow-sm p-6">
//               <h2 className="text-xl font-semibold mb-6">Create New Banner</h2>

//               {/* Basic Information */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Banner Title
//                   </label>
//                   <input
//                     type="text"
//                     value={bannerTitle}
//                     onChange={(e) => setBannerTitle(e.target.value)}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     placeholder="Enter banner title"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Description
//                   </label>
//                   <input
//                     type="text"
//                     value={bannerDescription}
//                     onChange={(e) => setBannerDescription(e.target.value)}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     placeholder="Banner description"
//                   />
//                 </div>
//               </div>

//               {/* User Segment Selection */}
//               <div className="mb-6">
//                 <label className="block text-sm font-medium text-gray-700 mb-3">
//                   Select Target Segment
//                 </label>
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//                   {userSegments.map((segment) => (
//                     <div
//                       key={segment.id}
//                       onClick={() => setSelectedSegment(segment.id)}
//                       className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
//                         selectedSegment === segment.id
//                           ? "border-blue-500 bg-blue-50"
//                           : "border-gray-200 hover:border-gray-300"
//                       }`}
//                     >
//                       <div className="flex items-center justify-between mb-2">
//                         <Users className="w-5 h-5 text-gray-600" />
//                         <span className="text-sm font-medium text-green-600">
//                           {segment.user_count} users
//                         </span>
//                       </div>
//                       <h3 className="font-medium text-gray-900 mb-1">
//                         {segment.name}
//                       </h3>
//                       <div className="text-xs text-gray-500 space-y-1">
//                         <div>AOV: ${segment.avg_order_value.toFixed(2)}</div>
//                         <div>Conv: {segment.conversion_rate.toFixed(1)}%</div>
//                         <div>
//                           Revenue: $
//                           {segment.revenue_contribution.toLocaleString()}
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Deal Type Selection */}
//               <div className="mb-6">
//                 <label className="block text-sm font-medium text-gray-700 mb-3">
//                   Campaign Type
//                 </label>
//                 <div className="flex space-x-4">
//                   <button
//                     onClick={() => setDealType("discount")}
//                     className={`px-4 py-2 rounded-lg border ${
//                       dealType === "discount"
//                         ? "border-blue-500 bg-blue-50 text-blue-700"
//                         : "border-gray-300 text-gray-700 hover:bg-gray-50"
//                     }`}
//                   >
//                     <Percent className="w-4 h-4 inline mr-2" />
//                     Discount Deal
//                   </button>
//                   <button
//                     onClick={() => setDealType("product")}
//                     className={`px-4 py-2 rounded-lg border ${
//                       dealType === "product"
//                         ? "border-blue-500 bg-blue-50 text-blue-700"
//                         : "border-gray-300 text-gray-700 hover:bg-gray-50"
//                     }`}
//                   >
//                     <Package className="w-4 h-4 inline mr-2" />
//                     Product Showcase
//                   </button>
//                   <button
//                     onClick={() => setDealType("promotion")}
//                     className={`px-4 py-2 rounded-lg border ${
//                       dealType === "promotion"
//                         ? "border-blue-500 bg-blue-50 text-blue-700"
//                         : "border-gray-300 text-gray-700 hover:bg-gray-50"
//                     }`}
//                   >
//                     <Play className="w-4 h-4 inline mr-2" />
//                     Special Promotion
//                   </button>
//                 </div>
//               </div>

//               {/* Product Selection */}
//               {(dealType === "product" || dealType === "discount") && (
//                 <div className="mb-6">
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Select Product (Optional)
//                   </label>
//                   <div className="relative mb-4">
//                     <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
//                     <input
//                       type="text"
//                       value={productSearch}
//                       onChange={(e) => setProductSearch(e.target.value)}
//                       className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                       placeholder="Search products..."
//                     />
//                   </div>
//                   <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
//                     {isLoadingProducts ? (
//                       <div className="p-4 text-center text-gray-500">
//                         Loading products...
//                       </div>
//                     ) : products.length > 0 ? (
//                       products.map((product: any) => (
//                         <div
//                           key={product.id}
//                           onClick={() => setSelectedProduct(product.id)}
//                           className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
//                             selectedProduct === product.id
//                               ? "bg-blue-50 border-blue-200"
//                               : ""
//                           }`}
//                         >
//                           <div className="flex justify-between items-center">
//                             <div>
//                               <h4 className="font-medium text-gray-900">
//                                 {product.name}
//                               </h4>
//                               <p className="text-sm text-gray-500">
//                                 {product.category}
//                               </p>
//                             </div>
//                             <span className="text-sm font-medium text-gray-900">
//                               ${product.price}
//                             </span>
//                           </div>
//                         </div>
//                       ))
//                     ) : (
//                       <div className="p-4 text-center text-gray-500">
//                         No products found
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               )}

//               {/* Deal Data Input */}
//               {dealType === "discount" && (
//                 <div className="mb-6">
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Discount Details
//                   </label>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <input
//                       type="number"
//                       placeholder="Discount percentage"
//                       value={dealData.discount || ""}
//                       onChange={(e) =>
//                         setDealData({ ...dealData, discount: e.target.value })
//                       }
//                       className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     />
//                     <input
//                       type="text"
//                       placeholder="Product name (if specific)"
//                       value={dealData.product_name || ""}
//                       onChange={(e) =>
//                         setDealData({
//                           ...dealData,
//                           product_name: e.target.value,
//                         })
//                       }
//                       className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     />
//                   </div>
//                 </div>
//               )}

//               {dealType === "promotion" && (
//                 <div className="mb-6">
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Promotion Details
//                   </label>
//                   <input
//                     type="text"
//                     placeholder="Promotion name"
//                     value={dealData.promotion_name || ""}
//                     onChange={(e) =>
//                       setDealData({
//                         ...dealData,
//                         promotion_name: e.target.value,
//                       })
//                     }
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>
//               )}

//               {/* Scheduling */}
//               <div className="mb-6">
//                 <label className="block text-sm font-medium text-gray-700 mb-3">
//                   Schedule (Optional)
//                 </label>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-xs text-gray-500 mb-1">
//                       Start Time
//                     </label>
//                     <input
//                       type="datetime-local"
//                       value={startTime}
//                       onChange={(e) => setStartTime(e.target.value)}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-xs text-gray-500 mb-1">
//                       End Time
//                     </label>
//                     <input
//                       type="datetime-local"
//                       value={endTime}
//                       onChange={(e) => setEndTime(e.target.value)}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Generate Button */}
//               <div className="flex justify-center">
//                 <button
//                   onClick={generateBannerContent}
//                   disabled={!selectedSegment || isGenerating}
//                   className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
//                 >
//                   {isGenerating ? (
//                     <>
//                       <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
//                       Generating with Google Imagen 4.0...
//                     </>
//                   ) : (
//                     <>
//                       <Play className="w-4 h-4 inline mr-2" />
//                       Generate Banner
//                     </>
//                   )}
//                 </button>
//               </div>
//             </div>

//             {/* Preview Section */}
//             {showPreview && generatedBanner && (
//               <div className="bg-white rounded-lg shadow-sm p-6">
//                 <div className="flex justify-between items-center mb-4">
//                   <h3 className="text-lg font-semibold">Banner Preview</h3>
//                   <div className="flex space-x-2">
//                     <button
//                       onClick={generateBannerContent}
//                       className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
//                     >
//                       <RefreshCw className="w-4 h-4 inline mr-2" />
//                       Regenerate
//                     </button>
//                     <button
//                       onClick={createBannerWithGeneration}
//                       className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
//                     >
//                       <Plus className="w-4 h-4 inline mr-2" />
//                       Create Banner
//                     </button>
//                   </div>
//                 </div>

//                 {/* Generated Banner Display */}
//                 <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
//                   {generatedBanner.design_suggestions?.image_base64 ? (
//                     <div className="space-y-4">
//                       <img
//                         src={`data:image/png;base64,${generatedBanner.design_suggestions.image_base64}`}
//                         alt="Generated Banner"
//                         className="mx-auto max-w-full h-auto rounded-lg shadow-lg"
//                         style={{ aspectRatio: "9/6" }}
//                       />
//                       <div className="text-sm text-gray-600">
//                         Generated with Google Imagen 4.0 Ultra (9:6 aspect
//                         ratio)
//                       </div>
//                     </div>
//                   ) : (
//                     <div className="space-y-4">
//                       <div className="w-full h-64 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
//                         <div className="text-center">
//                           <h3 className="text-2xl font-bold mb-2">
//                             {generatedBanner.banner_text}
//                           </h3>
//                           <button className="px-6 py-2 bg-white text-blue-600 rounded-lg font-medium">
//                             {generatedBanner.call_to_action}
//                           </button>
//                         </div>
//                       </div>
//                       {generatedBanner.design_suggestions?.error && (
//                         <div className="text-red-600 text-sm">
//                           Image generation failed:{" "}
//                           {generatedBanner.design_suggestions.error}
//                         </div>
//                       )}
//                     </div>
//                   )}
//                 </div>

//                 {/* Banner Details */}
//                 <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div className="bg-gray-50 p-4 rounded-lg">
//                     <h4 className="font-medium text-gray-900 mb-2">
//                       Banner Text
//                     </h4>
//                     <p className="text-gray-700">
//                       {generatedBanner.banner_text}
//                     </p>
//                   </div>
//                   <div className="bg-gray-50 p-4 rounded-lg">
//                     <h4 className="font-medium text-gray-900 mb-2">
//                       Call to Action
//                     </h4>
//                     <p className="text-gray-700">
//                       {generatedBanner.call_to_action}
//                     </p>
//                   </div>
//                   <div className="bg-gray-50 p-4 rounded-lg">
//                     <h4 className="font-medium text-gray-900 mb-2">
//                       Target Segment
//                     </h4>
//                     <p className="text-gray-700">{selectedSegment}</p>
//                   </div>
//                 </div>

//                 {generatedBanner.design_suggestions?.prompt_used && (
//                   <details className="mt-4">
//                     <summary className="cursor-pointer text-sm font-medium text-gray-600">
//                       View AI Prompt Used
//                     </summary>
//                     <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-600">
//                       {generatedBanner.design_suggestions.prompt_used}
//                     </div>
//                   </details>
//                 )}
//               </div>
//             )}
//           </div>
//         )}

//         {/* Manage Banners Tab */}
//         {activeTab === "manage" && (
//           <div className="space-y-6">
//             <div className="bg-white rounded-lg shadow-sm">
//               <div className="p-6 border-b border-gray-200">
//                 <h2 className="text-xl font-semibold">Manage Banners</h2>
//               </div>
//               <div className="p-6">
//                 {banners.length === 0 ? (
//                   <div className="text-center py-12">
//                     <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//                     <h3 className="text-lg font-medium text-gray-900 mb-2">
//                       No banners yet
//                     </h3>
//                     <p className="text-gray-500">
//                       Create your first banner to get started.
//                     </p>
//                     <button
//                       onClick={() => setActiveTab("create")}
//                       className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//                     >
//                       Create Banner
//                     </button>
//                   </div>
//                 ) : (
//                   <div className="space-y-4">
//                     {banners.map((banner: any) => (
//                       <div
//                         key={banner.id}
//                         className="border border-gray-200 rounded-lg p-4"
//                       >
//                         <div className="flex items-center justify-between">
//                           <div className="flex-1">
//                             <div className="flex items-center space-x-4">
//                               {banner.image_url && (
//                                 <img
//                                   src={banner.image_url}
//                                   alt={banner.title}
//                                   className="w-24 h-16 object-cover rounded border"
//                                 />
//                               )}
//                               <div>
//                                 <h3 className="font-medium text-gray-900">
//                                   {banner.title}
//                                 </h3>
//                                 <p className="text-sm text-gray-600">
//                                   {banner.description}
//                                 </p>
//                                 <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
//                                   <span className="flex items-center">
//                                     <Users className="w-3 h-3 mr-1" />
//                                     {banner.target_segment}
//                                   </span>
//                                   <span className="flex items-center">
//                                     <Eye className="w-3 h-3 mr-1" />
//                                     {banner.impression_count} views
//                                   </span>
//                                   <span className="flex items-center">
//                                     <MousePointer className="w-3 h-3 mr-1" />
//                                     {banner.click_count} clicks
//                                   </span>
//                                   <span
//                                     className={`px-2 py-1 rounded text-xs font-medium ${
//                                       banner.status === "published"
//                                         ? "bg-green-100 text-green-800"
//                                         : banner.status === "draft"
//                                         ? "bg-yellow-100 text-yellow-800"
//                                         : "bg-gray-100 text-gray-800"
//                                     }`}
//                                   >
//                                     {banner.status}
//                                   </span>
//                                 </div>
//                               </div>
//                             </div>
//                           </div>
//                           <div className="flex items-center space-x-2">
//                             {banner.status === "draft" && (
//                               <button
//                                 onClick={() => publishBanner(banner.id)}
//                                 className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
//                               >
//                                 <Play className="w-3 h-3 inline mr-1" />
//                                 Publish
//                               </button>
//                             )}
//                             <button
//                               onClick={() => regenerateImage(banner.id)}
//                               className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
//                             >
//                               <RefreshCw className="w-3 h-3 inline mr-1" />
//                               Regenerate
//                             </button>
//                             <button
//                               onClick={() => deleteBanner(banner.id)}
//                               className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
//                             >
//                               <Trash2 className="w-3 h-3 inline mr-1" />
//                               Delete
//                             </button>
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Analytics Tab */}
//         {activeTab === "analytics" && (
//           <div className="space-y-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//               {userSegments.map((segment: any) => {
//                 const segmentBanners = banners.filter(
//                   (b: any) => b.target_segment === segment.id
//                 );
//                 const totalImpressions = segmentBanners.reduce(
//                   (sum, b: any) => sum + b.impression_count,
//                   0
//                 );
//                 const totalClicks = segmentBanners.reduce(
//                   (sum, b: any) => sum + b.click_count,
//                   0
//                 );
//                 const ctr =
//                   totalImpressions > 0
//                     ? ((totalClicks / totalImpressions) * 100).toFixed(2)
//                     : "0.00";

//                 return (
//                   <div
//                     key={segment.id}
//                     className="bg-white rounded-lg shadow-sm p-6"
//                   >
//                     <div className="flex items-center justify-between mb-4">
//                       <h3 className="font-medium text-gray-900">
//                         {segment.name}
//                       </h3>
//                       <Users className="w-5 h-5 text-blue-600" />
//                     </div>
//                     <div className="space-y-2 text-sm">
//                       <div className="flex justify-between">
//                         <span className="text-gray-600">Active Banners:</span>
//                         <span className="font-medium">
//                           {
//                             segmentBanners.filter((b: any) => b.is_active)
//                               .length
//                           }
//                         </span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span className="text-gray-600">
//                           Total Impressions:
//                         </span>
//                         <span className="font-medium">
//                           {totalImpressions.toLocaleString()}
//                         </span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span className="text-gray-600">Total Clicks:</span>
//                         <span className="font-medium">
//                           {totalClicks.toLocaleString()}
//                         </span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span className="text-gray-600">CTR:</span>
//                         <span className="font-medium text-green-600">
//                           {ctr}%
//                         </span>
//                       </div>
//                       <div className="flex justify-between pt-2 border-t">
//                         <span className="text-gray-600">Segment Size:</span>
//                         <span className="font-medium">
//                           {segment.user_count} users
//                         </span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span className="text-gray-600">AOV:</span>
//                         <span className="font-medium">
//                           ${segment.avg_order_value.toFixed(2)}
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>

//             {/* Overall Analytics */}
//             <div className="bg-white rounded-lg shadow-sm p-6">
//               <h3 className="text-lg font-semibold mb-4">
//                 Overall Performance
//               </h3>
//               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//                 <div className="text-center">
//                   <div className="text-2xl font-bold text-blue-600">
//                     {banners.length}
//                   </div>
//                   <div className="text-sm text-gray-600">Total Banners</div>
//                 </div>
//                 <div className="text-center">
//                   <div className="text-2xl font-bold text-green-600">
//                     {
//                       banners.filter((b: any) => b.status === "published")
//                         .length
//                     }
//                   </div>
//                   <div className="text-sm text-gray-600">Published</div>
//                 </div>
//                 <div className="text-center">
//                   <div className="text-2xl font-bold text-purple-600">
//                     {banners
//                       .reduce((sum, b: any) => sum + b.impression_count, 0)
//                       .toLocaleString()}
//                   </div>
//                   <div className="text-sm text-gray-600">Total Impressions</div>
//                 </div>
//                 <div className="text-center">
//                   <div className="text-2xl font-bold text-orange-600">
//                     {banners
//                       .reduce((sum, b: any) => sum + b.click_count, 0)
//                       .toLocaleString()}
//                   </div>
//                   <div className="text-sm text-gray-600">Total Clicks</div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default AdBannerPortal;
