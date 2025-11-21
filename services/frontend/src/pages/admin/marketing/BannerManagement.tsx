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
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { env } from "@/config";
import { useAuth } from "@/hooks";
import { useSearchProductsQuery } from "@/store/api/productApi";
import { useGetSegmentPerformanceAnalyticsQuery } from "@/store/api/adminApi";

const normalizeNumericValue = (value: unknown): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const cleaned = value.trim();
    if (!cleaned) {
      return 0;
    }

    const parsed = Number(cleaned.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  return 0;
};

const normalizePercentageValue = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return null;
    }

    if (value >= -1 && value <= 1) {
      return value * 100;
    }

    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const match = trimmed.match(/-?\d+(?:\.\d+)?/);
    if (!match) {
      return null;
    }

    const parsed = Number(match[0]);
    if (!Number.isFinite(parsed)) {
      return null;
    }

    if (trimmed.includes("%")) {
      return parsed;
    }

    if (parsed >= -1 && parsed <= 1) {
      return parsed * 100;
    }

    return parsed;
  }

  return null;
};

const deriveConversionRate = (
  rawValues: unknown[],
  ordersCount: number,
  memberCount: number
): number => {
  for (const value of rawValues) {
    const normalized = normalizePercentageValue(value);
    if (normalized !== null) {
      return normalized;
    }
  }

  if (memberCount > 0) {
    const computed = (ordersCount / memberCount) * 100;
    return Number.isFinite(computed) ? computed : 0;
  }

  return 0;
};
const AdBannerPortal = () => {
  const [activeTab, setActiveTab] = useState("create");
  const [banners, setBanners] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("");
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

  // Use RTK Query for product search
  const { data: productData, isLoading: isLoadingProducts } = useSearchProductsQuery(
    {
      q: productSearch || "all",
      page: 1,
      size: 20,
      sort_by: "relevance",
      sort_order: "desc",
      use_vector_search: true,
    },
    { skip: false }
  );
  const products = productData?.items || [];

  const {
    data: segmentPerformanceAnalytics,
    isLoading: isLoadingSegmentAnalytics,
    isFetching: isFetchingSegmentAnalytics,
    error: segmentPerformanceError,
    refetch: refetchSegmentPerformance,
  } = useGetSegmentPerformanceAnalyticsQuery({});

  const userSegments = useMemo(() => {
    const segments = Array.isArray(segmentPerformanceAnalytics)
      ? segmentPerformanceAnalytics
      : [];

    const normalizeKey = (value: unknown) =>
      String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/[_\s-]+/g, "");

    const mapped = segments
      .map((segment: any, index: number) => {
        const fallbackName =
          segment?.segment_name ??
          segment?.name ??
          segment?.segment ??
          `Segment ${index + 1}`;

        const rawId =
          segment?.segment_id ??
          segment?.id ??
          segment?.segment_key ??
          segment?.segment ??
          segment?.name ??
          fallbackName;

        const canonicalId = String(rawId ?? fallbackName)
          .trim()
          .replace(/\s+/g, "_");

        const userCount = normalizeNumericValue(
          segment?.user_count ?? segment?.member_count ?? 0
        );

        const ordersCount = normalizeNumericValue(
          segment?.orders_count ?? segment?.order_count ?? segment?.orders ?? 0
        );

        const avgOrderValue = normalizeNumericValue(
          segment?.avg_order_value ?? segment?.average_order_value ?? 0
        );

        const totalRevenue = normalizeNumericValue(
          segment?.total_revenue ??
          segment?.revenue_contribution ??
          segment?.revenue ??
          0
        );

        const conversionRate = deriveConversionRate(
          [
            segment?.conversion_rate,
            segment?.conversionRate,
            segment?.conversion_rate_percent,
          ],
          ordersCount,
          userCount
        );

        const isActive =
          segment?.is_active !== undefined
            ? Boolean(segment?.is_active)
            : userCount > 0;

        if (!isActive) {
          return null;
        }

        return {
          id: canonicalId || `segment_${index}`,
          name: fallbackName,
          user_count: userCount,
          avg_order_value: avgOrderValue,
          conversion_rate: conversionRate,
          revenue_contribution: totalRevenue,
          total_revenue: totalRevenue,
          orders_count: ordersCount,
          normalizedKey: normalizeKey(canonicalId || fallbackName),
        };
      })
      .filter((segment): segment is any => Boolean(segment));

    const deduped: any[] = [];
    const seenKeys = new Set<string>();

    mapped.forEach((segment) => {
      const key = segment.normalizedKey;
      if (key) {
        if (seenKeys.has(key)) {
          return;
        }
        seenKeys.add(key);
      }

      const { normalizedKey, ...rest } = segment;
      deduped.push(rest);
    });

    deduped.sort((a, b) => (b.user_count ?? 0) - (a.user_count ?? 0));

    return deduped;
  }, [segmentPerformanceAnalytics]);

  const segmentsLoading = isLoadingSegmentAnalytics || isFetchingSegmentAnalytics;

  useEffect(() => {
    if (!segmentPerformanceError) {
      return;
    }

    const message =
      (segmentPerformanceError as any)?.data?.detail ??
      (segmentPerformanceError as any)?.error ??
      "Unable to load segment analytics.";

    toast.error(message);
  }, [segmentPerformanceError]);

  useEffect(() => {
    if (!selectedSegment) {
      return;
    }

    if (segmentsLoading) {
      return;
    }

    const stillExists = userSegments.some((segment) => segment.id === selectedSegment);
    if (!stillExists) {
      setSelectedSegment("");
    }
  }, [segmentsLoading, selectedSegment, userSegments]);

  // API integration functions
  const { token } = useAuth();
  const apiBaseUrl = useMemo(() => env.apiBaseUrl.replace(/\/$/, ""), []);

  const selectedProductDetails = useMemo(() => {
    if (!selectedProduct) {
      return null;
    }

    return products.find((product: any) => product.id === selectedProduct) ?? null;
  }, [products, selectedProduct]);

  const selectedSegmentDetails = selectedSegment
    ? userSegments.find((segment) => segment.id === selectedSegment) ?? null
    : null;

  const resolveSegmentMeta = useCallback(
    (segmentKey?: string | null) => {
      if (!segmentKey) {
        return null;
      }

      const normalizedKey = String(segmentKey).trim();
      const normalizedComparable = normalizedKey
        .toLowerCase()
        .replace(/[_\s-]+/g, "");

      const match = userSegments.find(
        (segment) =>
          segment.id === normalizedKey ||
          segment.name === normalizedKey ||
          segment.id?.toLowerCase().replace(/[_\s-]+/g, "") === normalizedComparable ||
          segment.name?.toLowerCase().replace(/[_\s-]+/g, "") === normalizedComparable
      );

      if (match) {
        return { id: match.id, name: match.name };
      }

      return {
        id: normalizedKey,
        name: normalizedKey.replace(/_/g, " "),
      };
    },
    [userSegments]
  );

  const mapBannerRecord = useCallback(
    (record: any) => {
      if (!record) {
        return null;
      }

      const fallbackId = `temp-banner-${Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}`;
      const bannerId = record.banner_id ?? record.id ?? fallbackId;

      const targetSegmentKey =
        record.target_segment ??
        record.target_segment_id ??
        record.segment_id ??
        null;

      const segmentMeta = record.target_segment_label
        ? {
          id: targetSegmentKey ?? record.target_segment_label,
          name: record.target_segment_label,
        }
        : resolveSegmentMeta(targetSegmentKey);

      const normalizedImageBase64 =
        record.image_base64 ??
        (typeof record.image_url === "string" && record.image_url.startsWith("data:")
          ? record.image_url.replace(/^data:image\/[^;]+;base64,/, "")
          : null);

      const normalizedImageUrl = record.image_url ??
        (Array.isArray(record.saved_path) ? record.saved_path[0] : record.saved_path ?? null);

      return {
        id: bannerId,
        banner_id: bannerId,
        title: record.title ?? record.suggested_title ?? "Untitled Banner",
        description: record.description ?? record.banner_text ?? "",
        target_segment: segmentMeta?.id ?? targetSegmentKey ?? "general_audience",
        target_segment_label: segmentMeta?.name ?? "General audience",
        product_id: record.product_id ?? null,
        deal_type: record.deal_type ?? record.campaign_type ?? "general",
        deal_data: record.deal_data ?? null,
        image_url: normalizedImageUrl,
        image_base64: normalizedImageBase64,
        prompt: record.prompt ?? record.prompt_used ?? null,
        status: record.status ?? "draft",
        start_time: record.start_time ?? null,
        end_time: record.end_time ?? null,
        impression_count: Number(record.impression_count ?? 0),
        click_count: Number(record.click_count ?? 0),
        created_at: record.created_at ?? new Date().toISOString(),
      };
    },
    [resolveSegmentMeta]
  );

  const resolveBannerImageSrc = useCallback(
    (banner: any) => {
      if (!banner) {
        return null;
      }

      const rawBase64 = banner.image_base64 ?? banner.imageBase64;
      if (typeof rawBase64 === "string" && rawBase64.trim()) {
        const trimmed = rawBase64.trim();
        return trimmed.startsWith("data:")
          ? trimmed
          : `data:image/png;base64,${trimmed}`;
      }

      const candidates = [
        banner.image_url,
        banner.imageUrl,
        banner.saved_path,
        banner.savedPath,
      ];

      let urlCandidate: string | null = null;
      for (const candidate of candidates) {
        if (!candidate) {
          continue;
        }

        if (typeof candidate === "string" && candidate.trim()) {
          urlCandidate = candidate.trim();
          break;
        }

        if (Array.isArray(candidate)) {
          const firstValid = candidate.find(
            (value) => typeof value === "string" && value.trim()
          );
          if (typeof firstValid === "string") {
            urlCandidate = firstValid.trim();
            break;
          }
        }
      }

      if (!urlCandidate) {
        return null;
      }

      if (
        urlCandidate.startsWith("data:") ||
        urlCandidate.startsWith("http://") ||
        urlCandidate.startsWith("https://")
      ) {
        return urlCandidate;
      }

      if (urlCandidate.startsWith("//")) {
        if (typeof window !== "undefined" && window.location) {
          return `${window.location.protocol}${urlCandidate}`;
        }
        return `https:${urlCandidate}`;
      }

      const normalizedPath = urlCandidate.startsWith("/")
        ? urlCandidate.slice(1)
        : urlCandidate;

      return `${apiBaseUrl}/${normalizedPath}`;
    },
    [apiBaseUrl]
  );

  const formatDateTime = (value?: string) => {
    if (!value) {
      return null;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleString();
  };

  const buildBannerPrompt = () => {
    const promptLines: string[] = [
      "Design a high-converting e-commerce marketing banner tailored for an online retail platform.",
    ];

    if (bannerTitle) {
      promptLines.push(`Headline: ${bannerTitle.trim()}`);
    }

    if (bannerDescription) {
      promptLines.push(`Supporting copy: ${bannerDescription.trim()}`);
    }

    promptLines.push(`Campaign type: ${dealType.replace(/_/g, " ")}`);

    if (dealType === "discount") {
      const discountValue = dealData.discount ? `${dealData.discount}% off` : null;
      const discountProduct = dealData.product_name;
      const discountDetails = [discountValue, discountProduct]
        .filter(Boolean)
        .join(" on ");

      if (discountDetails) {
        promptLines.push(`Discount details: ${discountDetails}`);
      }
    }

    if (dealType === "promotion" && dealData.promotion_name) {
      promptLines.push(`Promotion name: ${dealData.promotion_name}`);
    }

    if (selectedProductDetails) {
      const productName = selectedProductDetails.name ?? "Featured Product";
      const productCategory = selectedProductDetails.category?.name ?? selectedProductDetails.category ?? "General";
      const productPrice = selectedProductDetails.price ? `$${selectedProductDetails.price}` : null;
      const productDescription = selectedProductDetails.description;

      const productSummary = [productName, productCategory, productPrice]
        .filter(Boolean)
        .join(" | ");

      promptLines.push(`Featured product: ${productSummary}`);

      if (productDescription) {
        promptLines.push(`Product highlights: ${productDescription}`);
      }
    }

    if (selectedSegmentDetails) {
      promptLines.push(
        `Target segment: ${selectedSegmentDetails.name} (approx. ${selectedSegmentDetails.user_count} users, conversion ${selectedSegmentDetails.conversion_rate?.toFixed(1)}%)`
      );
    }

    const formattedStart = formatDateTime(startTime);
    const formattedEnd = formatDateTime(endTime);
    if (formattedStart || formattedEnd) {
      const timingText = [
        formattedStart ? `starts ${formattedStart}` : "available immediately",
        formattedEnd ? `ends ${formattedEnd}` : null,
      ]
        .filter(Boolean)
        .join(" and ");
      promptLines.push(`Campaign timing: ${timingText}`);
    }

    promptLines.push(
      "Design requirements: emphasise clear typography, include a strong call-to-action button, use premium lighting, and ensure the banner fits a 16:9 aspect ratio suitable for web hero sections."
    );

    return promptLines.join("\n");
  };

  const getFallbackCta = () => {
    if (dealType === "discount") {
      return "Redeem Offer";
    }

    if (dealType === "promotion") {
      return "Learn More";
    }

    return "Shop Now";
  };

  const generatedImageSrc = useMemo(() => {
    if (!generatedBanner?.image_base64) {
      return null;
    }

    return `data:image/png;base64,${generatedBanner.image_base64}`;
  }, [generatedBanner]);

  const dealSummary = useMemo(() => {
    if (dealType === "discount") {
      const amount = dealData?.discount ? `${dealData.discount}% off` : null;
      const productLabel = dealData?.product_name ?? selectedProductDetails?.name;
      return [amount, productLabel].filter(Boolean).join(" on ") || "Custom discount";
    }

    if (dealType === "promotion") {
      return dealData?.promotion_name || "Special promotion";
    }

    if (dealType === "product") {
      return selectedProductDetails?.name || "Product spotlight";
    }

    return "General campaign";
  }, [dealType, dealData, selectedProductDetails]);

  const scheduleSummary = useMemo(() => {
    const formattedStart = formatDateTime(startTime);
    const formattedEnd = formatDateTime(endTime);

    if (!formattedStart && !formattedEnd) {
      return "No schedule specified";
    }

    const parts = [
      formattedStart ? `Starts ${formattedStart}` : null,
      formattedEnd ? `Ends ${formattedEnd}` : null,
    ].filter(Boolean);

    return parts.join(" | ");
  }, [startTime, endTime]);

  const generateBannerContent = async () => {
    if (!bannerTitle || !bannerDescription) {
      toast.error("Please provide both a banner title and description before generating.");
      return;
    }

    const prompt = buildBannerPrompt();

    setIsGenerating(true);
    try {
      const requestData: Record<string, any> = {
        prompt,
        aspect_ratio: "16:9",
      };

      if (selectedProduct) {
        requestData.product_id = selectedProduct;
      }

      if (selectedSegment) {
        requestData.target_segment = selectedSegment;
      }

      const response = await fetch(
        "http://localhost:8000/api/v1/recommendations/generate-banner",
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

      if (!response.ok) {
        const detail = data?.detail ?? "Failed to generate banner";
        toast.error(detail);
        return;
      }

      const normalizedImage = Array.isArray(data.image_base64)
        ? data.image_base64[0]
        : data.image_base64;

      const enrichedBanner = {
        ...data,
        image_base64: normalizedImage,
        prompt,
        target_segment: selectedSegment || null,
        target_segment_label: selectedSegmentDetails?.name ?? null,
      };

      setGeneratedBanner(enrichedBanner);
      setShowPreview(true);
      toast.success("AI banner generated successfully!");
    } catch (error) {
      console.error("Error generating banner:", error);
      toast.error("Error generating banner");
    } finally {
      setIsGenerating(false);
    }
  };

  const createBannerWithGeneration = async () => {
    try {
      const bannerData: Record<string, any> = {
        title: bannerTitle,
        description: bannerDescription,
        deal_type: dealType,
        deal_data: JSON.stringify(dealData),
        prompt: generatedBanner?.prompt ?? buildBannerPrompt(),
        banner_id: generatedBanner?.banner_id,
        image_base64: generatedBanner?.image_base64,
        start_time: startTime || null,
        end_time: endTime || null,
        target_segment: selectedSegment || null,
        target_segment_label: selectedSegmentDetails?.name ?? null,
      };

      if (selectedProduct) {
        bannerData.product_id = selectedProduct;
      }

      if (selectedSegment) {
        bannerData.target_segment = selectedSegment;
      }

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
        const responsePayload = data?.banner ?? data ?? {};
        const normalizedBanner =
          mapBannerRecord({
            ...responsePayload,
            id:
              responsePayload?.id ??
              responsePayload?.banner_id ??
              data?.banner_id ??
              bannerData.banner_id,
            banner_id:
              responsePayload?.banner_id ??
              data?.banner_id ??
              bannerData.banner_id,
            title: responsePayload?.title ?? bannerData.title,
            description:
              responsePayload?.description ?? bannerData.description,
            image_url:
              responsePayload?.image_url ??
              (Array.isArray(responsePayload?.saved_path)
                ? responsePayload?.saved_path[0]
                : responsePayload?.saved_path ?? null),
            image_base64:
              responsePayload?.image_base64 ?? bannerData.image_base64,
            deal_type: responsePayload?.deal_type ?? bannerData.deal_type,
            deal_data: responsePayload?.deal_data ?? bannerData.deal_data,
            product_id: responsePayload?.product_id ?? bannerData.product_id,
            target_segment:
              responsePayload?.target_segment ?? bannerData.target_segment,
            target_segment_label:
              responsePayload?.target_segment_label ??
              bannerData.target_segment_label,
            prompt: responsePayload?.prompt ?? bannerData.prompt,
            status: responsePayload?.status ?? "draft",
            start_time:
              responsePayload?.start_time ?? bannerData.start_time ?? null,
            end_time:
              responsePayload?.end_time ?? bannerData.end_time ?? null,
            impression_count: responsePayload?.impression_count ?? 0,
            click_count: responsePayload?.click_count ?? 0,
          }) ?? undefined;

        const syncSucceeded = await fetchBanners();

        if (!syncSucceeded && normalizedBanner) {
          setBanners((prev: any[]) => {
            const filtered = prev.filter(
              (banner: any) => banner.id !== normalizedBanner.id
            );
            return [normalizedBanner, ...filtered];
          });
        }

        toast.success("Banner created successfully!");
        resetForm();
      } else {
        toast.error(data?.detail ?? "Failed to create banner");
      }
    } catch (error) {
      console.error("Error creating banner:", error);
      alert("Error creating banner");
    }
  };

  const fetchBanners = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/v1/admin/banners",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.warn("Banner fetch failed with status", response.status);
        return false;
      }

      if (response.status === 204) {
        setBanners([]);
        return true;
      }

      const data = await response
        .json()
        .catch(() => ({ banners: [] }));

      const rawList = Array.isArray(data?.banners)
        ? data.banners
        : Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : [];

      const normalized = rawList
        .map((item: any) => mapBannerRecord(item))
        .filter((item: any): item is any => Boolean(item));

      setBanners(normalized);
      return true;
    } catch (error) {
      console.error("Error fetching banners:", error);
      return false;
    }
  }, [mapBannerRecord, token]);

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
        toast.success("Banner published successfully!");
        fetchBanners();
      } else {
        const data = await response.json();
        toast.error(data?.detail || "Failed to publish banner");
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
        toast.success("Image regenerated successfully!");
        fetchBanners();
      } else {
        const data = await response.json();
        toast.error(data?.detail || "Failed to regenerate image");
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
        } else {
          const data = await response.json();
          toast.error(data?.detail || "Failed to delete banner");
        }
        fetchBanners();
      } catch (error) {
        console.error("Error deleting banner:", error);
      }
    }
  };

  const resetForm = () => {
    setSelectedProduct("");
    setSelectedSegment("");
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
    fetchBanners();
  }, [fetchBanners]);

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
              className={`tab gap-2 ${activeTab === "create" ? "tab-active" : ""
                }`}
            >
              <Plus className="w-4 h-4" />
              Create Banner
            </button>
            <button
              onClick={() => setActiveTab("manage")}
              className={`tab gap-2 ${activeTab === "manage" ? "tab-active" : ""
                }`}
            >
              <Settings className="w-4 h-4" />
              Manage Banners
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`tab gap-2 ${activeTab === "analytics" ? "tab-active" : ""
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
          <div className="space-y-8 relative">
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

                {/* Target Segment Selection */}
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <label className="label mb-0">
                      <span className="label-text font-medium">Target Segment</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => refetchSegmentPerformance()}
                      className="btn btn-ghost btn-xs gap-1"
                      disabled={segmentsLoading}
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${segmentsLoading ? "animate-spin" : ""}`}
                      />
                      Refresh
                    </button>
                  </div>
                  <div className="relative w-full ">
                    {segmentsLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <span className="loading loading-spinner loading-md"></span>
                        <span className="ml-3 text-sm text-base-content/70">
                          Loading segments...
                        </span>
                      </div>
                    ) : userSegments.length > 0 ? (
                      <div className="overflow-x-auto pb-2 -mx-1 px-1">
                        <div className="grid gap-4 grid-flow-col auto-cols-[minmax(240px,1fr)] md:grid-flow-row md:grid-cols-2 lg:grid-cols-4">
                          {userSegments.map((segment) => {
                            const isSelected = selectedSegment === segment.id;
                            return (
                              <button
                                key={segment.id}
                                type="button"
                                onClick={() =>
                                  setSelectedSegment((current) =>
                                    current === segment.id ? "" : segment.id
                                  )
                                }
                                className={`card min-w-60 p-4 text-left border transition-all ${isSelected
                                  ? "border-primary bg-primary/10 shadow-lg"
                                  : "border-base-300 hover:border-primary/40"
                                  }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold text-base-content">
                                    {segment.name}
                                  </h4>
                                  <span className="badge badge-outline">
                                    {segment.user_count.toLocaleString()} users
                                  </span>
                                </div>
                                <div className="text-sm text-base-content/70 space-y-1">
                                  <div>
                                    Avg Order: ${segment.avg_order_value?.toFixed(2)}
                                  </div>
                                  <div>
                                    Conversion: {segment.conversion_rate?.toFixed(1)}%
                                  </div>
                                  <div>
                                    Revenue: $
                                    {segment.revenue_contribution.toLocaleString()}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : segmentPerformanceError ? (
                      <div className="py-4 text-sm text-error">
                        We couldn't load segments right now. Try again in a moment.
                      </div>
                    ) : (
                      <div className="py-4 text-sm text-base-content/60">
                        No active segments found. Try refreshing analytics data later.
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-base-content/60 mt-2">
                    Select a segment to tailor messaging. Leave unselected for a general audience.
                  </p>
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
                      className={`btn join-item ${dealType === "discount" ? "btn-primary" : "btn-outline"
                        }`}
                    >
                      <Percent className="w-4 h-4 mr-2" />
                      Discount Deal
                    </button>
                    <button
                      onClick={() => setDealType("product")}
                      className={`btn join-item ${dealType === "product" ? "btn-primary" : "btn-outline"
                        }`}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Product Showcase
                    </button>
                    <button
                      onClick={() => setDealType("promotion")}
                      className={`btn join-item ${dealType === "promotion" ? "btn-primary" : "btn-outline"
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
                            className={`p-3 border-b border-base-200 cursor-pointer hover:bg-base-200 transition-colors ${selectedProduct === product.id
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
                    disabled={isGenerating || !bannerTitle || !bannerDescription}
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
                    {generatedImageSrc ? (
                      <div className="space-y-4">
                        <img
                          src={generatedImageSrc}
                          alt="Generated Banner"
                          className="mx-auto max-w-full h-auto rounded-lg shadow-lg"
                          style={{ aspectRatio: "16/9" }}
                        />
                        <div className="text-sm text-base-content/70">
                          Generated with Google Imagen 4.0 (16:9 aspect ratio)
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-full h-64 bg-linear-to-r from-primary to-secondary rounded-lg flex items-center justify-center text-primary-content">
                          <div className="text-center max-w-md">
                            <h3 className="text-2xl font-bold mb-2">
                              {bannerTitle || "Banner headline preview"}
                            </h3>
                            <p className="text-sm opacity-80 mb-3">
                              {bannerDescription ||
                                "Add a compelling description to guide the AI."}
                            </p>
                            <button className="btn btn-outline btn-sm">
                              {getFallbackCta()}
                            </button>
                          </div>
                        </div>
                        {generatedBanner?.saved_path && (
                          <div className="text-sm text-base-content/60">
                            Saved path: {generatedBanner.saved_path}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Banner Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                    <div className="card bg-base-200">
                      <div className="card-body p-4">
                        <h4 className="card-title text-sm">Headline</h4>
                        <p className="text-base-content/80">
                          {bannerTitle || "Not provided"}
                        </p>
                      </div>
                    </div>
                    <div className="card bg-base-200">
                      <div className="card-body p-4">
                        <h4 className="card-title text-sm">Description</h4>
                        <p className="text-base-content/80">
                          {bannerDescription || "Not provided"}
                        </p>
                      </div>
                    </div>
                    <div className="card bg-base-200">
                      <div className="card-body p-4">
                        <h4 className="card-title text-sm">Campaign Focus</h4>
                        <p className="text-base-content/80">{dealSummary}</p>
                      </div>
                    </div>
                    <div className="card bg-base-200">
                      <div className="card-body p-4">
                        <h4 className="card-title text-sm">Target Segment</h4>
                        <p className="text-base-content/80 font-medium">
                          {selectedSegmentDetails?.name || "General audience"}
                        </p>
                        {selectedSegmentDetails && (
                          <div className="mt-2 text-xs text-base-content/60 space-y-1">
                            <p>
                              Size: {selectedSegmentDetails.user_count.toLocaleString()} users
                            </p>
                            <p>
                              Conversion: {selectedSegmentDetails.conversion_rate?.toFixed(1)}%
                            </p>
                            <p>
                              AOV: ${selectedSegmentDetails.avg_order_value?.toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {selectedProductDetails && (
                      <div className="card bg-base-200">
                        <div className="card-body p-4">
                          <h4 className="card-title text-sm">Product Focus</h4>
                          <p className="text-base-content/80 font-medium">
                            {selectedProductDetails.name}
                          </p>
                          <p className="text-sm text-base-content/70">
                            {(() => {
                              const categoryValue = selectedProductDetails.category;

                              if (!categoryValue) {
                                return "General";
                              }

                              if (typeof categoryValue === "string") {
                                return categoryValue;
                              }

                              return categoryValue.name ?? "General";
                            })()}
                          </p>
                          {selectedProductDetails.price && (
                            <p className="text-sm text-base-content/60 mt-2">
                              Price: ${selectedProductDetails.price}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="card bg-base-200">
                      <div className="card-body p-4">
                        <h4 className="card-title text-sm">Schedule</h4>
                        <p className="text-base-content/80">{scheduleSummary}</p>
                      </div>
                    </div>
                  </div>

                  <div className="card bg-base-200 mt-4">
                    <div className="card-body p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="card-title text-sm">Prompt Used</h4>
                        {generatedBanner?.banner_id && (
                          <span className="badge badge-outline">
                            {generatedBanner.banner_id}
                          </span>
                        )}
                      </div>
                      <pre className="text-xs text-base-content/70 bg-base-300 p-3 rounded whitespace-pre-wrap">
                        {generatedBanner.prompt}
                      </pre>
                    </div>
                  </div>
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
                    {banners.map((banner: any) => {
                      const imageSrc = resolveBannerImageSrc(banner);
                      const segmentMeta = resolveSegmentMeta(
                        banner.target_segment
                      );
                      const segmentLabel =
                        banner.target_segment_label ??
                        segmentMeta?.name ??
                        "General audience";

                      return (
                        <div
                          key={banner.id}
                          className="card bg-base-200 border border-base-300"
                        >
                          <div className="card-body p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-4">
                                  {imageSrc && (
                                    <div className="avatar">
                                      <div className="w-24 h-16 rounded">
                                        <img
                                          src={imageSrc}
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
                                        {segmentLabel}
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
                                        className={`badge gap-1 ${banner.status === "published"
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
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
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
                    ? ((totalClicks / totalImpressions) * 100)?.toFixed(2)
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
                            {segmentBanners.filter((b: any) => b.status === "published").length}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-base-content/70">
                            Total Banners:
                          </span>
                          <div className="badge badge-outline">
                            {segmentBanners.length}
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
                            ${segment.avg_order_value?.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* ... rest of analytics ... */}
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
//                         <div>AOV: ${segment.avg_order_value?.toFixed(2)}</div>
//                         <div>Conv: {segment.conversion_rate?.toFixed(1)}%</div>
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
//                     ? ((totalClicks / totalImpressions) * 100)?.toFixed(2)
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
//                           ${segment.avg_order_value?.toFixed(2)}
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
