import { useEffect, useMemo, useRef, useState } from "react";
import {
  useGetSegmentPerformanceAnalyticsQuery,
  useGetSegmentPerformanceQuery,
  useGetUserSegmentsQuery,
} from "../../../store/api/adminApi";

// --- TYPE DEFINITIONS ---
interface UserCluster {
  key: string;
  segment_id?: string;
  segment_name: string;
  user_count: number;
  avg_order_value: number;
  conversion_rate: number;
  revenue_contribution: number;
  orders_count?: number;
  revenue_per_member?: number;
  status?: string;
  is_active?: boolean;
}

interface Product {
  uniq_id: string;
  product_name: string;
  product_url: string;
  image_urls: string[];
  brand_name: string;
  category: string;
  selling_price: number;
  about_product: string;
}

interface BannerApiResponse {
  image_base64: string;
  saved_path: string;
}

const allProducts: Product[] = [
  {
    uniq_id: "f098f7ce1cb9c2c6168eaa7499229518",
    product_name: 'DB Longboards Phase 38" Maple Drop Through Longboard',
    product_url:
      "https://www.amazon.com/DB-Longboards-Through-Longboard-Complete/dp/B07KMWY3G6",
    image_urls: [
      "https://images-na.ssl-images-amazon.com/images/I/41p6eUocp0L.jpg",
      "https://images-na.ssl-images-amazon.com/images/I/31eXsUMwpCL.jpg",
      "https://images-na.ssl-images-amazon.com/images/I/41r-If4BrYL.jpg",
      "https://images-na.ssl-images-amazon.com/images/I/31bbYu9l1bL.jpg",
      "https://images-na.ssl-images-amazon.com/images/I/31BmSHVWMAL.jpg",
      "https://images-na.ssl-images-amazon.com/images/G/01/x-locale/common/transparent-pixel.jpg",
    ],
    brand_name: "",
    category:
      "Sports & Outdoors | Outdoor Recreation | Skates, Skateboards & Scooters | Skateboarding | Standard Skateboards & Longboards | Longboards",
    selling_price: 134.82,
    about_product:
      "Make sure this fits by entering your model number. | PERFECT EVERYDAY PUSHER: This board's cambered platform offers moderate flex that takes the vibration out of the road. The drop through mounting lowers the deck platform for more comfortable pushing. | COMPLETE SETUP: This longboard comes assembled with everything you need to cruise the streets in style & comfort: Atlas 180mm Ultralight trucks, Cloud Ride 69mm Cruiser Wheels and Lightning Bearings | INSPIRED BY THE NORTHWEST: Our founding ideal is chasing adventure & riding the best boards possible, inspired by the hills, waves, beaches & mountains all around our headquarters in the Northwest | BEST IN THE WORLD: DB was founded out of sheer love of longboarding with a mission to create the best custom longboards in the world, to do it sustainably, & to treat customers & employees like family | BEYOND COMPARE: Try our skateboards & accessories if you've tried similar products by Sector 9, Landyachtz, Arbor, Loaded, Globe, Orangatang, Hawgs, Powell-Peralta, Blood Orange, Caliber or Gullwing",
  },
  {
    uniq_id: "f2dc6f57e6f8c0569ad9fec75f8922c7",
    product_name: "BoneShieldz Skate Helmet",
    product_url:
      "https://www.amazon.com/BoneShieldz-H31-Skate-Helmet/dp/B07PWJ36PF",
    image_urls: [
      "https://images-na.ssl-images-amazon.com/images/I/416q6pJorkL.jpg",
      "https://images-na.ssl-images-amazon.com/images/I/41QCkgfvgzL.jpg",
      "https://images-na.ssl-images-amazon.com/images/I/51tkTHZtZlL.jpg",
      "https://images-na.ssl-images-amazon.com/images/G/01/x-locale/common/transparent-pixel.jpg",
    ],
    brand_name: "",
    category:
      "Sports & Outdoors | Outdoor Recreation | Skates, Skateboards & Scooters | Skateboarding | Protective Gear",
    selling_price: 30.0,
    about_product:
      "Features. Comfort pads. Maximum ventilation. | Adjustable dial fit system. Adjustable chin strap. Complies with CPSC safety standards.",
  },
  {
    uniq_id: "0a2a90c96c09ae2b7ef38e1d441058f8",
    product_name: "Smith Safety Gear Elite Knee Pads",
    product_url:
      "https://www.amazon.com/Smith-Safety-Gear-Leopard-X-Large/dp/B00KRBLMP4",
    image_urls: [
      "https://images-na.ssl-images-amazon.com/images/I/41PlCpUXYlL.jpg",
      "https://images-na.ssl-images-amazon.com/images/I/41FT42ZrlRL.jpg",
      "https://images-na.ssl-images-amazon.com/images/I/318KPefkVbL.jpg",
      "https://images-na.ssl-images-amazon.com/images/G/01/x-locale/common/transparent-pixel.jpg",
    ],
    brand_name: "",
    category:
      "Sports & Outdoors | Outdoor Recreation | Skates, Skateboards & Scooters | Skateboarding | Protective Gear",
    selling_price: 12.0,
    about_product:
      "Adjustable for snug fit to prevent slippage with open back butterfly straps. | Pads are washable. | Built for protection and comfort | Common Uses: Skateboarding, BMX, Inline, Roller Derby, and other extreme sports where protection is recommended.",
  },
  {
    uniq_id: "c881b55fb556457eb6c4d83537d702be",
    product_name: "Smith Safety Gear Leopard Elbow Pads",
    product_url:
      "https://www.amazon.com/Smith-Safety-Gear-Leopard-Medium/dp/B008O30AQO",
    image_urls: [
      "https://images-na.ssl-images-amazon.com/images/I/51SW9zgjXiL.jpg",
      "https://images-na.ssl-images-amazon.com/images/G/01/x-locale/common/transparent-pixel.jpg",
    ],
    brand_name: "",
    category:
      "Sports & Outdoors | Outdoor Recreation | Skates, Skateboards & Scooters | Skateboarding | Protective Gear | Elbow Pads",
    selling_price: 10.0,
    about_product:
      "Articulated design | Flexible and Contoured | Ultimate Protection | Great Fit and Comfort. | Common Uses: Skateboarding, BMX, Inline, Roller Derby, and other extreme sports where protection is recommended.",
  },
];

