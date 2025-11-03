/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Settings,
  ShoppingCart,
  Target,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import React, { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useGetMlConfigsQuery,
  useGetModelPerformanceQuery,
  useGetRecommendationPerformanceQuery,
  useGetSegmentPerformanceQuery,
  useGetUserSegmentsQuery,
  useRefreshSegmentsMutation,
  useToggleModelMutation,
  useTrainModelMutation,
} from "../../store/api/adminAPIv2";

// ML Model Management Component
const MLModelManagement = () => {
  const [selectedModel, setSelectedModel] = useState(null);
  const [trainingProgress, setTrainingProgress] = useState({});

  const {
    data: mlConfigs,
    isLoading: modelsLoading,
    refetch: refetchModels,
  } = useGetMlConfigsQuery({});

  const [trainModel] = useTrainModelMutation();
  const [toggleModel] = useToggleModelMutation();

  const handleTrainModel = async (modelName: string | number) => {
    try {
      setTrainingProgress((prev) => ({ ...prev, [modelName]: 0 }));

      const result = await trainModel({ modelName }).unwrap();

      // Simulate training progress
      const progressInterval = setInterval(() => {
        setTrainingProgress((prev) => {
          const current = prev[modelName] || 0;
          if (current >= 100) {
            clearInterval(progressInterval);
            return { ...prev, [modelName]: 100 };
          }
          return { ...prev, [modelName]: current + 10 };
        });
      }, 1000);

      // Show success message
      setTimeout(() => {
        setTrainingProgress((prev) => ({ ...prev, [modelName]: null }));
        refetchModels();
      }, 12000);
    } catch (error) {
      console.error("Training failed:", error);
      setTrainingProgress((prev) => ({ ...prev, [modelName]: null }));
    }
  };

  const handleToggleModel = async (modelName: any) => {
    try {
      await toggleModel({ modelName }).unwrap();
      refetchModels();
    } catch (error) {
      console.error("Toggle failed:", error);
    }
  };

  if (modelsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ML Models Overview */}
      {selectedModel && (
        <ModelPerformanceCharts modelName={selectedModel.model_name} />
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
                {mlConfigs?.map((model: any) => (
                  <motion.div
                    key={model.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedModel?.id === model.id
                        ? "border-primary bg-primary/5"
                        : "border-base-300 hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedModel(model)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2 rounded-lg ${
                            model.is_active
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
                        {trainingProgress[model.model_name] !== undefined &&
                          trainingProgress[model.model_name] !== null && (
                            <div className="flex items-center gap-2">
                              <div
                                className="radial-progress text-primary text-sm"
                                style={{
                                  "--value": trainingProgress[model.model_name],
                                }}
                              >
                                {trainingProgress[model.model_name]}%
                              </div>
                              <span className="text-xs">Training...</span>
                            </div>
                          )}

                        {/* Model Status */}
                        <div
                          className={`badge ${
                            model.is_active ? "badge-success" : "badge-ghost"
                          }`}
                        >
                          {model.is_active ? "Active" : "Inactive"}
                        </div>

                        {/* Accuracy Score */}
                        {model.accuracy && (
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
                              handleTrainModel(model.model_name);
                            }}
                            disabled={
                              trainingProgress[model.model_name] !==
                                undefined &&
                              trainingProgress[model.model_name] !== null
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
                              handleToggleModel(model.model_name);
                            }}
                            className={`btn btn-sm ${
                              model.is_active ? "btn-warning" : "btn-success"
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
                            ? new Date(model.last_trained).toLocaleDateString()
                            : "Never"}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-base-content/60">
                          Precision
                        </p>
                        <p className="font-medium text-sm">
                          {model.precision
                            ? (model.precision * 100).toFixed(1) + "%"
                            : "N/A"}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-base-content/60">Recall</p>
                        <p className="font-medium text-sm">
                          {model.recall
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
    useGetModelPerformanceQuery({ modelName: model.model_name });

  return (
    <div className="space-y-4">
      {/* Model Status */}
      <div className="p-4 bg-base-200/50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Status</span>
          <div
            className={`flex items-center gap-2 ${
              model.is_active ? "text-success" : "text-base-content/50"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                model.is_active
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
              {model.accuracy ? (model.accuracy * 100).toFixed(1) + "%" : "N/A"}
            </p>
          </div>

          <div className="p-3 bg-info/10 rounded-lg border border-info/20">
            <p className="text-xs text-info">Precision</p>
            <p className="font-bold text-info">
              {model.precision
                ? (model.precision * 100).toFixed(1) + "%"
                : "N/A"}
            </p>
          </div>

          <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
            <p className="text-xs text-warning">Recall</p>
            <p className="font-bold text-warning">
              {model.recall ? (model.recall * 100).toFixed(1) + "%" : "N/A"}
            </p>
          </div>

          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-xs text-primary">F1 Score</p>
            <p className="font-bold text-primary">
              {model.accuracy && model.precision && model.recall
                ? (
                    ((2 * model.precision * model.recall) /
                      (model.precision + model.recall)) *
                    100
                  ).toFixed(1) + "%"
                : "N/A"}
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
                  {modelPerformance.recommendation_performance?.total_recommendations?.toLocaleString() ||
                    0}
                </span>
              </div>

              <div className="flex justify-between items-center p-2 bg-base-200/50 rounded">
                <span className="text-sm flex items-center gap-2">
                  <MousePointer className="w-3 h-3" />
                  Click-through Rate
                </span>
                <span className="font-medium text-primary">
                  {modelPerformance.recommendation_performance
                    ?.click_through_rate || 0}
                  %
                </span>
              </div>

              <div className="flex justify-between items-center p-2 bg-base-200/50 rounded">
                <span className="text-sm flex items-center gap-2">
                  <ShoppingCart className="w-3 h-3" />
                  Conversion Rate
                </span>
                <span className="font-medium text-success">
                  {modelPerformance.recommendation_performance
                    ?.conversion_rate || 0}
                  %
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

const ModelPerformanceCharts = ({ modelName }) => {
  const { data: modelPerformance, isLoading } = useGetModelPerformanceQuery({
    modelName,
  });

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
            <span>No performance data available for {modelName}</span>
          </div>
        </div>
      </div>
    );
  }

  // Extract real data from the API response
  const {
    accuracy,
    precision,
    recall,
    last_trained,
    recommendation_performance: {
      total_recommendations,
      click_through_rate,
      conversion_rate,
      average_score,
    },
  } = modelPerformance;

  // Real ML metrics data
  const mlMetricsData = [
    {
      metric: "Accuracy",
      value: (accuracy * 100).toFixed(2),
      rawValue: accuracy,
      color: "#10b981",
      description: "Overall prediction accuracy",
    },
    {
      metric: "Precision",
      value: (precision * 100).toFixed(2),
      rawValue: precision,
      color: "#3b82f6",
      description: "Relevant recommendations ratio",
    },
    {
      metric: "Recall",
      value: (recall * 100).toFixed(2),
      rawValue: recall,
      color: "#f59e0b",
      description: "Coverage of relevant items",
    },
  ];

  // Real business metrics data
  const businessMetricsData = [
    {
      metric: "CTR",
      value: click_through_rate.toFixed(2),
      rawValue: click_through_rate,
      color: "#8b5cf6",
      description: "Click-through rate",
    },
    {
      metric: "Conversion",
      value: conversion_rate.toFixed(2),
      rawValue: conversion_rate,
      color: "#ef4444",
      description: "Conversion rate",
    },
    {
      metric: "Avg Score",
      value: (average_score * 100).toFixed(1),
      rawValue: average_score * 100,
      color: "#06b6d4",
      description: "Average recommendation score",
    },
  ];

  // Combined metrics for comparison
  const comparisonData = [
    {
      category: "ML Performance",
      accuracy: accuracy * 100,
      precision: precision * 100,
      recall: recall * 100,
    },
    {
      category: "Business Impact",
      ctr: click_through_rate,
      conversion: conversion_rate,
      avgScore: average_score * 100,
    },
  ];

  // F1 Score calculation
  const f1Score = (2 * (precision * recall)) / (precision + recall);

  // Performance breakdown for pie chart
  const performanceBreakdown = [
    {
      name: "Successful Recs",
      value: Math.round(total_recommendations * (conversion_rate / 100)),
      color: "#10b981",
    },
    {
      name: "Clicked Only",
      value: Math.round(
        total_recommendations * ((click_through_rate - conversion_rate) / 100)
      ),
      color: "#f59e0b",
    },
    {
      name: "No Interaction",
      value: Math.round(
        total_recommendations * ((100 - click_through_rate) / 100)
      ),
      color: "#ef4444",
    },
  ];

  const formatLastTrained = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with model info */}
      <div className="card bg-base-100 border border-base-300 shadow-lg">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-primary" />
                Performance Analytics - {modelName}
              </h3>
              <p className="text-sm text-base-content/70 mt-1">
                Last trained: {formatLastTrained(last_trained)}
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
                  {(f1Score * 100).toFixed(1)}%
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
                  <span className="font-bold">{metric.value}%</span>
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
                  <span className="font-bold">{metric.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendation Performance Breakdown */}
      <div className="card bg-base-100 border border-base-300 shadow-lg">
        <div className="card-body">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            Recommendation Performance Breakdown
          </h4>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={performanceBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(1)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {performanceBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [value.toLocaleString(), "Count"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Performance Stats */}
            <div className="space-y-4">
              <div className="stats stats-vertical shadow w-full">
                <div className="stat">
                  <div className="stat-figure text-success">
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
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                  </div>
                  <div className="stat-title">Conversion Rate</div>
                  <div className="stat-value text-success">
                    {conversion_rate.toFixed(2)}%
                  </div>
                  <div className="stat-desc">
                    {Math.round(
                      total_recommendations * (conversion_rate / 100)
                    )}{" "}
                    conversions
                  </div>
                </div>

                <div className="stat">
                  <div className="stat-figure text-warning">
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
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                      ></path>
                    </svg>
                  </div>
                  <div className="stat-title">Click-through Rate</div>
                  <div className="stat-value text-warning">
                    {click_through_rate.toFixed(2)}%
                  </div>
                  <div className="stat-desc">
                    {Math.round(
                      total_recommendations * (click_through_rate / 100)
                    )}{" "}
                    clicks
                  </div>
                </div>

                <div className="stat">
                  <div className="stat-figure text-info">
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
                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                      ></path>
                    </svg>
                  </div>
                  <div className="stat-title">Average Score</div>
                  <div className="stat-value text-info">
                    {(average_score * 100).toFixed(1)}%
                  </div>
                  <div className="stat-desc">Recommendation confidence</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
              {accuracy > 0.9
                ? "excellent"
                : accuracy > 0.8
                ? "good"
                : "moderate"}
            </strong>{" "}
            accuracy ({(accuracy * 100).toFixed(1)}%) with{" "}
            <strong>{f1Score > 0.4 ? "balanced" : "imbalanced"}</strong>{" "}
            precision-recall trade-off (F1: {(f1Score * 100).toFixed(1)}%).
            Business impact:{" "}
            <strong>
              {conversion_rate > 50
                ? "high"
                : conversion_rate > 30
                ? "moderate"
                : "low"}
            </strong>{" "}
            conversion rate from {total_recommendations.toLocaleString()}{" "}
            recommendations served.
          </div>
        </div>
      </div>
    </div>
  );
};

// Recommendation Management Component
const RecommendationManagement = () => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("all");
  const [timeRange, setTimeRange] = useState(30);

  const {
    data: recPerformance,
    isLoading: recLoading,
    refetch: refetchRecPerformance,
  } = useGetRecommendationPerformanceQuery({
    algorithm: selectedAlgorithm === "all" ? null : selectedAlgorithm,
    days: timeRange,
  });

  const algorithms = [
    { id: "all", name: "All Algorithms", color: "primary" },
    {
      id: "collaborative_filtering",
      name: "Collaborative Filtering",
      color: "success",
    },
    { id: "content_based", name: "Content Based", color: "info" },
    { id: "hybrid", name: "Hybrid Model", color: "warning" },
    { id: "deep_learning", name: "Deep Learning", color: "error" },
  ];

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
            className="select select-bordered select-sm"
            value={selectedAlgorithm}
            onChange={(e) => setSelectedAlgorithm(e.target.value)}
          >
            {algorithms.map((alg) => (
              <option key={alg.id} value={alg.id}>
                {alg.name}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {recPerformance?.map((algorithm: any, index: number) => (
          <motion.div
            key={algorithm.algorithm}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card bg-base-100 border border-base-300 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="card-body p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">
                  {algorithm.algorithm.replace(/_/g, " ")}
                </h3>
                <div className="badge badge-primary">
                  {algorithm.impressions?.toLocaleString()}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-base-content/60 flex items-center gap-2">
                    <MousePointer className="w-3 h-3" />
                    CTR
                  </span>
                  <span className="font-bold text-primary">
                    {algorithm.click_through_rate}%
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-base-content/60 flex items-center gap-2">
                    <ShoppingCart className="w-3 h-3" />
                    Conversion
                  </span>
                  <span className="font-bold text-success">
                    {algorithm.conversion_rate}%
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-base-content/60 flex items-center gap-2">
                    <TrendingUp className="w-3 h-3" />
                    Revenue
                  </span>
                  <span className="font-bold text-warning">
                    ${algorithm.revenue_impact?.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-base-300">
                <div className="flex justify-between text-xs text-base-content/50">
                  <span>Clicks: {algorithm.clicks}</span>
                  <span>Conversions: {algorithm.conversions}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Performance Chart */}
      <RecommendationPerformanceChart algorithms={recPerformance} />
    </div>
  );
};

// Recommendation Performance Chart
const RecommendationPerformanceChart = ({ algorithms }) => {
  const chartData =
    algorithms?.map(
      (alg: {
        algorithm: string;
        click_through_rate: any;
        conversion_rate: any;
        impressions: any;
        revenue_impact: any;
      }) => ({
        name: alg.algorithm.replace(/_/g, " "),
        ctr: alg.click_through_rate,
        conversion: alg.conversion_rate,
        impressions: alg.impressions,
        revenue: alg.revenue_impact,
      })
    ) || [];

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
                <Bar dataKey="ctr" fill="#3ac999" name="CTR %" />
                <Bar dataKey="conversion" fill="#60a5fa" name="Conversion %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Distribution */}
          <div>
            <h4 className="font-medium mb-4">Revenue Distribution</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {chartData.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        ["#3ac999", "#60a5fa", "#fb923c", "#f87171"][index % 4]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [
                    `$${value.toLocaleString()}`,
                    "Revenue",
                  ]}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

// User Segmentation Management Component

const UserSegmentationManagement = () => {
  const [isCreatingSegment, setIsCreatingSegment] = useState(false);
  const [newSegment, setNewSegment] = useState({
    name: "",
    description: "",
    criteria: { field: "Purchase Amount", operator: "Greater than", value: "" },
  });

  const {
    data: userSegments,
    isLoading: segmentsLoading,
    refetch: refetchSegments,
  } = useGetUserSegmentsQuery({});

  const { data: segmentPerformance, isLoading: performanceLoading } =
    useGetSegmentPerformanceQuery({});

  const [refreshSegments] = useRefreshSegmentsMutation();

  const handleRefreshSegments = async () => {
    try {
      await refreshSegments({}).unwrap();
      refetchSegments();
    } catch (error) {
      console.error("Refresh failed:", error);
    }
  };

  if (segmentsLoading || performanceLoading) {
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
            value: userSegments?.length || 0,
            icon: Users,
            color: "primary",
          },
          {
            title: "Total Users",
            value:
              segmentPerformance?.reduce(
                (sum: any, seg: { user_count: any }) => sum + seg.user_count,
                0
              ) || 0,
            icon: Target,
            color: "success",
          },
          {
            title: "Avg Conversion",
            value: segmentPerformance?.length
              ? (
                  segmentPerformance.reduce(
                    (sum: any, seg: { conversion_rate: any }) =>
                      sum + seg.conversion_rate,
                    0
                  ) / segmentPerformance.length
                ).toFixed(1) + "%"
              : "0%",
            icon: TrendingUp,
            color: "warning",
          },
          {
            title: "Total Revenue",
            value:
              "$" +
              (segmentPerformance
                ?.reduce(
                  (sum: any, seg: { revenue_contribution: any }) =>
                    sum + seg.revenue_contribution,
                  0
                )
                .toLocaleString() || 0),
            icon: Activity,
            color: "info",
          },
        ].map((metric, index) => (
          <div
            key={index}
            className={`card bg-gradient-to-br from-${metric.color}/10 to-${metric.color}/20 border border-${metric.color}/30 shadow-md hover:shadow-lg transition-shadow rounded-xl`}
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
        <ActiveSegmentsCard userSegments={userSegments} />
        <SegmentPerformanceChart segmentPerformance={segmentPerformance} />
      </div>

      {/* Segment Details */}
      <SegmentDetailsTable segmentPerformance={segmentPerformance} />

      {/* Create New Segment Modal */}
      <AnimatePresence>
        {isCreatingSegment && (
          <CreateSegmentModal
            newSegment={newSegment}
            setNewSegment={setNewSegment}
            onClose={() => setIsCreatingSegment(false)}
            onSave={() => {
              setIsCreatingSegment(false);
              refetchSegments();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Active Segments Card
const ActiveSegmentsCard = ({ userSegments }) => {
  const [showAllActive, setShowAllActive] = useState(false);
  const visibleSegments = showAllActive
    ? userSegments
    : userSegments?.slice(0, 3) || [];

  return (
    <div className="card bg-base-100 border border-base-300 shadow-lg rounded-xl">
      <div className="card-body">
        <h3 className="text-xl font-semibold mb-4 text-base-content">
          Active Segments
        </h3>

        <div className="space-y-3">
          <AnimatePresence>
            {visibleSegments.map(
              (
                segment: {
                  segment_id: React.Key | null | undefined;
                  segment_name: string;
                  description: string;
                  user_count: number;
                  created_at: string | number | Date;
                },
                index: number
              ) => (
                <motion.div
                  key={segment.segment_id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 border border-base-200 rounded-lg hover:bg-primary/5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-base-content">
                          {segment.segment_name}
                        </h4>
                        <p className="text-sm text-base-content/60">
                          {segment.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="badge badge-primary badge-lg">
                        {segment.user_count} users
                      </div>
                      <p className="text-xs text-base-content/50 mt-2">
                        Created:{" "}
                        {new Date(segment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>

        {userSegments?.length > 3 && (
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
                  Show {userSegments.length - 3} More
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
const SegmentPerformanceChart = ({ segmentPerformance }) => {
  const activeSegments =
    segmentPerformance?.filter((seg) => seg.user_count > 0) || [];

  return (
    <div className="card bg-base-100 border border-base-300 shadow-lg rounded-xl">
      <div className="card-body">
        <h3 className="text-xl font-semibold mb-4 text-base-content">
          Segment Performance
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={activeSegments}
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
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              }}
              formatter={(value, name) => {
                if (name === "revenue_contribution") {
                  return [`$${value.toLocaleString()}`, "Revenue"];
                }
                if (name === "conversion_rate") {
                  return [`${value.toFixed(1)}%`, "Conversion"];
                }
                return [value, name];
              }}
            />
            <Legend verticalAlign="top" height={36} />
            <Bar
              yAxisId="left"
              dataKey="user_count"
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
const SegmentDetailsTable = ({ segmentPerformance }) => {
  const [showAllSegments, setShowAllSegments] = useState(false);
  const activeSegments =
    segmentPerformance?.filter((seg) => seg.user_count > 0) || [];
  const inactiveSegments =
    segmentPerformance?.filter((seg) => seg.user_count === 0) || [];

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
              {activeSegments.map(
                (segment: any, index: React.Key | null | undefined) => (
                  <tr key={index} className="hover:bg-base-200/50">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                          <div className="bg-primary text-primary-content rounded-full w-8">
                            <span className="text-xs">
                              {segment.segment_name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="font-semibold">
                          {segment.segment_name}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="badge badge-primary badge-lg">
                        {segment.user_count}
                      </div>
                    </td>
                    <td>${segment.avg_order_value.toFixed(2)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div
                          className="progress progress-primary w-16"
                          style={{ "--value": segment.conversion_rate } as any}
                        ></div>
                        <span className="text-sm">
                          {segment.conversion_rate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="font-semibold text-success">
                      ${segment.revenue_contribution.toLocaleString()}
                    </td>
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
                  </tr>
                )
              )}
              <AnimatePresence>
                {showAllSegments &&
                  inactiveSegments.map(
                    (segment: any, index: React.Key | null | undefined) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-base-content/60"
                      >
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="avatar placeholder">
                              <div className="bg-neutral text-neutral-content rounded-full w-8">
                                <span className="text-xs">
                                  {segment.segment_name.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="font-semibold">
                              {segment.segment_name}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="badge badge-neutral badge-lg">
                            {segment.user_count}
                          </div>
                        </td>
                        <td>${segment.avg_order_value.toFixed(2)}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div
                              className="progress progress-neutral w-16"
                              style={
                                { "--value": segment.conversion_rate } as any
                              }
                            ></div>
                            <span className="text-sm">
                              {segment.conversion_rate.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="font-semibold">
                          ${segment.revenue_contribution.toLocaleString()}
                        </td>
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
                    )
                  )}
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
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Hide Inactive Segments
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Show {inactiveSegments.length} Inactive Segments
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
const CreateSegmentModal = ({ newSegment, setNewSegment, onClose, onSave }) => {
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

  const criteriaFields = [
    "Purchase Amount",
    "Order Frequency",
    "Last Purchase Date",
    "Product Category",
  ];
  const operators = ["Greater than", "Less than", "Equal to", "Between"];

  const handleCriteriaChange = (key: string, value: string) => {
    setNewSegment((prev: any) => ({
      ...prev,
      criteria: { ...prev.criteria, [key]: value },
    }));
  };

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
        className="bg-base-100 w-full max-w-lg rounded-2xl shadow-2xl border border-base-200"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-base-content">
              Create Segment
            </h3>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-circle hover:bg-base-200"
            >
              <X className="w-5 h-5 text-base-content/70" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Segment Name */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-base-content/80">
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
                <span className="label-text font-semibold text-base-content/80">
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
              <div className="grid grid-cols-1 gap-3">
                {segmentTypes.map((type) => (
                  <label
                    key={type.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-base-200 hover:bg-primary/5 cursor-pointer transition-all"
                  >
                    <input
                      type="radio"
                      name="segmentType"
                      className="radio radio-primary radio-sm"
                      value={type.id}
                      onChange={(e) =>
                        setNewSegment((prev: any) => ({
                          ...prev,
                          type: e.target.value,
                        }))
                      }
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
                ))}
              </div>
            </div>

            {/* Criteria Builder */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-base-content/80">
                  Criteria
                </span>
              </label>
              <div className="flex flex-col gap-3 bg-base-200/30 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <select
                    className="select select-bordered rounded-lg bg-base-100 border-base-300 flex-1"
                    value={newSegment.criteria.field}
                    onChange={(e) =>
                      handleCriteriaChange("field", e.target.value)
                    }
                  >
                    {criteriaFields.map((field) => (
                      <option key={field} value={field}>
                        {field}
                      </option>
                    ))}
                  </select>
                  <select
                    className="select select-bordered rounded-lg bg-base-100 border-base-300 w-40"
                    value={newSegment.criteria.operator}
                    onChange={(e) =>
                      handleCriteriaChange("operator", e.target.value)
                    }
                  >
                    {operators.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="input input-bordered rounded-lg bg-base-100 border-base-300 w-32 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="Value"
                    value={newSegment.criteria.value}
                    onChange={(e) =>
                      handleCriteriaChange("value", e.target.value)
                    }
                  />
                </div>
                <button
                  className="btn btn-ghost btn-sm text-primary self-end"
                  onClick={() =>
                    setNewSegment((prev: any) => ({
                      ...prev,
                      criteria: {
                        field: "Purchase Amount",
                        operator: "Greater than",
                        value: "",
                      },
                    }))
                  }
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Another
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button
              onClick={onClose}
              className="btn btn-ghost rounded-full px-6 hover:bg-base-200"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="btn btn-primary rounded-full px-6"
            >
              <Save className="w-4 h-4 mr-2" />
              Create Segment
            </button>
          </div>
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
          Manage your machine learning models, recommendations, and user
          segmentation
        </p>
      </motion.div>

      {/* Navigation Tabs */}
      {/* <div className="tabs tabs-boxed mb-8 bg-base-200 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab tab-lg flex items-center gap-2 ${
                activeTab === tab.id ? "tab-active" : ""
              }`}
            >
              <Icon className="w-5 h-5" />
              {tab.name}
            </button>
          );
        })}
      </div> */}

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "models" && <MLModelManagement />}
          {/* {activeTab === "recommendations" && <RecommendationManagement />}
          {activeTab === "segmentation" && <UserSegmentationManagement />} */}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default MLManagementDashboard;
export { RecommendationManagement, UserSegmentationManagement };
