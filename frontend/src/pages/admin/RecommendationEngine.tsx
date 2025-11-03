// src/pages/admin/RecommendationEngine.tsx
import { motion } from "framer-motion";
import { Brain, CheckCircle, Clock, Settings } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  useGetMlConfigsQuery,
  useCreateMlConfigMutation,
} from "../../store/api/adminApi";

interface RecommendationConfig {
  default_recommendation_count: number;
  max_recommendation_count: number;
  cache_ttl_seconds: number;
  use_ml_models: boolean;
  algorithms: {
    collaborative_filtering: boolean;
    content_based: boolean;
    hybrid: boolean;
  };
}

export const RecommendationEngine: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "config" | "analytics"
  >("overview");
  const [timeRange, setTimeRange] = useState(30);

  const { data: config, isLoading: configLoading } = useGetMlConfigsQuery({});

  const [updateConfig, { isLoading: isUpdating }] = useCreateMlConfigMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecommendationConfig>();

  // Initialize form with current config
  React.useEffect(() => {
    if (config?.config) {
      reset(config.config);
    }
  }, [config, reset]);

  const onSubmit = async (data: RecommendationConfig) => {
    try {
      await updateConfig(data).unwrap();
      toast.success("Recommendation configuration updated successfully");
    } catch (error) {
      toast.error("Failed to update configuration");
      console.error("Config update error:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary" />
            Recommendation Engine
          </h1>
          <p className="text-base-content/70 mt-1">
            Manage and monitor your AI-powered recommendation system
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="select select-bordered select-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="tabs tabs-boxed">
        <button
          className={`tab ${activeTab === "overview" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === "analytics" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          Analytics
        </button>
        <button
          className={`tab ${activeTab === "config" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("config")}
        >
          Configuration
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Stats Grid */}

          {/* System Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">System Status</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base-content">ML Models</span>
                    <div className="badge badge-success gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Active
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-base-content">Cache Status</span>
                    <div className="badge badge-success gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Healthy
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-base-content">API Response</span>
                    <div className="badge badge-warning gap-2">
                      <Clock className="w-4 h-4" />
                      125ms
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">Algorithm Usage</h3>
                <div className="space-y-4">
                  {config?.config?.algorithms &&
                    Object.entries(config.config.algorithms).map(
                      ([key, enabled]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between"
                        >
                          <span className="text-base-content capitalize">
                            {key.replace(/_/g, " ")}
                          </span>
                          <div
                            className={`badge ${
                              enabled ? "badge-success" : "badge-error"
                            }`}
                          >
                            {enabled ? "Enabled" : "Disabled"}
                          </div>
                        </div>
                      )
                    )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Configuration Tab */}
      {activeTab === "config" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">
                <Settings className="w-5 h-5" />
                Recommendation Configuration
              </h3>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Settings */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Basic Settings</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Default Recommendation Count"
                      type="number"
                      min="1"
                      max="50"
                      error={errors.default_recommendation_count?.message}
                      {...register("default_recommendation_count", {
                        required: "Default count is required",
                        min: { value: 1, message: "Minimum 1 recommendation" },
                        max: {
                          value: 50,
                          message: "Maximum 50 recommendations",
                        },
                      })}
                    />

                    <Input
                      label="Maximum Recommendation Count"
                      type="number"
                      min="1"
                      max="100"
                      error={errors.max_recommendation_count?.message}
                      {...register("max_recommendation_count", {
                        required: "Maximum count is required",
                        min: { value: 1, message: "Minimum 1 recommendation" },
                        max: {
                          value: 100,
                          message: "Maximum 100 recommendations",
                        },
                      })}
                    />

                    <Input
                      label="Cache TTL (seconds)"
                      type="number"
                      min="300"
                      max="86400"
                      error={errors.cache_ttl_seconds?.message}
                      {...register("cache_ttl_seconds", {
                        required: "Cache TTL is required",
                        min: { value: 300, message: "Minimum 5 minutes" },
                        max: { value: 86400, message: "Maximum 24 hours" },
                      })}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label cursor-pointer">
                      <span className="label-text">Use ML Models</span>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary"
                        {...register("use_ml_models")}
                      />
                    </label>
                  </div>
                </div>

                {/* Algorithm Settings */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Algorithm Settings</h4>

                  <div className="space-y-3">
                    <div className="form-control">
                      <label className="label cursor-pointer">
                        <span className="label-text">
                          Collaborative Filtering
                        </span>
                        <input
                          type="checkbox"
                          className="toggle toggle-primary"
                          {...register("algorithms.collaborative_filtering")}
                        />
                      </label>
                    </div>

                    <div className="form-control">
                      <label className="label cursor-pointer">
                        <span className="label-text">
                          Content-Based Filtering
                        </span>
                        <input
                          type="checkbox"
                          className="toggle toggle-primary"
                          {...register("algorithms.content_based")}
                        />
                      </label>
                    </div>

                    <div className="form-control">
                      <label className="label cursor-pointer">
                        <span className="label-text">Hybrid Approach</span>
                        <input
                          type="checkbox"
                          className="toggle toggle-primary"
                          {...register("algorithms.hybrid")}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => reset()}
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={isUpdating || configLoading}
                  >
                    Save Configuration
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