const BANNER_API_ENDPOINT = "http://localhost:8000/api/v1/recommendations/generate-banner";

function ProductBundleApp() {
  const {
    data: userSegments,
    isLoading: userSegmentsLoading,
    error: userSegmentsError,
  } = useGetUserSegmentsQuery({});
  const {
    data: segmentPerformance,
    isLoading: segmentPerformanceLoading,
    error: segmentPerformanceError,
  } = useGetSegmentPerformanceQuery({});
  const {
    data: segmentPerformanceAnalytics,
    isLoading: segmentAnalyticsLoading,
    error: segmentAnalyticsError,
  } = useGetSegmentPerformanceAnalyticsQuery({});

  const isSegmentsLoading =
    userSegmentsLoading || segmentPerformanceLoading || segmentAnalyticsLoading;

  const activeClusters = useMemo<UserCluster[]>(() => {
    const performanceList = Array.isArray(segmentPerformance)
      ? segmentPerformance
      : [];
    const analyticsList = Array.isArray(segmentPerformanceAnalytics)
      ? segmentPerformanceAnalytics
      : [];
    const segmentList = Array.isArray(userSegments) ? userSegments : [];

    const normalizeKey = (value?: string | number) =>
      (value ?? "")
        .toString()
        .trim()
        .toLowerCase();

    const toNumber = (value: any): number | null => {
      if (value === null || value === undefined) {
        return null;
      }

      if (typeof value === "number") {
        return Number.isNaN(value) ? null : value;
      }

      const parsed = Number(value);
      return Number.isNaN(parsed) ? null : parsed;
    };

    const coalesceNumber = (...values: any[]): number | null => {
      for (const value of values) {
        const parsed = toNumber(value);
        if (parsed !== null) {
          return parsed;
        }
      }

      return null;
    };

    const coalesceString = (...values: any[]): string | null => {
      for (const value of values) {
        if (typeof value === "string" && value.trim().length > 0) {
          return value;
        }
      }

      return null;
    };

    const metaByKey = new Map<string, any>();
    segmentList.forEach((meta) => {
      const key = normalizeKey(meta?.segment_id ?? meta?.segment_name ?? meta?.name);
      if (!key || metaByKey.has(key)) {
        return;
      }

      metaByKey.set(key, meta);
    });

    const analyticsByKey = new Map<string, any>();
    analyticsList.forEach((analytics) => {
      const key = normalizeKey(
        analytics?.segment_id ?? analytics?.segment_name ?? analytics?.name
      );
      if (!key || analyticsByKey.has(key)) {
        return;
      }

      analyticsByKey.set(key, analytics);
    });

    const buildCombinedSegment = (
      normalizedKey: string,
      {
        base,
        analytics,
        meta,
      }: {
        base?: any;
        analytics?: any;
        meta?: any;
      }
    ): UserCluster | null => {
      const segmentIdRaw =
        coalesceString(
          meta?.segment_id,
          meta?.id,
          base?.segment_id,
          base?.id,
          analytics?.segment_id,
          analytics?.id
        ) ?? null;

      const segmentName =
        coalesceString(
          analytics?.segment_name,
          analytics?.name,
          base?.segment_name,
          base?.name,
          meta?.segment_name,
          meta?.name,
          segmentIdRaw,
          normalizedKey
        ) ?? "Unnamed Segment";

      const userCount =
        coalesceNumber(
          analytics?.member_count,
          analytics?.user_count,
          base?.user_count,
          base?.member_count,
          meta?.member_count
        ) ?? 0;

      const ordersCount =
        coalesceNumber(
          analytics?.orders_count,
          base?.orders_count,
          meta?.orders_count
        ) ?? 0;

      const totalRevenue =
        coalesceNumber(
          analytics?.total_revenue,
          analytics?.revenue_contribution,
          base?.total_revenue,
          base?.revenue_contribution,
          meta?.total_revenue
        ) ?? 0;

      let avgOrderValue =
        coalesceNumber(
          analytics?.avg_order_value,
          base?.avg_order_value,
          base?.average_order_value,
          meta?.avg_order_value
        );

      if (
        (avgOrderValue === null || avgOrderValue === undefined) &&
        ordersCount > 0
      ) {
        avgOrderValue = totalRevenue / ordersCount;
      }

      if (
        (avgOrderValue === null || avgOrderValue === undefined) &&
        userCount > 0
      ) {
        avgOrderValue = totalRevenue / userCount;
      }

      if (avgOrderValue === null || avgOrderValue === undefined) {
        avgOrderValue = 0;
      }

      let conversionRate =
        coalesceNumber(
          analytics?.conversion_rate,
          base?.conversion_rate,
          meta?.conversion_rate
        );

      if (
        (conversionRate === null || conversionRate === undefined) &&
        userCount > 0
      ) {
        conversionRate = (ordersCount / userCount) * 100;
      }

      if (conversionRate === null || conversionRate === undefined) {
        conversionRate = 0;
      }

      let revenuePerMember =
        coalesceNumber(
          analytics?.revenue_per_member,
          base?.revenue_per_member,
          meta?.revenue_per_member
        );

      if (
        (revenuePerMember === null || revenuePerMember === undefined) &&
        userCount > 0
      ) {
        revenuePerMember = totalRevenue / userCount;
      }

      if (revenuePerMember === null || revenuePerMember === undefined) {
        revenuePerMember = 0;
      }

      const status = coalesceString(
        meta?.status,
        base?.status,
        analytics?.status
      );

      const isActiveFlag = (() => {
        if (typeof meta?.is_active === "boolean") {
          return meta.is_active;
        }

        if (typeof base?.is_active === "boolean") {
          return base.is_active;
        }

        if (typeof analytics?.is_active === "boolean") {
          return analytics.is_active;
        }

        if (status) {
          return status.toLowerCase() === "active";
        }

        return userCount > 0;
      })();

      const stableKey =
        coalesceString(
          segmentIdRaw,
          analytics?.segment_name,
          base?.segment_name,
          meta?.segment_name,
          segmentName
        ) ?? normalizedKey;

      const finalAvgOrderValue = avgOrderValue ?? 0;
      const finalConversionRate = conversionRate ?? 0;
      const finalRevenuePerMember = revenuePerMember ?? 0;

      return {
        key: stableKey,
        segment_id: segmentIdRaw ?? stableKey,
        segment_name: segmentName,
        user_count: userCount,
        avg_order_value: finalAvgOrderValue,
        conversion_rate: finalConversionRate,
        revenue_contribution: totalRevenue,
        orders_count: ordersCount,
        revenue_per_member: finalRevenuePerMember,
        status,
        is_active: isActiveFlag,
      };
    };

    const seenKeys = new Set<string>();
    const combined: UserCluster[] = [];

    performanceList.forEach((segment) => {
      const normalizedKey = normalizeKey(
        segment?.segment_id ?? segment?.segment_name ?? segment?.name
      );
      if (!normalizedKey) {
        return;
      }

      const combinedSegment = buildCombinedSegment(normalizedKey, {
        base: segment,
        analytics: analyticsByKey.get(normalizedKey),
        meta: metaByKey.get(normalizedKey),
      });

      if (combinedSegment) {
        combined.push(combinedSegment);
        seenKeys.add(normalizedKey);
      }
    });

    analyticsList.forEach((segment) => {
      const normalizedKey = normalizeKey(
        segment?.segment_id ?? segment?.segment_name ?? segment?.name
      );
      if (!normalizedKey || seenKeys.has(normalizedKey)) {
        return;
      }

      const combinedSegment = buildCombinedSegment(normalizedKey, {
        analytics: segment,
        meta: metaByKey.get(normalizedKey),
      });

      if (combinedSegment) {
        combined.push(combinedSegment);
        seenKeys.add(normalizedKey);
      }
    });

    segmentList.forEach((meta) => {
      const normalizedKey = normalizeKey(
        meta?.segment_id ?? meta?.segment_name ?? meta?.name
      );
      if (!normalizedKey || seenKeys.has(normalizedKey)) {
        return;
      }

      const combinedSegment = buildCombinedSegment(normalizedKey, {
        meta,
      });

      if (combinedSegment) {
        combined.push(combinedSegment);
        seenKeys.add(normalizedKey);
      }
    });

    return combined
      .filter((segment) => segment.is_active !== false)
      .sort((a, b) => (b.user_count ?? 0) - (a.user_count ?? 0));
  }, [segmentPerformance, segmentPerformanceAnalytics, userSegments]);

  const [isClusterDropdownOpen, setIsClusterDropdownOpen] = useState(false);
  const [selectedSegmentKey, setSelectedSegmentKey] =
    useState<string | null>(null);

  const clusterDropdownRef = useRef<HTMLDivElement>(null);
  const clusterButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!selectedSegmentKey) {
      return;
    }

    const hasMatch = activeClusters.some(
      (cluster) => cluster.key === selectedSegmentKey
    );

    if (!hasMatch) {
      setSelectedSegmentKey(null);
    }
  }, [activeClusters, selectedSegmentKey]);

  const selectedCluster = useMemo(() => {
    if (!selectedSegmentKey) {
      return null;
    }

    return (
      activeClusters.find((cluster) => cluster.key === selectedSegmentKey) ??
      null
    );
  }, [activeClusters, selectedSegmentKey]);

  useEffect(() => {
    if (!isClusterDropdownOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!clusterDropdownRef.current) {
        return;
      }

      if (target && clusterDropdownRef.current.contains(target)) {
        return;
      }

      setIsClusterDropdownOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsClusterDropdownOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isClusterDropdownOpen]);

  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [bundleName, setBundleName] = useState("");
  const [bundleDescription, setBundleDescription] = useState("");
  const [discount, setDiscount] = useState<number>(20); // Default discount
  const [generatedBanner, setGeneratedBanner] = useState("");
  const [isBannerLoading, setIsBannerLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const previewModalRef = useRef<HTMLDialogElement>(null);

  const bundleTotalPrice = useMemo(() => {
    return selectedProducts.reduce(
      (total, product) => total + product.selling_price,
      0
    );
  }, [selectedProducts]);

  const offerPrice = useMemo(() => {
    if (discount <= 0 || discount >= 100) return bundleTotalPrice;
    return bundleTotalPrice * (1 - discount / 100);
  }, [bundleTotalPrice, discount]);

  const isPreviewReady = Boolean(
    bundleName && selectedProducts.length > 0 && selectedCluster
  );

  const segmentsError =
    userSegmentsError ?? segmentPerformanceError ?? segmentAnalyticsError;

  const clusterButtonLabel = selectedCluster
    ? selectedCluster.segment_name
    : isSegmentsLoading
      ? "Loading clusters..."
      : activeClusters.length
        ? "Choose a Cluster"
        : segmentsError
          ? "Failed to load clusters"
          : "No active clusters";

  const dropdownEnabled = !isSegmentsLoading && activeClusters.length > 0;

  useEffect(() => {
    if (!dropdownEnabled && isClusterDropdownOpen) {
      setIsClusterDropdownOpen(false);
    }
  }, [dropdownEnabled, isClusterDropdownOpen]);

  const handleProductToggle = (product: Product) => {
    setSelectedProducts((prev) => {
      const isSelected = prev.some((p) => p.uniq_id === product.uniq_id);
      return isSelected
        ? prev.filter((p) => p.uniq_id !== product.uniq_id)
        : [...prev, product];
    });
  };

  const handleGenerateBanner = async () => {
    if (!selectedCluster || selectedProducts.length === 0 || !bundleName) {
      setApiError(
        "Please select a cluster, add products, and enter a bundle name first."
      );
      return;
    }

    setIsBannerLoading(true);
    setGeneratedBanner("");
    setApiError("");

    const mainProduct = selectedProducts[0];
    const prompt = `Generate an e-commerce homepage banner for this ad: "For our valued ${selectedCluster.segment_name}, we present the '${bundleName}'. This bundle features awesome products like the ${mainProduct.product_name}. Deal: This festival, get ${discount}% off!" Make the banner visually appealing, modern, and energetic, focusing on the discount.`;

    try {
      const response = await fetch(BANNER_API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ prompt }),
      });
      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
      const data: BannerApiResponse = await response.json();
      setGeneratedBanner(`data:image/jpeg;base64,${data.image_base64}`);
    } catch (error: any) {
      setApiError(
        error.message || "Failed to generate banner. Is the API server running?"
      );
    } finally {
      setIsBannerLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans">
      <header className=" p-6 text-primary-content">
        <div className="">
          <h1 className="text-3xl font-bold">Bundle Creation Panel</h1>
          <p className="opacity-80 mt-1">
            Design targeted product bundles with ease.
          </p>
        </div>
      </header>

      <div className="p-4 md:p-8">
        <main className=" mx-auto bg-base-100 rounded-2xl shadow-lg p-6 md:p-8 space-y-12">
          <section>
            <h2 className="text-xl  flex items-center gap-4">
              <span className="bg-primary text-primary-content h-7 w-7 rounded-full flex items-center justify-center text-lg">
                1
              </span>
              Target a User Cluster
            </h2>
            <div className="mt-6 p-6 bg-base-200 rounded-lg">
              <div
                ref={clusterDropdownRef}
                className="relative"   // remove DaisyUI's `dropdown` class
              >
                <button
                  type="button"
                  ref={clusterButtonRef}
                  className={`btn btn-primary lg:btn-wide ${dropdownEnabled ? "" : "btn-disabled"
                    }`}
                  disabled={!dropdownEnabled}
                  onClick={() => {
                    if (dropdownEnabled) setIsClusterDropdownOpen(prev => !prev);
                  }}
                >
                  {clusterButtonLabel}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 ml-2 transition-transform duration-200 ${isClusterDropdownOpen ? "rotate-180" : ""
                      }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isClusterDropdownOpen && (
                  <ul
                    ref={clusterDropdownRef}
                    role="listbox"
                    className="absolute mt-2 left-0 z-50 w-64 menu p-2 shadow bg-base-100 rounded-box max-h-80 overflow-y-auto"
                  >
                    {activeClusters.map((cluster) => (
                      <li key={cluster.key}>
                        <button
                          type="button"
                          className={`flex flex-col gap-0.5 rounded-lg px-3 py-2 text-left hover:bg-primary/10 ${selectedSegmentKey === cluster.key
                            ? "bg-primary/10 text-primary"
                            : ""
                            }`}
                          onClick={() => {
                            setSelectedSegmentKey(cluster.key);
                            setIsClusterDropdownOpen(false); // <-- main close event
                            clusterButtonRef.current?.focus();
                          }}
                        >
                          <span className="font-semibold">{cluster.segment_name}</span>
                          <span className="text-xs text-base-content/60">
                            {cluster.user_count.toLocaleString()} users
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {segmentsError && !isSegmentsLoading && (
                <p className="text-xs text-error mt-3">
                  Unable to load active segments. Please verify the segmentation
                  service.
                </p>
              )}
              {/* --- CORRECTED SECTION: STATS ARE NOW SHOWN --- */}
              {selectedCluster && (
                <div className="stats stats-vertical lg:stats-horizontal shadow mt-6 w-full bg-base-100">
                  <div className="stat">
                    <div className="stat-figure text-secondary">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        className="inline-block w-8 h-8 stroke-current"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        ></path>
                      </svg>
                    </div>
                    <div className="stat-title">Users</div>
                    <div className="stat-value text-light">
                      {selectedCluster.user_count}
                    </div>
                  </div>
                  <div className="stat">
                    <div className="stat-figure text-secondary">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        className="inline-block w-8 h-8 stroke-current"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 12v.01M12 12a2 2 0 00-2 2m2-2a2 2 0 012 2m0 0a2 2 0 01-2 2m2-2V15m0 1a2 2 0 00-2-2M6 6h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z"
                        ></path>
                      </svg>
                    </div>
                    <div className="stat-title">Avg Order Value</div>
                    <div className="stat-value">
                      ${selectedCluster.avg_order_value?.toFixed(2)}
                    </div>
                  </div>
                  <div className="stat">
                    <div className="stat-figure text-secondary">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        className="inline-block w-8 h-8 stroke-current"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        ></path>
                      </svg>
                    </div>
                    <div className="stat-title">Total Revenue</div>
                    <div className="stat-value">
                      ${selectedCluster.revenue_contribution.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {selectedCluster && (
            <section>
              <div className="flex w-full items-center justify-between">
                <h2 className="text-xl  flex items-center gap-4">
                  <span className="bg-primary text-primary-content h-7 w-7 rounded-full flex items-center justify-center text-xl ">
                    2
                  </span>
                  Build Your Bundle
                </h2>
                <div className="flex badge bg-primary p-2">
                  Based on Most Frequent Purchases
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
                {allProducts.map((product) => {
                  const isSelected = selectedProducts.some(
                    (p) => p.uniq_id === product.uniq_id
                  );
                  return (
                    <div
                      key={product.uniq_id}
                      onClick={() => handleProductToggle(product)}
                      className={`card bg-base-200 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border-2 ${isSelected ? "border-primary" : "border-transparent"
                        }`}
                    >
                      <figure className="relative">
                        <img
                          src={product.image_urls[0]}
                          alt={product.product_name}
                          className="h-48 w-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-primary rounded-full p-1 text-primary-content">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </figure>
                      <div className="card-body p-4 flex flex-col justify-between min-h-[8rem]">
                        <h3 className="card-title text-base leading-tight line-clamp-2">
                          {product.product_name}
                        </h3>

                        <div className="mt-auto flex items-center justify-between">
                          <p className="text-sm opacity-70 truncate">{product.brand_name}</p>
                          <p className="font-bold text-lg text-secondary">
                            ${product.selling_price?.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {selectedProducts.length > 0 && (
            <>
              <section>
                <h2 className="text-xl flex items-center gap-4">
                  <span className="bg-primary text-primary-content h-7 w-7 rounded-full flex items-center justify-center text-xl ">
                    3
                  </span>
                  Define & Decorate
                </h2>
                <div className="grid md:grid-cols-2 gap-8 mt-6">
                  <div className="space-y-4 p-6 bg-base-200 rounded-lg">
                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text font-semibold">
                          Bundle Name
                        </span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., 'Ultimate Skater Starter Pack'"
                        className="input input-bordered w-full"
                        value={bundleName}
                        onChange={(e) => setBundleName(e.target.value)}
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text font-semibold">
                          Bundle Description
                        </span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered h-24 block w-full"
                        placeholder="A catchy description for the bundle."
                        value={bundleDescription}
                        onChange={(e) => setBundleDescription(e.target.value)}
                      ></textarea>
                    </div>
                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text font-semibold">
                          Discount (%)
                        </span>
                      </label>
                      <input
                        type="number"
                        placeholder="e.g., 20"
                        className="input input-bordered w-full"
                        value={discount}
                        onChange={(e) =>
                          setDiscount(
                            Math.max(0, Math.min(100, Number(e.target.value)))
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center p-6 bg-base-200 rounded-lg space-y-4">
                    <button
                      className="btn btn-secondary btn-wide"
                      onClick={handleGenerateBanner}
                      disabled={isBannerLoading}
                    >
                      {isBannerLoading ? (
                        <span className="loading loading-spinner"></span>
                      ) : (
                        "Generate Banner with AI"
                      )}
                    </button>
                    {apiError && (
                      <p className="text-error text-xs text-center">
                        {apiError}
                      </p>
                    )}
                    {generatedBanner && (
                      <img
                        src={generatedBanner}
                        alt="Generated bundle banner"
                        className="w-full object-cover rounded-lg shadow-md mt-4 h-40"
                      />
                    )}
                  </div>
                </div>
              </section>

              <section className="text-center">
                <h2 className="text-xl flex items-center gap-4 justify-center">
                  <span className="bg-primary text-primary-content h-7 w-7 rounded-full flex items-center justify-center text-xl ">
                    4
                  </span>
                  Preview & Finalize
                </h2>
                <button
                  className="btn btn-accent btn-lg mt-6"
                  onClick={() => previewModalRef.current?.showModal()}
                  disabled={!isPreviewReady}
                >
                  Show Live Preview
                </button>
              </section>
            </>
          )}
        </main>
      </div>

      <dialog ref={previewModalRef} className="modal">
        <div className="modal-box w-11/12 max-w-6xl">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 z-10">
              ✕
            </button>
          </form>
          <div className="mockup-browser border-base-300 border w-full">
            <div className="mockup-browser-toolbar">
              <div className="input">https://smartshop.com/your-bundle</div>
            </div>

            <div className="grid md:grid-cols-2 gap-x-12 p-4 md:p-8">
              <div className="space-y-6">
                {generatedBanner ? (
                  <img
                    src={generatedBanner}
                    alt="Bundle banner"
                    className="w-full h-80 object-cover rounded-2xl shadow-lg bg-base-300"
                  />
                ) : (
                  <div className="h-80 bg-base-300 rounded-2xl flex items-center justify-center text-base-content/40">
                    Banner Preview
                  </div>
                )}
                <div>
                  <h2 className="text-4xl lg:text-5xl font-extrabold">
                    {bundleName || "Your Awesome Bundle"}
                  </h2>
                  <p className="py-4 text-base-content/70">
                    {bundleDescription ||
                      "This is where the compelling description will go, enticing customers to buy."}
                  </p>
                </div>
              </div>

              <div className="flex flex-col space-y-6 mt-8 md:mt-0">
                <div>
                  <h3 className="text-2xl font-bold mb-4">What's Included</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2 bg-base-200/50 p-4 rounded-lg">
                    {selectedProducts.map((product) => (
                      <div
                        key={product.uniq_id}
                        className="flex justify-between items-center bg-base-100 p-3 rounded-lg shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={product.image_urls[0]}
                            alt={product.product_name}
                            className="w-14 h-14 rounded-md object-cover"
                          />
                          <div>
                            <div className="font-medium text-sm">
                              {product.product_name}
                            </div>
                            <div className="text-xs opacity-60">
                              {product.brand_name}
                            </div>
                          </div>
                        </div>
                        <span className="font-semibold text-base">
                          ${product.selling_price?.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-base-200 p-6 rounded-2xl space-y-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-lg opacity-60">Total Value</span>
                    <del className="text-xl opacity-60">
                      ${bundleTotalPrice?.toFixed(2)}
                    </del>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-accent">
                      Your Offer
                    </span>
                    <div className="text-right">
                      <p className="text-4xl font-black text-accent">
                        ${offerPrice?.toFixed(2)}
                      </p>
                      <span className="badge badge-accent badge-outline font-bold">
                        You Save {discount}%
                      </span>
                    </div>
                  </div>
                  <button className="btn btn-accent btn-block btn-lg mt-4">
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}

export default ProductBundleApp;
