/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Brain,
  ChevronDown,
  ChevronUp,
  Edit,
  Eye,
  MousePointer,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Save,
  ShoppingCart,
  Settings,
  Target,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useActivateMlConfigMutation,
  useCreateUserSegmentMutation,
  useGetAdminDashboardQuery,
  useGetMlConfigsQuery,
  useGetModelPerformanceQuery,
  useGetRecommendationPerformanceQuery,
  useGetSegmentPerformanceAnalyticsQuery,
  useGetSegmentPerformanceQuery,
  useGetSegmentUsersQuery,
  useGetUserSegmentsQuery,
  useRecalculateSegmentMutation,
  useTrainModelsMutation,
} from "../../../store/api/adminApi";
import { toast } from "react-hot-toast";

// ML Model Management Component
const MLModelManagement = () => {
  const [selectedModel, setSelectedModel] = useState(null);
  const [trainingProgress, setTrainingProgress] = useState({});
  const [modelOverrides, setModelOverrides] = useState<Record<string, any>>({});
  const modelOrderRef = useRef<string[]>([]);

  const {
    data: mlConfigs,
    isLoading: modelsLoading,
    error: modelsError,
    refetch: refetchModels,
  } = useGetMlConfigsQuery({});

  const [trainModel] = useTrainModelsMutation();
  const [toggleModel] = useActivateMlConfigMutation();

  useEffect(() => {
    if (!mlConfigs) {
      modelOrderRef.current = [];
      return;
    }

    const currentOrder = modelOrderRef.current;
    const incomingIds = mlConfigs.map((model: any) => model.id);

    const filteredExisting = currentOrder.filter((id) => incomingIds.includes(id));
    const newIds = incomingIds.filter((id) => !filteredExisting.includes(id));

    modelOrderRef.current = [...filteredExisting, ...newIds];
  }, [mlConfigs]);

  const normalizedModels = useMemo(() => {
    if (!mlConfigs) {
      return [];
    }

    const coalesceNumber = (...values: any[]) => {
      for (const value of values) {
        if (value === null || value === undefined) {
          continue;
        }

        const numeric =
          typeof value === "string" ? parseFloat(value) : value;

        if (typeof numeric === "number" && Number.isFinite(numeric)) {
          return numeric;
        }
      }

      return null;
    };

    const coalesceDate = (...values: any[]) => {
      for (const value of values) {
        if (!value) {
          continue;
        }

        const date = new Date(value);

        if (!Number.isNaN(date.getTime())) {
          return date.toISOString();
        }
      }

      return null;
    };

    const mapped = mlConfigs.map((model: any) => {
      const metrics = model.metrics ?? model.performance ?? {};
      const overrides = modelOverrides[model.id] ?? {};

      const accuracy = coalesceNumber(
        overrides.accuracy,
        model.accuracy,
        model.accuracy_score,
        metrics.accuracy,
        metrics.accuracy_score
      );

      const precision = coalesceNumber(
        overrides.precision,
        model.precision,
        model.precision_score,
        metrics.precision,
        metrics.precision_score
      );

      const recall = coalesceNumber(
        overrides.recall,
        model.recall,
        model.recall_score,
        metrics.recall,
        metrics.recall_score
      );

      const f1Score =
        coalesceNumber(
          overrides.f1_score,
          model.f1_score,
          metrics.f1_score
        ) ??
        (precision !== null &&
          recall !== null &&
          precision + recall > 0
          ? (2 * precision * recall) / (precision + recall)
          : null);

      const lastTrained = coalesceDate(
        overrides.last_trained,
        model.last_trained,
        model.last_trained_at,
        model.last_training_time,
        model.latest_training_time,
        model.updated_at,
        metrics.last_trained,
        metrics.lastTrained
      );

      const modelId =
        model.id ?? model.config_id ?? model.model_id ?? model.name;

      const displayName =
        model.model_name ?? model.name ?? model.model_type ?? modelId;

      return {
        ...model,
        id: modelId,
        model_name: displayName,
        model_type:
          model.model_type ??
          model.model_name ??
          model.name ??
          "Unknown Model",
        is_active:
          typeof overrides.is_active === "boolean"
            ? overrides.is_active
            : model.is_active ?? model.active ?? model.enabled ?? false,
        training_status:
          overrides.training_status ??
          model.training_status ??
          model.status ??
          "idle",
        accuracy,
        precision,
        recall,
        f1_score: f1Score,
        last_trained: lastTrained,
        total_recommendations:
          overrides.total_recommendations ??
          metrics.total_recommendations ??
          metrics.totalRecommendations ??
          model.total_recommendations ??
          0,
        run_time:
          overrides.run_time ??
          metrics.run_time ??
          metrics.runtime ??
          model.run_time ??
          null,
      };
    });

    const sorted = [...mapped];

    if (modelOrderRef.current.length > 0) {
      sorted.sort((a, b) => {
        const order = modelOrderRef.current;
        const indexA = order.indexOf(a.id);
        const indexB = order.indexOf(b.id);

        if (indexA === -1 && indexB === -1) {
          return a.model_name.localeCompare(b.model_name);
        }

        if (indexA === -1) {
          return 1;
        }

        if (indexB === -1) {
          return -1;
        }

        return indexA - indexB;
      });
    } else {
      sorted.sort((a, b) => a.model_name.localeCompare(b.model_name));
    }

    return sorted;
  }, [mlConfigs, modelOverrides]);

  const handleTrainModel = async (model: any) => {
    if (!model) {
      return;
    }

    const modelId =
      model.id ?? model.config_id ?? model.model_id ?? model.model_name;

    if (!modelId) {
      console.warn("Unable to determine model identifier for training", model);
      return;
    }

    const targetModelName =
      model.model_name ?? model.name ?? model.model_type ?? modelId;

    setTrainingProgress((prev) => ({ ...prev, [modelId]: 0 }));

    setModelOverrides((prev) => ({
      ...prev,
      [modelId]: {
        ...(prev?.[modelId] ?? {}),
        training_status: "training",
      },
    }));

    try {
      await trainModel({
        retrain_all: false,
        specific_models: targetModelName ? [targetModelName] : undefined,
      }).unwrap();

      const progressInterval = setInterval(() => {
        setTrainingProgress((prev) => {
          const current = prev[modelId] ?? 0;
          if (current >= 100) {
            clearInterval(progressInterval);
            return { ...prev, [modelId]: 100 };
          }

          return { ...prev, [modelId]: Math.min(current + 10, 100) };
        });
      }, 1000);

      setTimeout(() => {
        clearInterval(progressInterval);
        setTrainingProgress((prev) => ({ ...prev, [modelId]: null }));
        setModelOverrides((prev) => ({
          ...prev,
          [modelId]: {
            ...(prev?.[modelId] ?? {}),
            training_status: "idle",
            last_trained: new Date().toISOString(),
          },
        }));

        refetchModels();
        alert(`Training completed successfully for ${targetModelName}`);
      }, 12000);
    } catch (error) {
      console.error("Training failed:", error);
      setTrainingProgress((prev) => ({ ...prev, [modelId]: null }));
      setModelOverrides((prev) => ({
        ...prev,
        [modelId]: {
          ...(prev?.[modelId] ?? {}),
          training_status: "error",
        },
      }));

      alert("Failed to trigger training for this model. Please try again.");
    }
  };

  const handleToggleModel = async (configId: string) => {
    try {
      await toggleModel(configId).unwrap();
      refetchModels();
      alert("Model status updated successfully");
    } catch (error) {
      console.error("Toggle failed:", error);
      alert("Failed to update model status");
    }
  };

  if (modelsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  if (modelsError) {
    return (
      <div className="alert alert-error shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h3 className="font-bold">Failed to load ML models</h3>
          <div className="text-xs">Please try refreshing the page</div>
        </div>
        <button onClick={() => refetchModels()} className="btn btn-sm btn-outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ML Models Overview */}
      {selectedModel && (
        <ModelPerformanceCharts model={selectedModel} />
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card bg-base-100 border border-base-300 shadow-lg">
            <div className="card-body">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Brain className="w-6 h-6 text-primary" />
                  ML Models
                </h3>
                <button
                  onClick={refetchModels}
                  className="btn btn-ghost btn-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {normalizedModels.map((model: any) => (
                  <motion.div
                    key={model.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedModel?.id === model.id
                        ? "border-primary bg-primary/5"
                        : "border-base-300 hover:border-primary/50"
                      }`}
                    onClick={() => setSelectedModel(model)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2 rounded-lg ${model.is_active
                              ? "bg-success/10 text-success"
                              : "bg-base-300 text-base-content/50"
                            }`}
                        >
                          <Brain className="w-5 h-5" />
                        </div>

                        <div>
                          <h4 className="font-medium text-lg">
                            {model.model_name}
                          </h4>
                          <p className="text-sm text-base-content/60">
                            {model.model_type}
                          </p>
                          {model.description && (
                            <p className="text-xs text-base-content/50 mt-1">
                              {model.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Training Progress */}
                        {trainingProgress[model.id] !== undefined &&
                          trainingProgress[model.id] !== null && (
                            <div className="flex items-center gap-2">
                              <div
                                className="radial-progress text-primary text-sm"
                                style={{
                                  "--value": trainingProgress[model.id],
                                }}
                              >
                                {trainingProgress[model.id]}%
                              </div>
                              <span className="text-xs">Training...</span>
                            </div>
                          )}

                        {/* Model Status */}
                        <div
                          className={`badge ${model.is_active ? "badge-success" : "badge-ghost"
                            }`}
                        >
                          {model.is_active ? "Active" : "Inactive"}
                        </div>

                        {/* Accuracy Score */}
                        {model.accuracy !== null && model.accuracy !== undefined && (
                          <div className="text-sm">
                            <span className="text-base-content/60">
                              Accuracy:{" "}
                            </span>
                            <span className="font-medium text-success">
                              {(model.accuracy * 100).toFixed(1)}%
                            </span>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTrainModel(model);
                            }}
                            disabled={
                              trainingProgress[model.id] !==
                              undefined &&
                              trainingProgress[model.id] !== null
                            }
                            className="btn btn-sm btn-primary btn-outline"
                          >
                            {/* <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTrainModel(model.config_id);
                            }}
                            disabled={
                              trainingProgress[model.config_id] !== undefined &&
                              trainingProgress[model.config_id] !== null
                            }
                            className="btn btn-sm btn-primary btn-outline"
                          ></button> */}
                            <Play className="w-4 h-4" />
                            Train
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleModel(model.id);
                            }}
                            className={`btn btn-sm ${model.is_active ? "btn-warning" : "btn-success"
                              }`}
                          >
                            {model.is_active ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                            {model.is_active ? "Disable" : "Enable"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Additional Model Info */}
                    <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-base-300">
                      <div className="text-center">
                        <p className="text-xs text-base-content/60">
                          Last Trained
                        </p>
                        <p className="font-medium text-sm">
                          {model.last_trained
                            ? new Date(model.last_trained).toLocaleString()
                            : "Not trained yet"}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-base-content/60">
                          Precision
                        </p>
                        <p className="font-medium text-sm">
                          {model.precision !== null && model.precision !== undefined
                            ? (model.precision * 100).toFixed(1) + "%"
                            : "N/A"}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-base-content/60">Recall</p>
                        <p className="font-medium text-sm">
                          {model.recall !== null && model.recall !== undefined
                            ? (model.recall * 100).toFixed(1) + "%"
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Model Details Panel */}
        <div className="card bg-base-100 border border-base-300 shadow-lg">
          <div className="card-body">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Model Details
            </h3>

            {selectedModel ? (
              <ModelDetailsPanel model={selectedModel} />
            ) : (
              <div className="text-center text-base-content/60 py-8">
                <Brain className="w-12 h-12 mx-auto mb-4 text-base-content/30" />
                <p>Select a model to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Model Performance Charts */}
    </div>
  );
};

// Model Details Panel Component
const ModelDetailsPanel = ({ model }) => {
  const { data: modelPerformance, isLoading: performanceLoading } =
    useGetModelPerformanceQuery({ configId: model.id });

  const coalesceMetric = (...values: any[]) => {
    for (const value of values) {
      if (value === null || value === undefined) {
        continue;
      }

      const numeric =
        typeof value === "string" ? parseFloat(value) : value;

      if (typeof numeric === "number" && Number.isFinite(numeric)) {
        return numeric;
      }
    }

    return null;
  };

  const accuracy = coalesceMetric(model?.accuracy, model?.accuracy_score);
  const precision = coalesceMetric(
    model?.precision,
    model?.precision_score
  );
  const recall = coalesceMetric(model?.recall, model?.recall_score);
  const f1Score = coalesceMetric(model?.f1_score) ??
    (precision !== null &&
      recall !== null &&
      precision + recall > 0
      ? (2 * precision * recall) / (precision + recall)
      : null);

  const formatPercentage = (value: number | null) =>
    value !== null && value !== undefined
      ? `${(value * 100).toFixed(1)}%`
      : "N/A";

  const livePerformance = modelPerformance?.recommendation_performance ?? {};
  const liveTotalRecommendations = Number(
    livePerformance.total_recommendations ??
    livePerformance.totalRecommendations ??
    0
  );
  const liveClickRate =
    coalesceMetric(
      livePerformance.click_through_rate,
      livePerformance.click_rate,
      livePerformance.ctr,
      livePerformance.clickThroughRate
    ) ?? 0;
  const liveConversionRate =
    coalesceMetric(
      livePerformance.conversion_rate,
      livePerformance.conversionRate
    ) ?? 0;

  return (
    <div className="space-y-4">
      {/* Model Status */}
      <div className="p-4 bg-base-200/50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Status</span>
          <div
            className={`flex items-center gap-2 ${model.is_active ? "text-success" : "text-base-content/50"
              }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${model.is_active
                  ? "bg-success animate-pulse"
                  : "bg-base-content/30"
                }`}
            ></div>
            <span className="text-sm">
              {model.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Performance Metrics</h4>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-success/10 rounded-lg border border-success/20">
            <p className="text-xs text-success">Accuracy</p>
            <p className="font-bold text-success">
              {formatPercentage(accuracy)}
            </p>
          </div>

          <div className="p-3 bg-info/10 rounded-lg border border-info/20">
            <p className="text-xs text-info">Precision</p>
            <p className="font-bold text-info">
              {formatPercentage(precision)}
            </p>
          </div>

          <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
            <p className="text-xs text-warning">Recall</p>
            <p className="font-bold text-warning">
              {formatPercentage(recall)}
            </p>
          </div>

          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-xs text-primary">F1 Score</p>
            <p className="font-bold text-primary">
              {formatPercentage(f1Score)}
            </p>
          </div>
        </div>
      </div>

      {/* Real-time Performance */}
      {performanceLoading ? (
        <div className="text-center py-4">
          <div className="loading loading-spinner loading-sm"></div>
        </div>
      ) : (
        modelPerformance && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Live Performance (30 days)</h4>

            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-base-200/50 rounded">
                <span className="text-sm flex items-center gap-2">
                  <Eye className="w-3 h-3" />
                  Recommendations
                </span>
                <span className="font-medium">
                  {liveTotalRecommendations.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center p-2 bg-base-200/50 rounded">
                <span className="text-sm flex items-center gap-2">
                  <MousePointer className="w-3 h-3" />
                  Click-through Rate
                </span>
                <span className="font-medium text-primary">
                  {liveClickRate.toFixed(2)}%
                </span>
              </div>

              <div className="flex justify-between items-center p-2 bg-base-200/50 rounded">
                <span className="text-sm flex items-center gap-2">
                  <ShoppingCart className="w-3 h-3" />
                  Conversion Rate
                </span>
                <span className="font-medium text-success">
                  {liveConversionRate.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        )
      )}

      {/* Model Configuration */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Configuration</h4>
        <div className="p-3 bg-base-200/50 rounded-lg">
          <pre className="text-xs text-base-content/70 whitespace-pre-wrap">
            {JSON.stringify(model.parameters, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

// Model Performance Charts Component

const ModelPerformanceCharts = ({ model }) => {
  const configId = model?.id;
  const modelDisplayName =
    model?.model_name ?? model?.model_type ?? "Model";

  const { data: modelPerformance, isLoading } = useGetModelPerformanceQuery(
    { configId },
    { skip: !configId }
  );

  const coalesceNumber = (...values: any[]) => {
    for (const value of values) {
      if (value === null || value === undefined) {
        continue;
      }

      const numeric =
        typeof value === "string" ? parseFloat(value) : value;

      if (typeof numeric === "number" && Number.isFinite(numeric)) {
        return numeric;
      }
    }

    return null;
  };

  if (!configId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  if (!modelPerformance) {
    return (
      <div className="card bg-base-100 border border-base-300 shadow-lg">
        <div className="card-body">
          <div className="alert alert-warning">
            <span>No performance data available for {modelDisplayName}</span>
          </div>
        </div>
      </div>
    );
  }

  // Extract real data from the API response
  const metrics = modelPerformance.metrics ?? {};

  const accuracy = coalesceNumber(
    modelPerformance.accuracy,
    modelPerformance.accuracy_score,
    metrics.accuracy,
    metrics.accuracy_score,
    model?.accuracy,
    model?.accuracy_score
  );

  const precision = coalesceNumber(
    modelPerformance.precision,
    modelPerformance.precision_score,
    metrics.precision,
    metrics.precision_score,
    model?.precision,
    model?.precision_score
  );

  const recall = coalesceNumber(
    modelPerformance.recall,
    modelPerformance.recall_score,
    metrics.recall,
    metrics.recall_score,
    model?.recall,
    model?.recall_score
  );

  const lastTrainedRaw =
    modelPerformance.last_trained ??
    modelPerformance.last_trained_at ??
    metrics.last_trained ??
    model?.last_trained ??
    null;

  const recommendationPerformance =
    modelPerformance.recommendation_performance ?? {};

  const total_recommendations = Number(
    recommendationPerformance.total_recommendations ??
    recommendationPerformance.totalRecommendations ??
    0
  );
  const rawClickThroughRate = coalesceNumber(
    recommendationPerformance.click_through_rate,
    recommendationPerformance.click_rate,
    recommendationPerformance.ctr,
    recommendationPerformance.clickThroughRate
  );
  const click_through_rate = rawClickThroughRate ?? 0;
  const hasClickThroughRate = rawClickThroughRate !== null;

  const rawConversionRate = coalesceNumber(
    recommendationPerformance.conversion_rate,
    recommendationPerformance.conversionRate
  );
  const conversion_rate = rawConversionRate ?? 0;
  const hasConversionRate = rawConversionRate !== null;

  const rawAverageScore = coalesceNumber(
    recommendationPerformance.average_score,
    recommendationPerformance.avg_score,
    recommendationPerformance.averageScore
  );
  const average_score = rawAverageScore ?? 0;
  const hasAverageScore = rawAverageScore !== null;

  const accuracyPercent =
    accuracy !== null && accuracy !== undefined ? accuracy * 100 : null;
  const precisionPercent =
    precision !== null && precision !== undefined ? precision * 100 : null;
  const recallPercent =
    recall !== null && recall !== undefined ? recall * 100 : null;
  const averageScorePercent = average_score * 100;

  const clickThroughRateDisplay = hasClickThroughRate
    ? `${click_through_rate.toFixed(2)}%`
    : "N/A";
  const conversionRateDisplay = hasConversionRate
    ? `${conversion_rate.toFixed(2)}%`
    : "N/A";
  const averageScoreDisplay = hasAverageScore
    ? `${averageScorePercent.toFixed(1)}%`
    : "N/A";
  const businessImpactLabel = hasConversionRate
    ? conversion_rate > 50
      ? "high"
      : conversion_rate > 30
        ? "moderate"
        : "low"
    : "unknown";
  const businessImpactSummary = hasConversionRate
    ? `conversion rate (${conversionRateDisplay}) from ${total_recommendations.toLocaleString()} recommendations served.`
    : `conversion data across ${total_recommendations.toLocaleString()} recommendations is unavailable.`;

  // Real ML metrics data
  const mlMetricsData = [
    {
      metric: "Accuracy",
      value: accuracyPercent ?? 0,
      displayValue:
        accuracyPercent !== null ? `${accuracyPercent.toFixed(2)}%` : "N/A",
      rawValue: accuracy ?? 0,
      color: "#10b981",
      description: "Overall prediction accuracy",
    },
    {
      metric: "Precision",
      value: precisionPercent ?? 0,
      displayValue:
        precisionPercent !== null
          ? `${precisionPercent.toFixed(2)}%`
          : "N/A",
      rawValue: precision ?? 0,
      color: "#3b82f6",
      description: "Relevant recommendations ratio",
    },
    {
      metric: "Recall",
      value: recallPercent ?? 0,
      displayValue:
        recallPercent !== null ? `${recallPercent.toFixed(2)}%` : "N/A",
      rawValue: recall ?? 0,
      color: "#f59e0b",
      description: "Coverage of relevant items",
    },
  ];

  // Real business metrics data
  const businessMetricsData = [
    {
      metric: "CTR",
      value: click_through_rate,
      displayValue: clickThroughRateDisplay,
      rawValue: hasClickThroughRate ? click_through_rate : null,
      color: "#8b5cf6",
      description: "Click-through rate",
    },
    {
      metric: "Conversion",
      value: conversion_rate,
      displayValue: conversionRateDisplay,
      rawValue: hasConversionRate ? conversion_rate : null,
      color: "#ef4444",
      description: "Conversion rate",
    },
    {
      metric: "Avg Score",
      value: averageScorePercent,
      displayValue: averageScoreDisplay,
      rawValue: hasAverageScore ? averageScorePercent : null,
      color: "#06b6d4",
      description: "Average recommendation score",
    },
  ];

  // Combined metrics for comparison
  const comparisonData = [
    {
      category: "ML Performance",
      accuracy: accuracyPercent ?? 0,
      precision: precisionPercent ?? 0,
      recall: recallPercent ?? 0,
    },
    {
      category: "Business Impact",
      ctr: click_through_rate,
      conversion: conversion_rate,
      avgScore: averageScorePercent,
    },
  ];

  // F1 Score calculation
  const f1Score =
    precision !== null &&
      precision !== undefined &&
      recall !== null &&
      recall !== undefined &&
      precision + recall > 0
      ? (2 * precision * recall) / (precision + recall)
      : null;

  const totalConversions = Math.max(
    0,
    Math.round(total_recommendations * (conversion_rate / 100))
  );
  const totalClicks = Math.max(
    0,
    Math.round(total_recommendations * (click_through_rate / 100))
  );
  const clickedOnlyRecommendations = Math.max(
    0,
    totalClicks - totalConversions
  );
  const noInteractionRecommendations = Math.max(
    0,
    total_recommendations - totalConversions - clickedOnlyRecommendations
  );
  const successfulRecommendations = totalConversions;

  const conversionCountDisplay = hasConversionRate
    ? `${totalConversions.toLocaleString()} conversions`
    : "No conversion data yet";
  const clickCountDisplay = hasClickThroughRate
    ? `${totalClicks.toLocaleString()} clicks`
    : "No click data yet";

  // Performance breakdown for pie chart
  const performanceBreakdown = [
    {
      name: "Successful Recs",
      value: successfulRecommendations,
      color: "#10b981",
    },
    {
      name: "Clicked Only",
      value: clickedOnlyRecommendations,
      color: "#f59e0b",
    },
    {
      name: "No Interaction",
      value: noInteractionRecommendations,
      color: "#ef4444",
    },
  ];

  const formatLastTrained = (dateString?: string | null) => {
    if (!dateString) {
      return "Not trained yet";
    }

    const parsed = new Date(dateString);

    if (Number.isNaN(parsed.getTime())) {
      return "Not trained yet";
    }

    return parsed.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const accuracySummaryLabel =
    accuracy === null || accuracy === undefined
      ? "insufficient"
      : accuracy > 0.9
        ? "excellent"
        : accuracy > 0.8
          ? "good"
          : "moderate";

  const accuracySummaryValue =
    accuracy === null || accuracy === undefined
      ? "N/A"
      : (accuracy * 100).toFixed(1);

  const f1SummaryLabel =
    f1Score === null
      ? "insufficient"
      : f1Score > 0.4
        ? "balanced"
        : "imbalanced";

  const f1SummaryValue =
    f1Score === null ? "N/A" : (f1Score * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header with model info */}
      <div className="card bg-base-100 border border-base-300 shadow-lg">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-primary" />
                Performance Analytics - {modelDisplayName}
              </h3>
              <p className="text-sm text-base-content/70 mt-1">
                Last trained: {formatLastTrained(lastTrainedRaw)}
              </p>
            </div>
            <div className="stats stats-horizontal shadow">
              <div className="stat">
                <div className="stat-title">Total Recommendations</div>
                <div className="stat-value text-primary">
                  {total_recommendations.toLocaleString()}
                </div>
              </div>
              <div className="stat">
                <div className="stat-title">F1 Score</div>
                <div className="stat-value text-secondary">
                  {f1Score !== null
                    ? `${(f1Score * 100).toFixed(1)}%`
                    : "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ML Performance Metrics */}
        <div className="card bg-base-100 border border-base-300 shadow-lg">
          <div className="card-body">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              ML Performance Metrics
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={mlMetricsData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                  formatter={(value, name) => [`${value}%`, name]}
                />
                <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                  {mlMetricsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Metric descriptions */}
            <div className="mt-4 space-y-2">
              {mlMetricsData.map((metric) => (
                <div
                  key={metric.metric}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: metric.color }}
                    />
                    <span className="font-medium">{metric.metric}:</span>
                    <span className="text-base-content/70">
                      {metric.description}
                    </span>
                  </div>
                  <span className="font-bold">{metric.displayValue}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Business Impact Metrics */}
        <div className="card bg-base-100 border border-base-300 shadow-lg">
          <div className="card-body">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-secondary" />
              Business Impact Metrics
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={businessMetricsData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                  formatter={(value, name) => {
                    const unit = name === "Avg Score" ? "%" : "%";
                    return [`${value}${unit}`, name];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>

            {/* Business metric descriptions */}
            <div className="mt-4 space-y-2">
              {businessMetricsData.map((metric) => (
                <div
                  key={metric.metric}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: metric.color }}
                    />
                    <span className="font-medium">{metric.metric}:</span>
                    <span className="text-base-content/70">
                      {metric.description}
                    </span>
                  </div>
                  <span className="font-bold">{metric.displayValue}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendation Performance Breakdown */}


      {/* Performance Summary */}
      <div className="alert alert-info">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="stroke-current shrink-0 w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <div>
          <h3 className="font-bold">Performance Summary</h3>
          <div className="text-xs mt-1">
            Model shows{" "}
            <strong>
              {accuracySummaryLabel}
            </strong>{" "}
            accuracy ({accuracySummaryValue}%) with{" "}
            <strong>{f1SummaryLabel}</strong>{" "}
            precision-recall trade-off (F1: {f1SummaryValue}%).
            Business impact: <strong>{businessImpactLabel}</strong> {" "}
            {businessImpactSummary}
          </div>
        </div>
      </div>
    </div>
  );
};

// Recommendation Management Component
const RecommendationManagement = () => {
  const algorithmOptions = useMemo(
    () => [
      { value: "hybrid", label: "Hybrid Model" },
      { value: "collaborative", label: "Collaborative Filtering" },
      { value: "content_based", label: "Content Based" },
    ],
    []
  );

  const [selectedAlgorithm, setSelectedAlgorithm] = useState("hybrid");
  const [timeRange, setTimeRange] = useState(30);

  const getAlgorithmLabel = useCallback(
    (value?: string | null) => {
      if (!value) {
        return "All Algorithms";
      }

      const match = algorithmOptions.find((option) => option.value === value);
      if (match) {
        return match.label;
      }

      const fallback = String(value).replace(/_/g, " ");
      return fallback.charAt(0).toUpperCase() + fallback.slice(1);
    },
    [algorithmOptions]
  );

  // Updated query to use correct endpoint and parameters
  const {
    data: rawRecPerformance,
    isLoading: recLoading,
    refetch: refetchRecPerformance,
  } = useGetRecommendationPerformanceQuery({
    algorithm: selectedAlgorithm || undefined,
    days: timeRange,
  });

  // Normalize API response: if object, convert to array
  const recPerformance = rawRecPerformance ? [rawRecPerformance] : [];

  const { data: dashboardMetrics } = useGetAdminDashboardQuery({
    days: timeRange,
  });

  const averageOrderValue =
    dashboardMetrics?.orders?.average ??
    dashboardMetrics?.revenue?.daily_average ??
    0;

  const processedPerformance = useMemo(() => {
    if (!Array.isArray(recPerformance)) {
      return [];
    }

    return recPerformance.map((entry: any) => {
      const algorithmKeyRaw =
        entry?.algorithm ?? selectedAlgorithm ?? null;
      const algorithmKey =
        typeof algorithmKeyRaw === "string"
          ? algorithmKeyRaw
          : algorithmKeyRaw !== null && algorithmKeyRaw !== undefined
            ? String(algorithmKeyRaw)
            : "";

      const displayLabel = getAlgorithmLabel(
        algorithmKey || undefined
      );

      const totalRecommendations = Number(
        entry.total_recommendations ?? entry.impressions ?? 0
      );

      const clickRate = Number(
        entry.click_through_rate ?? entry.click_rate ?? 0
      );

      const conversionRate = Number(entry.conversion_rate ?? 0);

      const computedClicks =
        totalRecommendations > 0
          ? Math.round((clickRate / 100) * totalRecommendations)
          : 0;
      const clicks = Number(
        entry.total_clicks ?? entry.clicks ?? computedClicks
      );

      const computedConversions =
        totalRecommendations > 0
          ? Math.round((conversionRate / 100) * totalRecommendations)
          : 0;
      const conversions = Number(
        entry.total_conversions ??
        entry.conversions ??
        computedConversions
      );

      const derivedRevenue = Math.round(
        conversions * (averageOrderValue || 0)
      );
      const revenueImpact = Number(
        entry.revenue_impact ?? derivedRevenue
      );

      return {
        ...entry,
        algorithm: algorithmKey || undefined,
        display_label: displayLabel,
        total_recommendations: totalRecommendations,
        impressions: totalRecommendations,
        click_rate: clickRate,
        click_through_rate: clickRate,
        conversion_rate: conversionRate,
        total_clicks: clicks,
        clicks,
        total_conversions: conversions,
        conversions,
        revenue_impact: revenueImpact,
      };
    });
  }, [recPerformance, averageOrderValue, selectedAlgorithm, getAlgorithmLabel]);

  if (recLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            Recommendation Performance
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <select
            className="select select-bordered select-sm min-w-[150px]"
            value={selectedAlgorithm}
            onChange={(e) => setSelectedAlgorithm(e.target.value)}
          >
            {algorithmOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            className="select select-bordered select-sm"
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>

          <button
            onClick={refetchRecPerformance}
            className="btn btn-primary btn-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Algorithm Performance Cards */}
      {/* Algorithm Performance Cards */}
      {processedPerformance.length === 0 ? (
        <div className="w-full">
          <div className="card bg-linear-to-br from-base-200/40 to-base-300/20 border-2 border-dashed border-base-300">
            <div className="card-body items-center text-center py-16">
              <div className="bg-base-300/50 rounded-full p-6 mb-4">
                <Target className="w-20 h-20 text-base-content/40" />
              </div>
              <h3 className="text-2xl font-bold text-base-content/70 mb-2">
                No performance data available
              </h3>
              <p className="text-base-content/60 max-w-md">
                Try selecting a different algorithm or time range to see detailed metrics and insights.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {processedPerformance.map((algorithm: any, index: number) => (
            <motion.div
              key={algorithm.algorithm ?? index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-secondary/10 to-accent/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative card bg-base-100 border-2 border-base-300 hover:border-primary/50 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
                {/* Decorative gradient background */}
                <div className="absolute top-0 right-0 w-96 h-full bg-linear-to-l from-primary/5 to-transparent"></div>

                <div className="card-body p-6 relative z-10">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-base-200">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-linear-to-br from-primary to-primary/70 rounded-xl shadow-lg">
                        <Brain className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-2xl text-base-content">
                          {algorithm.display_label ??
                            getAlgorithmLabel(
                              algorithm.algorithm ?? selectedAlgorithm
                            )}
                        </h3>
                        <p className="text-sm text-base-content/60 flex items-center gap-2 mt-1">
                          <Eye className="w-4 h-4" />
                          <span className="font-semibold">{algorithm.impressions?.toLocaleString()}</span> impressions
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Grid - Side by Side */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* CTR Metric */}
                    <div className="bg-linear-to-br from-primary/10 to-primary/5 rounded-xl p-5 border-2 border-primary/20 hover:border-primary/40 transition-all">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-primary/20 rounded-lg">
                          <MousePointer className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-sm font-semibold text-base-content/70">Click-Through Rate</p>
                      </div>
                      <p className="text-3xl font-bold text-primary mb-2">
                        {Number(algorithm.click_through_rate ?? 0).toFixed(2)}%
                      </p>
                      <div className="w-full bg-base-300/50 rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(Number(algorithm.click_through_rate ?? 0) * 2, 100)}%` }}
                          transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                          className="bg-linear-to-r from-primary to-primary/60 rounded-full h-2"
                        ></motion.div>
                      </div>
                      <p className="text-xs text-base-content/60 mt-2 flex items-center gap-1">
                        <MousePointer className="w-3 h-3" />
                        {algorithm.clicks?.toLocaleString()} total clicks
                      </p>
                    </div>

                    {/* Conversion Rate Metric */}
                    <div className="bg-linear-to-br from-success/10 to-success/5 rounded-xl p-5 border-2 border-success/20 hover:border-success/40 transition-all">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-success/20 rounded-lg">
                          <ShoppingCart className="w-5 h-5 text-success" />
                        </div>
                        <p className="text-sm font-semibold text-base-content/70">Conversion Rate</p>
                      </div>
                      <p className="text-3xl font-bold text-success mb-2">
                        {Number(algorithm.conversion_rate ?? 0).toFixed(2)}%
                      </p>
                      <div className="w-full bg-base-300/50 rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(Number(algorithm.conversion_rate ?? 0) * 2, 100)}%` }}
                          transition={{ duration: 1, delay: index * 0.1 + 0.4 }}
                          className="bg-linear-to-r from-success to-success/60 rounded-full h-2"
                        ></motion.div>
                      </div>
                      <p className="text-xs text-base-content/60 mt-2 flex items-center gap-1">
                        <ShoppingCart className="w-3 h-3" />
                        {algorithm.conversions?.toLocaleString()} conversions
                      </p>
                    </div>

                    {/* Revenue Impact */}
                    <div className="bg-linear-to-br from-warning/10 to-warning/5 rounded-xl p-5 border-2 border-warning/20 hover:border-warning/40 transition-all">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-warning/20 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-warning" />
                        </div>
                        <p className="text-sm font-semibold text-base-content/70">Revenue Impact</p>
                      </div>
                      <p className="text-3xl font-bold text-warning mb-2">
                        ${Number(algorithm.revenue_impact ?? 0).toLocaleString()}
                      </p>
                      <div className="w-full h-2 mb-2"></div>
                      <p className="text-xs text-base-content/60 mt-2">
                        Generated from recommendations
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Performance Chart */}
      <RecommendationPerformanceChart algorithms={processedPerformance} />
    </div>
  );
};

// Recommendation Performance Chart
const RecommendationPerformanceChart = ({ algorithms }) => {
  // Normalize and map API fields for chart rendering
  const chartData = Array.isArray(algorithms)
    ? algorithms.map((alg: any) => ({
      name:
        alg.display_label ??
        (alg.algorithm ? alg.algorithm.replace(/_/g, " ") : "All"),
      ctr: alg.click_rate ?? alg.click_through_rate ?? 0,
      conversion: alg.conversion_rate ?? 0,
      impressions: alg.total_recommendations ?? alg.impressions ?? 0,
      revenue: alg.revenue_impact ?? 0,
      total_clicks: alg.total_clicks ?? 0,
      total_conversions: alg.total_conversions ?? 0,
      average_score: alg.average_score ?? 0,
      period_days: alg.period_days ?? 0,
      performance_by_day: alg.performance_by_day ?? [],
      top_performing_products: alg.top_performing_products ?? [],
    }))
    : [];

  // Daily performance chart data
  const dailyData = chartData[0]?.performance_by_day || [];
  // Top performing products
  const topProducts = chartData[0]?.top_performing_products || [];

  return (
    <div className="card bg-base-100 border border-base-300 shadow-lg">
      <div className="card-body">
        <h3 className="text-xl font-semibold mb-6">Algorithm Comparison</h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CTR vs Conversion Rate */}
          <div>
            <h4 className="font-medium mb-4">Performance Metrics</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                {/* <Bar dataKey="ctr" fill="#3ac999" name="CTR %" />
                <Bar dataKey="conversion" fill="#60a5fa" name="Conversion %" /> */}
                <Bar dataKey="impressions" fill="#fb923c" name="Impressions" />
                <Bar dataKey="total_clicks" fill="#f87171" name="Total Clicks" />
                <Bar dataKey="total_conversions" fill="#06b6d4" name="Total Conversions" />
              </BarChart>
            </ResponsiveContainer>
            {/* Summary stats */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-base-content/60">Period (days)</div>
                <div className="font-bold">{chartData[0]?.period_days}</div>
              </div>
              <div>
                <div className="text-xs text-base-content/60">Avg Score</div>
                <div className="font-bold">{(chartData[0]?.average_score * 100).toFixed(1)}%</div>
              </div>
            </div>
          </div>

          {/* Daily Performance Chart */}
          <div>
            <h4 className="font-medium mb-4">Daily Performance</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="recommendations" stroke="#3ac999" name="Recommendations" />
                <Line type="monotone" dataKey="clicks" stroke="#60a5fa" name="Clicks" />
                <Line type="monotone" dataKey="conversions" stroke="#fb923c" name="Conversions" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performing Products Table */}
        <div className="mt-8">
          <h4 className="font-medium mb-4">Top Performing Products</h4>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Recommendations</th>
                  <th>Clicks</th>
                  <th>Conversions</th>
                  <th>Click Rate</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product: any) => (
                  <tr key={product.product_id}>
                    <td>{product.product_name}</td>
                    <td>{product.recommendations}</td>
                    <td>{product.clicks}</td>
                    <td>{product.conversions}</td>
                    <td>{product.click_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// User Segmentation Management Component

type UserSegment = {
  id: string;
  segment_id?: string;
  segment_name: string;
  name?: string;
  description?: string;
  user_count?: number;
  member_count?: number;
  created_at?: string;
  updated_at?: string;
  last_updated?: string;
  is_active?: boolean;
  auto_update?: boolean;
  update_frequency?: string;
};

type OperatorKey =
  | "equals"
  | "not_equals"
  | "greater_than"
  | "greater_or_equal"
  | "less_than"
  | "less_or_equal"
  | "contains"
  | "in"
  | "not_in";

type ValueType = "number" | "integer" | "date" | "string";

type SegmentFieldDefinition = {
  id: string;
  label: string;
  field: string;
  valueType: ValueType;
  segmentTypes: string[];
  defaultOperator: OperatorKey;
  operators?: OperatorKey[];
  placeholder?: string;
  step?: string;
  min?: string;
};

type CriteriaCondition = {
  field: string;
  operator: OperatorKey;
  value: string;
};

const SEGMENT_FIELD_DEFINITIONS: SegmentFieldDefinition[] = [
  {
    id: "purchase-amount",
    label: "Purchase Amount",
    field: "order.total",
    valueType: "number",
    segmentTypes: ["custom", "behavioral"],
    defaultOperator: "greater_than",
    placeholder: "e.g., 250.00",
    step: "0.01",
    min: "0",
  },
  {
    id: "order-frequency",
    label: "Order Frequency",
    field: "order.count",
    valueType: "integer",
    segmentTypes: ["custom", "behavioral"],
    defaultOperator: "greater_than",
    placeholder: "e.g., 3",
    step: "1",
    min: "0",
  },
  {
    id: "last-purchase-date",
    label: "Last Purchase Date",
    field: "order.last_purchase",
    valueType: "date",
    segmentTypes: ["custom", "behavioral"],
    defaultOperator: "greater_or_equal",
  },
  {
    id: "product-category",
    label: "Product Category",
    field: "order.category",
    valueType: "string",
    segmentTypes: ["custom", "behavioral", "demographic"],
    defaultOperator: "equals",
    operators: ["equals", "contains", "in", "not_in"],
    placeholder: "Category name or ID",
  },
  {
    id: "rfm-recency",
    label: "RFM Recency Score",
    field: "rfm.recency_score",
    valueType: "number",
    segmentTypes: ["rfm"],
    defaultOperator: "less_or_equal",
    placeholder: "e.g., 2",
    step: "1",
    min: "1",
  },
  {
    id: "rfm-frequency",
    label: "RFM Frequency Score",
    field: "rfm.frequency_score",
    valueType: "number",
    segmentTypes: ["rfm"],
    defaultOperator: "greater_or_equal",
    step: "1",
    min: "1",
  },
  {
    id: "rfm-monetary",
    label: "RFM Monetary Score",
    field: "rfm.monetary_score",
    valueType: "number",
    segmentTypes: ["rfm"],
    defaultOperator: "greater_or_equal",
    step: "1",
    min: "1",
  },
  {
    id: "rfm-total-spend",
    label: "Total Spend",
    field: "rfm.total_spent",
    valueType: "number",
    segmentTypes: ["rfm"],
    defaultOperator: "greater_or_equal",
    placeholder: "e.g., 1000",
    step: "0.01",
    min: "0",
  },
  {
    id: "rfm-order-count",
    label: "Orders Placed",
    field: "rfm.order_count",
    valueType: "integer",
    segmentTypes: ["rfm"],
    defaultOperator: "greater_or_equal",
    step: "1",
    min: "0",
  },
  {
    id: "behavior-last-login",
    label: "Last Login Date",
    field: "user.last_login",
    valueType: "date",
    segmentTypes: ["behavioral"],
    defaultOperator: "greater_or_equal",
  },
  {
    id: "behavior-order-frequency",
    label: "Order Frequency (Behavioral)",
    field: "order.count",
    valueType: "integer",
    segmentTypes: ["behavioral"],
    defaultOperator: "greater_than",
    step: "1",
    min: "0",
  },
  {
    id: "demographic-gender",
    label: "Gender",
    field: "user.gender",
    valueType: "string",
    segmentTypes: ["demographic"],
    defaultOperator: "equals",
    placeholder: "e.g., female",
  },
  {
    id: "demographic-country",
    label: "Country",
    field: "user.country",
    valueType: "string",
    segmentTypes: ["demographic"],
    defaultOperator: "equals",
    placeholder: "e.g., United States",
  },
  {
    id: "demographic-age",
    label: "Age",
    field: "demographic.age",
    valueType: "number",
    segmentTypes: ["demographic"],
    defaultOperator: "greater_or_equal",
    min: "0",
    step: "1",
  },
];

const FIELD_DEFINITION_BY_FIELD = SEGMENT_FIELD_DEFINITIONS.reduce<Record<string, SegmentFieldDefinition>>(
  (acc, def) => {
    acc[def.field] = def;
    return acc;
  },
  {}
);

const DEFAULT_OPERATORS_BY_TYPE: Record<ValueType, OperatorKey[]> = {
  number: ["greater_than", "greater_or_equal", "equals", "less_or_equal", "less_than"],
  integer: ["greater_than", "greater_or_equal", "equals", "less_or_equal", "less_than"],
  date: ["greater_than", "greater_or_equal", "equals", "less_or_equal", "less_than"],
  string: ["equals", "not_equals", "contains"],
};

const DEFAULT_OPERATOR_LABELS: Record<OperatorKey, string> = {
  equals: "Equals",
  not_equals: "Not equal to",
  greater_than: "Greater than",
  greater_or_equal: "Greater than or equal",
  less_than: "Less than",
  less_or_equal: "Less than or equal",
  contains: "Contains",
  in: "In (comma separated)",
  not_in: "Not in (comma separated)",
};

const DATE_OPERATOR_LABELS: Partial<Record<OperatorKey, string>> = {
  greater_than: "After",
  greater_or_equal: "On or after",
  less_than: "Before",
  less_or_equal: "On or before",
  equals: "On",
};

const getOperatorLabel = (operator: OperatorKey, valueType: ValueType) => {
  if (valueType === "date" && DATE_OPERATOR_LABELS[operator]) {
    return DATE_OPERATOR_LABELS[operator] as string;
  }
  return DEFAULT_OPERATOR_LABELS[operator] ?? operator;
};

const getFieldsForSegmentType = (segmentType: string) =>
  SEGMENT_FIELD_DEFINITIONS.filter((def) => def.segmentTypes.includes(segmentType));

const getDefaultFieldForType = (segmentType: string): SegmentFieldDefinition => {
  const available = getFieldsForSegmentType(segmentType);
  if (available.length > 0) {
    return available[0];
  }
  return SEGMENT_FIELD_DEFINITIONS[0];
};

const createDefaultConditionForType = (segmentType: string): CriteriaCondition => {
  const defaultField = getDefaultFieldForType(segmentType);
  const operators = defaultField.operators ?? DEFAULT_OPERATORS_BY_TYPE[defaultField.valueType];
  const operator = defaultField.defaultOperator || operators[0] || "equals";
  return {
    field: defaultField.field,
    operator,
    value: "",
  };
};

const normalizeSegmentType = (segmentType?: string) => {
  if (typeof segmentType !== "string") {
    return "custom";
  }

  const normalized = segmentType.trim().toLowerCase();
  return normalized || "custom";
};

const getOperatorsForFieldDefinition = (fieldDef: SegmentFieldDefinition): OperatorKey[] =>
  fieldDef.operators ?? DEFAULT_OPERATORS_BY_TYPE[fieldDef.valueType];

const normalizeConditionsForType = (
  conditions: CriteriaCondition[] | undefined,
  segmentType: string
): CriteriaCondition[] => {
  const baseConditions = Array.isArray(conditions) && conditions.length > 0
    ? conditions
    : [createDefaultConditionForType(segmentType)];

  const fallbackField = getDefaultFieldForType(segmentType);

  return baseConditions.map((condition) => {
    const fieldDef =
      FIELD_DEFINITION_BY_FIELD[condition?.field] ?? fallbackField ?? SEGMENT_FIELD_DEFINITIONS[0];

    const operators = getOperatorsForFieldDefinition(fieldDef);
    const defaultOperator = fieldDef.defaultOperator ?? operators[0] ?? "equals";
    const normalizedOperator = operators.includes(condition?.operator as OperatorKey)
      ? (condition.operator as OperatorKey)
      : defaultOperator;

    let normalizedValue: string;

    if (Array.isArray(condition?.value)) {
      normalizedValue = condition.value.join(", ");
    } else if (condition?.value === null || condition?.value === undefined) {
      normalizedValue = "";
    } else {
      normalizedValue = String(condition.value);
    }

    return {
      field: fieldDef.field,
      operator: normalizedOperator,
      value: normalizedValue,
    };
  });
};

const createInitialSegmentState = (segmentType = "custom") => ({
  name: "",
  description: "",
  type: segmentType,
  criteria: {
    logic: "and",
    conditions: [createDefaultConditionForType(segmentType)],
  },
});

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

const UserSegmentationManagement = () => {
  const [isCreatingSegment, setIsCreatingSegment] = useState(false);
  const [newSegment, setNewSegment] = useState(() => createInitialSegmentState());

  const {
    data: userSegments = [],
    isLoading: segmentsLoading,
    refetch: refetchSegments,
  } = useGetUserSegmentsQuery({});

  const [createUserSegment, { isLoading: createSegmentLoading }] =
    useCreateUserSegmentMutation();

  const [createSegmentError, setCreateSegmentError] = useState<string | null>(
    null
  );

  const segments: UserSegment[] = Array.isArray(userSegments)
    ? (userSegments as UserSegment[])
    : [];

  const { data: rawSegmentPerformance, isLoading: performanceLoading } =
    useGetSegmentPerformanceQuery({});

  const { data: segmentPerformanceAnalytics, isLoading: analyticsLoading } =
    useGetSegmentPerformanceAnalyticsQuery({});

  const [refreshSegments] = useRecalculateSegmentMutation();

  const performanceData = Array.isArray(rawSegmentPerformance)
    ? rawSegmentPerformance
    : [];


  const segmentAnalytics = Array.isArray(segmentPerformanceAnalytics)
    ? segmentPerformanceAnalytics
    : [];

  const totalMembers = segmentAnalytics.reduce(
    (sum, segment) => sum + (segment?.member_count ?? 0),
    0
  );
  const totalRevenue = segmentAnalytics.reduce(
    (sum, segment) => sum + (segment?.total_revenue ?? 0),
    0
  );
  const totalSegmentUsers = performanceData.reduce(
    (sum: number, seg: { user_count?: number }) => sum + (seg.user_count ?? 0),
    0
  );

  const normalizeKey = (value?: string) => (value ?? "").toLowerCase();
  const segmentMetaByKey = new Map<string, UserSegment>();
  segments.forEach((segment) => {
    const key = normalizeKey(
      segment?.segment_name ?? segment?.name ?? segment?.segment_id
    );
    if (!segmentMetaByKey.has(key)) {
      segmentMetaByKey.set(key, segment);
    }
  });
  const analyticsByKey = new Map<string, any>();
  segmentAnalytics.forEach((segment) => {
    analyticsByKey.set(normalizeKey(segment?.segment_name), segment);
  });

  const buildCombinedSegment = (
    key: string,
    {
      base,
      analytics,
      meta,
    }: {
      base?: any;
      analytics?: any;
      meta?: UserSegment | undefined;
    }
  ) => {
    const name =
      analytics?.segment_name ??
      base?.segment_name ??
      base?.name ??
      meta?.segment_name ??
      meta?.name ??
      key;

    const memberCountValue = normalizeNumericValue(
      analytics?.member_count ??
        base?.member_count ??
        base?.user_count ??
        meta?.member_count ??
        0
    );

    const ordersCountValue = normalizeNumericValue(
      analytics?.orders_count ??
        base?.orders_count ??
        meta?.orders_count ??
        base?.order_count ??
        analytics?.order_count ??
        0
    );

    const totalRevenueValue = normalizeNumericValue(
      analytics?.total_revenue ??
        base?.total_revenue ??
        base?.revenue_contribution ??
        meta?.total_revenue ??
        0
    );

    const avgOrderValue = normalizeNumericValue(
      analytics?.avg_order_value ??
        base?.avg_order_value ??
        base?.average_order_value ??
        (ordersCountValue > 0 ? totalRevenueValue / ordersCountValue : 0)
    );

    const revenuePerMemberValue = normalizeNumericValue(
      analytics?.revenue_per_member ??
        base?.revenue_per_member ??
        (memberCountValue > 0 ? totalRevenueValue / memberCountValue : 0)
    );

    const conversionRateValue = deriveConversionRate(
      [
        analytics?.conversion_rate,
        analytics?.conversionRate,
        base?.conversion_rate,
        base?.conversionRate,
        meta?.conversion_rate,
        meta?.conversionRate,
      ],
      ordersCountValue,
      memberCountValue
    );

    const createdAt =
      meta?.created_at ??
      analytics?.created_at ??
      base?.created_at ??
      base?.createdAt ??
      meta?.metadata?.created_at ??
      null;

    const updatedAt =
      analytics?.last_updated ??
      analytics?.updated_at ??
      meta?.updated_at ??
      base?.updated_at ??
      base?.updatedAt ??
      base?.last_updated ??
      meta?.metadata?.updated_at ??
      createdAt;

    const metadata: Record<string, any> = {
      ...(meta?.metadata ?? {}),
      ...(base?.metadata ?? {}),
    };

    metadata.update_frequency =
      metadata.update_frequency ??
      meta?.update_frequency ??
      base?.update_frequency ??
      analytics?.update_frequency ??
      null;
    metadata.segment_type =
      metadata.segment_type ??
      meta?.segment_type ??
      base?.segment_type ??
      null;
    metadata.tags = metadata.tags ?? analytics?.top_tags ?? [];
    metadata.top_products = analytics?.top_products ?? metadata.top_products;

    return {
      segment_id: meta?.segment_id ?? base?.segment_id ?? base?.id ?? key,
      segment_name: name,
      description:
        analytics?.description ??
        base?.description ??
        meta?.description ??
        "No description available.",
      user_count: memberCountValue,
      member_count: memberCountValue,
      orders_count: ordersCountValue,
      avg_order_value: avgOrderValue,
      total_revenue: totalRevenueValue,
      revenue_contribution: totalRevenueValue,
      revenue_per_member: revenuePerMemberValue,
      conversion_rate: conversionRateValue,
      created_at: createdAt,
      updated_at: updatedAt,
      last_updated: updatedAt,
      metadata,
      status:
        base?.status ?? meta?.status ?? (memberCountValue > 0 ? "active" : "inactive"),
    };
  };

  const seenKeys = new Set<string>();
  const combinedSegments: any[] = [];

  performanceData.forEach((segment) => {
    const key = normalizeKey(
      segment?.segment_name ?? segment?.name ?? segment?.segment_id
    );
    const meta = segmentMetaByKey.get(key);
    const analytics = analyticsByKey.get(key);
    combinedSegments.push(
      buildCombinedSegment(key, { base: segment, analytics, meta })
    );
    seenKeys.add(key);
  });

  segmentAnalytics.forEach((segment) => {
    const key = normalizeKey(segment?.segment_name);
    if (seenKeys.has(key)) {
      return;
    }

    const meta = segmentMetaByKey.get(key);
    combinedSegments.push(
      buildCombinedSegment(key, { analytics: segment, meta })
    );
    seenKeys.add(key);
  });

  segmentMetaByKey.forEach((meta, key) => {
    if (seenKeys.has(key)) {
      return;
    }

    combinedSegments.push(buildCombinedSegment(key, { meta }));
    seenKeys.add(key);
  });

  const transformConditionValue = (
    rawValue: unknown,
    fieldDef: SegmentFieldDefinition,
    operator: OperatorKey
  ) => {
    if (operator === "in" || operator === "not_in") {
      const parts = Array.isArray(rawValue)
        ? rawValue
        : String(rawValue ?? "")
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean);

      if (!parts.length) {
        return [];
      }

      if (fieldDef.valueType === "number" || fieldDef.valueType === "integer") {
        const numericValues = (parts as string[])
          .map((part) =>
            fieldDef.valueType === "integer"
              ? parseInt(part, 10)
              : Number(part.replace(/,/g, ""))
          )
          .filter((value) => !Number.isNaN(value));

        return numericValues;
      }

      return (parts as string[]).map((item) => item.trim());
    }

    if (fieldDef.valueType === "number") {
      const numericValue = Number(String(rawValue ?? "").replace(/,/g, ""));
      return Number.isNaN(numericValue) ? null : numericValue;
    }

    if (fieldDef.valueType === "integer") {
      const numericValue = parseInt(String(rawValue ?? "").replace(/,/g, ""), 10);
      return Number.isNaN(numericValue) ? null : numericValue;
    }

    if (fieldDef.valueType === "date") {
      const date = new Date(String(rawValue ?? ""));
      if (Number.isNaN(date.getTime())) {
        return null;
      }
      return date.toISOString();
    }

    const textValue = String(rawValue ?? "").trim();
    if (!textValue) {
      return null;
    }
    return textValue;
  };

  const buildCriteriaPayload = () => {
    const criteriaState = newSegment.criteria ?? {};
    const logic =
      typeof criteriaState.logic === "string" &&
      ["and", "or"].includes(criteriaState.logic.toLowerCase())
        ? criteriaState.logic.toLowerCase()
        : "and";

    const rawConditions = Array.isArray(criteriaState.conditions)
      ? criteriaState.conditions
      : [];

    const parsedConditions = rawConditions
      .map((condition: CriteriaCondition) => {
        const fieldKey = condition?.field;
        const operatorKey = condition?.operator as OperatorKey;
        const rawValue = condition?.value;

        const fieldDef = FIELD_DEFINITION_BY_FIELD[fieldKey];
        if (!fieldDef || !operatorKey) {
          return null;
        }

        const validOperators = fieldDef.operators ?? DEFAULT_OPERATORS_BY_TYPE[fieldDef.valueType];
        if (!validOperators.includes(operatorKey)) {
          return null;
        }

        const parsedValue = transformConditionValue(rawValue, fieldDef, operatorKey);

        if (Array.isArray(parsedValue)) {
          if (!parsedValue.length) {
            return null;
          }
        } else if (parsedValue === null || parsedValue === undefined) {
          return null;
        }

        return {
          field: fieldKey,
          operator: operatorKey,
          value: parsedValue,
        };
      })
      .filter(Boolean);

    if (!parsedConditions.length) {
      return {};
    }

    return {
      logic,
      conditions: parsedConditions,
    };
  };

  const resetNewSegmentState = (segmentType = "custom") => {
    setNewSegment(createInitialSegmentState(normalizeSegmentType(segmentType)));
  };

  const handleCreateSegment = async () => {
    const trimmedName = newSegment.name?.trim() ?? "";

    if (!trimmedName) {
      setCreateSegmentError("Segment name is required.");
      return;
    }

    setCreateSegmentError(null);

  const segmentType = normalizeSegmentType(newSegment.type);
    const criteriaPayload = buildCriteriaPayload();
    const payload = {
      name: trimmedName,
      description: newSegment.description?.trim() ?? "",
      criteria: Object.keys(criteriaPayload).length ? criteriaPayload : {},
      segment_type: segmentType,
      is_active: true,
      auto_update: true,
    };

    try {
      await createUserSegment(payload).unwrap();
      toast.success(`Segment "${trimmedName}" created successfully.`);
      resetNewSegmentState(segmentType);
      setIsCreatingSegment(false);
      refetchSegments();
    } catch (error: any) {
      console.error("Segment creation failed:", error);
      const message =
        error?.data?.detail ??
        error?.data?.message ??
        (typeof error?.data === "string" ? error.data : null) ??
        "Failed to create segment";
      setCreateSegmentError(message);
      toast.error(message);
    }
  };

  const handleCloseCreateModal = () => {
    resetNewSegmentState();
    setCreateSegmentError(null);
    setIsCreatingSegment(false);
  };

  combinedSegments.sort((a, b) => (b.member_count ?? 0) - (a.member_count ?? 0));

  const handleRefreshSegments = async () => {
    try {
      await refreshSegments({}).unwrap();
      refetchSegments();
    } catch (error) {
      console.error("Refresh failed:", error);
    }
  };

  if (segmentsLoading || performanceLoading || analyticsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-base-100 rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold flex items-center gap-3 text-base-content">
          <Users className="w-7 h-7 text-primary" />
          User Segmentation
        </h2>

        <div className="flex items-center gap-4">
          <button
            onClick={handleRefreshSegments}
            className="btn btn-outline btn-primary rounded-full px-6"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => setIsCreatingSegment(true)}
            className="btn btn-primary rounded-full px-6"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Segment
          </button>
        </div>
      </div>

      {/* Segment Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            title: "Total Segments",
            value: combinedSegments.length || 0,
            icon: Users,
            color: "primary",
          },
          {
            title: "Total Users",
            value: (segmentAnalytics.length ? totalMembers : totalSegmentUsers).toLocaleString(),
            icon: Target,
            color: "success",
          },
          {
            title: "Avg Conversion",
            value: (() => {
              const { weightedRate, totalUsers } = combinedSegments.reduce(
                (acc, seg) => {
                  const users = normalizeNumericValue(
                    seg.member_count ?? seg.user_count ?? 0
                  );
                  if (!users) {
                    return acc;
                  }

                  const rate = normalizePercentageValue(seg.conversion_rate);
                  if (rate === null) {
                    return acc;
                  }

                  acc.totalUsers += users;
                  acc.weightedRate += rate * users;
                  return acc;
                },
                { weightedRate: 0, totalUsers: 0 }
              );

              if (!totalUsers) {
                return "0%";
              }

              return `${(weightedRate / totalUsers).toFixed(1)}%`;
            })(),
            icon: TrendingUp,
            color: "warning",
          },
          {
            title: "Total Revenue",
            value:
              "$" +
              (totalRevenue || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
            icon: Activity,
            color: "info",
          },
        ].map((metric, index) => (
          <div
            key={index}
            className={`card bg-linear-to-br from-${metric.color}/10 to-${metric.color}/20 border border-${metric.color}/30 shadow-md hover:shadow-lg transition-shadow rounded-xl`}
          >
            <div className="card-body p-5">
              <div className="flex items-center gap-4">
                <div className={`p-3 bg-${metric.color}/20 rounded-full`}>
                  <metric.icon className={`w-6 h-6 text-${metric.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-base-content/70">
                    {metric.title}
                  </p>
                  <p className={`text-2xl font-bold text-${metric.color}`}>
                    {metric.value}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Segments List and Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActiveSegmentsCard segments={combinedSegments} />
        <SegmentPerformanceChart segments={combinedSegments} />
      </div>

      {/* Segment Details */}
      <SegmentDetailsTable segments={combinedSegments} />

      {/* Create New Segment Modal */}
      <AnimatePresence>
        {isCreatingSegment && (
          <CreateSegmentModal
            newSegment={newSegment}
            setNewSegment={setNewSegment}
            onClose={handleCloseCreateModal}
            onSave={handleCreateSegment}
            isSaving={createSegmentLoading}
            error={createSegmentError}
          />
        )}
      </AnimatePresence>
    </div>
  );
};


const ActiveSegmentsCard = ({
  segments = [],
}: {
  segments?: UserSegment[];
}) => {
  const [showAllActive, setShowAllActive] = useState(false);

  const getMemberCount = (segment: any) =>
    segment?.member_count ?? segment?.user_count ?? 0;

  const activeSegments = segments.filter(
    (segment) => getMemberCount(segment) > 0
  );
  const visibleSegments = showAllActive
    ? activeSegments
    : activeSegments.slice(0, 3);

  return (
    <div className="card bg-base-100 border border-base-300 shadow-lg rounded-xl">
      <div className="card-body">
        <h3 className="text-xl font-semibold mb-4 text-base-content">
          Active Segments
        </h3>

        <div className="space-y-3">
          <AnimatePresence>
            {visibleSegments.map((segment: any, index: number) => {
              const displayName =
                segment.segment_name ??
                segment.name ??
                segment.segment_id ??
                "Unnamed Segment";

              const memberCount = getMemberCount(segment);
              const updatedAt =
                segment?.last_updated ??
                segment?.updated_at ??
                segment?.created_at ??
                null;
              let timestampLabel = "Last updated: N/A";
              if (updatedAt) {
                const parsed = new Date(updatedAt);
                if (!Number.isNaN(parsed.getTime())) {
                  timestampLabel = `Last updated: ${parsed.toLocaleString()}`;
                }
              }

              const descriptionText =
                typeof segment.description === "string" && segment.description.trim()
                  ? segment.description.trim()
                  : "No description provided";

              return (
                <motion.div
                  key={segment.segment_id ?? segment.id ?? index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 border border-base-200 rounded-lg hover:bg-primary/5 transition-all"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-base-content">
                          {displayName}
                        </h4>
                        <p className="text-sm text-base-content/60">
                          {descriptionText}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="badge badge-primary badge-lg">
                        {memberCount.toLocaleString()} users
                      </div>
                      <p className="text-xs text-base-content/50 mt-2">
                        {timestampLabel}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {!visibleSegments.length && (
            <div className="text-sm text-base-content/60 text-center py-6 border border-dashed border-base-200 rounded-lg">
              {segments.length
                ? "Toggle \"Show More\" to explore additional segments."
                : "No segments found. Try creating a new segment to get started."}
            </div>
          )}
        </div>

        {activeSegments.length > 3 && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => setShowAllActive(!showAllActive)}
              className="btn btn-outline btn-sm rounded-full"
            >
              {showAllActive ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Show {activeSegments.length - 3} More
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Segment Performance Chart
const SegmentPerformanceChart = ({
  segments,
  segmentPerformance,
}: {
  segments?: any[];
  segmentPerformance?: any[];
}) => {
  const rawSegments = useMemo(() => {
    if (Array.isArray(segments) && segments.length > 0) {
      return segments;
    }

    if (Array.isArray(segmentPerformance)) {
      return segmentPerformance;
    }

    return [];
  }, [segments, segmentPerformance]);

  const chartData = useMemo(() => {
    if (!Array.isArray(rawSegments)) {
      return [];
    }

    return rawSegments
      .map((segment) => {
        const memberCount =
          segment?.member_count ?? segment?.user_count ?? segment?.members ?? 0;

        const conversionRate = normalizePercentageValue(
          segment?.conversion_rate
        );

        return {
          ...segment,
          segment_name:
            segment?.segment_name ??
            segment?.name ??
            segment?.segment_id ??
            "Unnamed Segment",
          member_count: memberCount,
          user_count: memberCount,
          conversion_rate: conversionRate === null ? 0 : conversionRate,
          revenue_contribution: normalizeNumericValue(
            segment?.total_revenue ?? segment?.revenue_contribution ?? 0
          ),
        };
      })
      .filter((segment) => (segment?.member_count ?? 0) > 0);
  }, [rawSegments]);

  if (!chartData.length) {
    return (
      <div className="card bg-base-100 border border-base-300 shadow-lg rounded-xl">
        <div className="card-body items-center text-center space-y-3 py-12">
          <Users className="w-10 h-10 text-base-content/40 mx-auto" />
          <h3 className="text-lg font-semibold text-base-content/80">
            No segment performance data yet
          </h3>
          <p className="text-sm text-base-content/60 max-w-sm">
            When segments have member activity and conversion metrics, the chart
            will visualize their performance here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 border border-base-300 shadow-lg rounded-xl">
      <div className="card-body">
        <h3 className="text-xl font-semibold mb-4 text-base-content">
          Segment Performance
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              opacity={0.5}
            />
            <XAxis
              dataKey="segment_name"
              tick={{ fontSize: 12, fill: "#4B5563" }}
              angle={-30}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12, fill: "#4B5563" }}
              label={{
                value: "Users",
                angle: -90,
                position: "insideLeft",
                style: { fill: "#4B5563", fontSize: 12 },
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: "#4B5563" }}
              label={{
                value: "Conversion %",
                angle: 90,
                position: "insideRight",
                style: { fill: "#4B5563", fontSize: 12 },
              }}
              tickFormatter={(value) => `${value?.toFixed?.(0) ?? value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              }}
              formatter={(value, name) => {
                const numericValue = Number(value ?? 0);

                if (name === "revenue_contribution" || name === "total_revenue") {
                  return [`$${numericValue.toLocaleString()}`, "Revenue"];
                }
                if (name === "conversion_rate") {
                  return [`${numericValue.toFixed(1)}%`, "Conversion"];
                }
                return [numericValue.toLocaleString(), "Members"];
              }}
            />
            <Legend verticalAlign="top" height={36} />
            <Bar
              yAxisId="left"
              dataKey="member_count"
              fill="#10B981"
              name="Users"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              yAxisId="right"
              dataKey="conversion_rate"
              fill="#3B82F6"
              name="Conversion %"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Segment Details Table
// ---- SegmentDetailsTable (clean adjusted) ----
const SegmentDetailsTable = ({ segments = [] }: { segments?: any[] }) => {
  const [showAllSegments, setShowAllSegments] = useState(false);

  const getMemberCount = (s: any) =>
    normalizeNumericValue(s?.member_count ?? s?.user_count ?? 0);

  const activeSegments = segments.filter(s => getMemberCount(s) > 0);
  const inactiveSegments = segments.filter(s => getMemberCount(s) === 0);

  // shared row renderer
  const renderRow = (segment: any, inactive = false) => {
    const memberCount = getMemberCount(segment);
    const avgOrderValue = normalizeNumericValue(segment?.avg_order_value ?? 0);
    const totalRevenue = normalizeNumericValue(
      segment?.total_revenue ?? segment?.revenue_contribution ?? 0
    );
    const conversionRate = normalizePercentageValue(segment?.conversion_rate) ?? 0;
    const name = segment.segment_name ?? segment.name ?? "Unnamed Segment";

    return (
      <motion.tr
        key={segment.segment_id ?? segment.id ?? name}
        layout
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.25 }}
        className={`${inactive ? "text-base-content/60" : ""}`}
      >
        {/* SEGMENT NAME */}
        <td>
          <div className="flex items-center gap-3">
            <div className="avatar placeholder">
              <div
                className={`rounded-full w-8 ${inactive
                    ? "bg-neutral text-neutral-content"
                    : "bg-primary text-primary-content"
                  }`}
              >
                <span className="text-xs flex justify-center items-center h-full">
                  {name?.charAt(0)?.toUpperCase() ?? "?"}
                </span>
              </div>
            </div>
            <div className="font-semibold">{name}</div>
          </div>
        </td>

        {/* USERS */}
        <td>
          <div
            className={`badge badge-lg text-xs  ${inactive ? "badge-neutral" : "badge-primary"
              }`}
          >
            {memberCount.toLocaleString()}
          </div>
        </td>

        {/* AVG ORDER VALUE */}
        <td>${avgOrderValue.toFixed(2)}</td>

        {/* CONVERSION RATE */}
        <td>
          <div className="flex items-center gap-2">
            <div
              className={`progress w-16 ${inactive ? "progress-neutral" : "progress-primary"
                }`}
              style={{ "--value": conversionRate } as any}
            />
            <span className="text-sm">{conversionRate.toFixed(1)}%</span>
          </div>
        </td>

        {/* REVENUE */}
        <td className="font-semibold text-success">
          ${totalRevenue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </td>

        {/* ACTIONS */}
        <td>
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost btn-sm text-primary">
              <Edit className="w-4 h-4" />
            </button>
            <button className="btn btn-ghost btn-sm text-error">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </motion.tr>
    );
  };

  return (
    <div className="card bg-base-100 border border-base-300 shadow-lg rounded-xl">
      <div className="card-body">
        <h3 className="text-xl font-semibold mb-4 text-base-content">
          Detailed Performance Metrics
        </h3>

        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr className="text-base-content/80">
                <th>Segment</th>
                <th>Users</th>
                <th>Avg Order Value</th>
                <th>Conversion Rate</th>
                <th>Revenue Contribution</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeSegments.map(seg => renderRow(seg, false))}
              <AnimatePresence>
                {showAllSegments &&
                  inactiveSegments.map(seg => renderRow(seg, true))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {inactiveSegments.length > 0 && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => setShowAllSegments(!showAllSegments)}
              className="btn btn-outline btn-sm rounded-full"
            >
              {showAllSegments ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" /> Hide Inactive Segments
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" /> Show{" "}
                  {inactiveSegments.length} Inactive Segments
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Create Segment Modal
const CreateSegmentModal = ({
  newSegment,
  setNewSegment,
  onClose,
  onSave,
  isSaving = false,
  error,
}: {
  newSegment: any;
  setNewSegment: React.Dispatch<any>;
  onClose: () => void;
  onSave: () => Promise<void> | void;
  isSaving?: boolean;
  error?: string | null;
}) => {

  const segmentTypes = [
    {
      id: "rfm",
      name: "RFM Analysis",
      description: "Recency, Frequency, Monetary segmentation",
    },
    {
      id: "behavioral",
      name: "Behavioral",
      description: "Based on user behavior patterns",
    },
    {
      id: "demographic",
      name: "Demographic",
      description: "Age, location, preferences",
    },
    { id: "custom", name: "Custom", description: "Define your own criteria" },
  ];

  const segmentType = normalizeSegmentType(newSegment?.type);
  const availableFields = getFieldsForSegmentType(segmentType);
  const fallbackField = availableFields[0] ?? SEGMENT_FIELD_DEFINITIONS[0];
  const selectedSegmentMeta = segmentTypes.find((type) => type.id === segmentType);

  const criteriaLogic =
    typeof newSegment?.criteria?.logic === "string" &&
    ["and", "or"].includes(newSegment.criteria.logic.toLowerCase())
      ? newSegment.criteria.logic.toLowerCase()
      : "and";

  const criteriaConditions = normalizeConditionsForType(
    Array.isArray(newSegment?.criteria?.conditions)
      ? newSegment.criteria.conditions
      : undefined,
    segmentType
  );

  const ensureFieldDefinition = (fieldKey?: string) =>
    FIELD_DEFINITION_BY_FIELD[fieldKey ?? ""] ?? fallbackField;

  const handleSegmentTypeChange = (nextType: string) => {
    const normalizedType = normalizeSegmentType(nextType);
    setNewSegment((prev: any) => ({
      ...prev,
      type: normalizedType,
      criteria: {
        logic: "and",
        conditions: [createDefaultConditionForType(normalizedType)],
      },
    }));
  };

  const handleCriteriaChange = (index: number, key: "field" | "operator" | "value", value: string) => {
    setNewSegment((prev: any) => {
      const currentType = normalizeSegmentType(prev?.type);
      const baseConditions = normalizeConditionsForType(
        Array.isArray(prev?.criteria?.conditions)
          ? prev.criteria.conditions
          : undefined,
        currentType
      );

      const existingCondition = baseConditions[index] ?? createDefaultConditionForType(currentType);
      const updatedCondition = { ...existingCondition };

      if (key === "field") {
        const fieldDef = ensureFieldDefinition(value);
        const operators = getOperatorsForFieldDefinition(fieldDef);
        updatedCondition.field = fieldDef.field;
        if (!operators.includes(updatedCondition.operator)) {
          updatedCondition.operator = fieldDef.defaultOperator ?? operators[0] ?? "equals";
        }
        updatedCondition.value = "";
      } else if (key === "operator") {
        const fieldDef = ensureFieldDefinition(updatedCondition.field);
        const operators = getOperatorsForFieldDefinition(fieldDef);
        updatedCondition.operator = operators.includes(value as OperatorKey)
          ? (value as OperatorKey)
          : fieldDef.defaultOperator ?? operators[0] ?? "equals";
      } else if (key === "value") {
        updatedCondition.value = value;
      }

      const nextConditions = [...baseConditions];
      nextConditions[index] = updatedCondition;

      const normalizedLogic =
        typeof prev?.criteria?.logic === "string" && prev.criteria.logic.toLowerCase() === "or"
          ? "or"
          : "and";

      return {
        ...prev,
        criteria: {
          logic: normalizedLogic,
          conditions: nextConditions,
        },
      };
    });
  };

  const handleLogicChange = (value: string) => {
    const normalized = value === "or" ? "or" : "and";
    setNewSegment((prev: any) => {
      const currentType = normalizeSegmentType(prev?.type);
      const baseConditions = normalizeConditionsForType(
        Array.isArray(prev?.criteria?.conditions)
          ? prev.criteria.conditions
          : undefined,
        currentType
      );

      return {
        ...prev,
        criteria: {
          logic: normalized,
          conditions: baseConditions,
        },
      };
    });
  };

  const handleAddCondition = () => {
    setNewSegment((prev: any) => {
      const currentType = normalizeSegmentType(prev?.type);
      const baseConditions = normalizeConditionsForType(
        Array.isArray(prev?.criteria?.conditions)
          ? prev.criteria.conditions
          : undefined,
        currentType
      );

      const normalizedLogic =
        typeof prev?.criteria?.logic === "string" && prev.criteria.logic.toLowerCase() === "or"
          ? "or"
          : "and";

      return {
        ...prev,
        criteria: {
          logic: normalizedLogic,
          conditions: [...baseConditions, createDefaultConditionForType(currentType)],
        },
      };
    });
  };

  const handleRemoveCondition = (index: number) => {
    setNewSegment((prev: any) => {
      const currentType = normalizeSegmentType(prev?.type);
      const baseConditions = normalizeConditionsForType(
        Array.isArray(prev?.criteria?.conditions)
          ? prev.criteria.conditions
          : undefined,
        currentType
      );

      if (baseConditions.length <= 1) {
        return prev;
      }

      const nextConditions = baseConditions.filter((_, idx) => idx !== index);

      const normalizedLogic =
        typeof prev?.criteria?.logic === "string" && prev.criteria.logic.toLowerCase() === "or"
          ? "or"
          : "and";

      return {
        ...prev,
        criteria: {
          logic: normalizedLogic,
          conditions: nextConditions,
        },
      };
    });
  };

  const handleResetCriteria = () => {
    setNewSegment((prev: any) => {
      const currentType = normalizeSegmentType(prev?.type);
      return {
        ...prev,
        criteria: {
          logic: "and",
          conditions: [createDefaultConditionForType(currentType)],
        },
      };
    });
  };

  const isAndLogic = criteriaLogic === "and";
  const logicLabel = criteriaLogic === "or" ? "OR" : "AND";

  const previewConditionStrings = criteriaConditions.map((condition) => {
    const fieldDef = ensureFieldDefinition(condition.field);
    const operatorLabel = getOperatorLabel(condition.operator, fieldDef.valueType);
    const rawValue = typeof condition.value === "string" ? condition.value : String(condition.value ?? "");

    const normalizedValue = rawValue.trim() ? rawValue.trim() : "(value)";

    return `${fieldDef.label} ${operatorLabel} ${normalizedValue}`;
  });

  const previewCriteriaText = previewConditionStrings.length
    ? previewConditionStrings.join(` ${logicLabel} `)
    : "—";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-base-100 w-full max-w-3xl rounded-2xl shadow-2xl border border-base-200 max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-200 sticky top-0 bg-base-100 z-10">
          <h3 className="text-2xl font-bold text-base-content">Create Segment</h3>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle hover:bg-base-200"
          >
            <X className="w-5 h-5 text-base-content/70" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="alert alert-error shadow-sm">
              <span>{error}</span>
            </div>
          )}

          {/* Segment Name */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-base-content/80 mr-2">
                Segment Name
              </span>
            </label>
            <input
              type="text"
              className="input input-bordered rounded-lg bg-base-100 border-base-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="e.g., High Value Customers"
              value={newSegment.name}
              onChange={(e) =>
                setNewSegment((prev: any) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
            />
          </div>

          {/* Description */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-base-content/80 mr-2">
                Description
              </span>
            </label>
            <textarea
              className="textarea textarea-bordered rounded-lg bg-base-100 border-base-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              placeholder="Describe this segment..."
              rows={4}
              value={newSegment.description}
              onChange={(e) =>
                setNewSegment((prev: any) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </div>

          {/* Segment Type */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-base-content/80">
                Segmentation Type
              </span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {segmentTypes.map((type) => {
                const isSelected = segmentType === type.id;

                return (
                  <label
                    key={type.id}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${isSelected
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-base-200 hover:border-primary/50 hover:bg-primary/5"
                      }`}
                  >
                    <input
                      type="radio"
                      name="segmentType"
                      className="radio radio-primary radio-sm"
                      value={type.id}
                      checked={isSelected}
                      onChange={(e) => handleSegmentTypeChange(e.target.value)}
                    />
                    <div>
                      <div className="font-semibold text-base-content">
                        {type.name}
                      </div>
                      <div className="text-sm text-base-content/60">
                        {type.description}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Criteria Builder */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-base-content/80">
                Criteria
              </span>
            </label>
            <div className="flex flex-col gap-4 bg-base-200/30 p-4 rounded-xl border border-base-200">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-base-content/60">
                <span>Combine conditions with</span>
                <div className="join join-horizontal">
                  <button
                    type="button"
                    className={`btn btn-xs join-item rounded-full ${isAndLogic ? "btn-primary" : "btn-ghost text-base-content/70"}`}
                    onClick={() => handleLogicChange("and")}
                  >
                    AND
                  </button>
                  <button
                    type="button"
                    className={`btn btn-xs join-item rounded-full ${!isAndLogic ? "btn-primary" : "btn-ghost text-base-content/70"}`}
                    onClick={() => handleLogicChange("or")}
                  >
                    OR
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {criteriaConditions.map((condition, index) => {
                  const fieldDef = ensureFieldDefinition(condition.field);
                  const operatorOptions = getOperatorsForFieldDefinition(fieldDef);
                  const operatorValue = operatorOptions.includes(condition.operator)
                    ? condition.operator
                    : fieldDef.defaultOperator ?? operatorOptions[0] ?? "equals";

                  const inputType =
                    fieldDef.valueType === "date"
                      ? "date"
                      : fieldDef.valueType === "number" || fieldDef.valueType === "integer"
                        ? "number"
                        : "text";

                  const inputValue =
                    fieldDef.valueType === "date" && typeof condition.value === "string"
                      ? condition.value.split("T")[0]
                      : condition.value ?? "";

                  const placeholder =
                    operatorValue === "in" || operatorValue === "not_in"
                      ? fieldDef.placeholder ?? "Comma separated values"
                      : fieldDef.placeholder ?? "Value";

                  const inputProps: Record<string, string> = {};
                  if (fieldDef.step) {
                    inputProps.step = fieldDef.step;
                  }
                  if (fieldDef.min) {
                    inputProps.min = fieldDef.min;
                  }

                  return (
                    <div
                      key={`criteria-${index}`}
                      className="flex flex-col md:flex-row md:items-center gap-3"
                    >
                      <select
                        className="select select-bordered rounded-lg bg-base-100 border-base-300 flex-1"
                        value={fieldDef.field}
                        onChange={(e) =>
                          handleCriteriaChange(index, "field", e.target.value)
                        }
                      >
                        {availableFields.length > 0
                          ? availableFields.map((fieldOption) => (
                              <option key={fieldOption.field} value={fieldOption.field}>
                                {fieldOption.label}
                              </option>
                            ))
                          : SEGMENT_FIELD_DEFINITIONS.map((fieldOption) => (
                              <option key={fieldOption.field} value={fieldOption.field}>
                                {fieldOption.label}
                              </option>
                            ))}
                      </select>
                      <select
                        className="select select-bordered rounded-lg bg-base-100 border-base-300 md:w-52"
                        value={operatorValue}
                        onChange={(e) =>
                          handleCriteriaChange(index, "operator", e.target.value)
                        }
                      >
                        {operatorOptions.map((operatorKey) => (
                          <option key={operatorKey} value={operatorKey}>
                            {getOperatorLabel(operatorKey, fieldDef.valueType)}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-2 md:w-60">
                        <input
                          type={inputType}
                          className="input input-bordered rounded-lg bg-base-100 border-base-300 w-full focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                          placeholder={placeholder}
                          value={inputValue}
                          onChange={(e) =>
                            handleCriteriaChange(index, "value", e.target.value)
                          }
                          {...inputProps}
                        />
                        {criteriaConditions.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-square btn-sm text-error"
                            onClick={() => handleRemoveCondition(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-base-content/60">
                <button
                  type="button"
                  className="btn btn-outline btn-sm rounded-full text-primary"
                  onClick={handleAddCondition}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Condition
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm text-primary"
                  onClick={handleResetCriteria}
                  disabled={criteriaConditions.length === 1 && criteriaLogic === "and"}
                >
                  Reset Criteria
                </button>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-xl border border-base-200 bg-base-200/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-base-content/80">Segment preview</h4>
              <span className="badge badge-outline badge-sm">
                {selectedSegmentMeta?.name ?? "Not selected"}
              </span>
            </div>
            <div className="text-sm text-base-content/70 space-y-1">
              <div>
                <span className="font-medium text-base-content">Name:</span>{" "}
                {newSegment.name?.trim() || "—"}
              </div>
              <div>
                <span className="font-medium text-base-content">Description:</span>{" "}
                {newSegment.description?.trim() || "—"}
              </div>
              <div>
                <span className="font-medium text-base-content">Criteria:</span>{" "}
                {previewCriteriaText}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-base-200 bg-base-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="btn btn-ghost rounded-full px-6 hover:bg-base-200"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={() => void onSave()}
            className="btn btn-primary rounded-full px-6"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="loading loading-spinner loading-sm mr-2"></span>
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Segment
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Main ML Management Dashboard
const MLManagementDashboard = () => {
  const [activeTab, setActiveTab] = useState("models");

  // const tabs = [
  //   { id: "models", name: "ML Models", icon: Brain },
  //   { id: "recommendations", name: "Recommendations", icon: Target },
  //   { id: "segmentation", name: "User Segmentation", icon: Users },
  // ];

  return (
    <div className="min-h-screen bg-base-100 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-base-content mb-2">
          ML Management Center
        </h1>
        <p className="text-base-content/70 text-lg">
          Manage your machine learning models
        </p>
        <div className="flex items-center gap-4 mt-4">

          <div className="badge badge-success badge-lg">
            <Activity className="w-4 h-4 mr-2" />
            Real-time Monitoring
          </div>
          <div className="badge badge-info badge-lg">
            <Target className="w-4 h-4 mr-2" />
            AI-Powered
          </div>
        </div>
      </motion.div>



      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <MLModelManagement />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default MLManagementDashboard;
export { RecommendationManagement, UserSegmentationManagement };
