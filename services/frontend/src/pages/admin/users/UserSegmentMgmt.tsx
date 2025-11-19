/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/UserSegmentation.tsx
import { motion } from "framer-motion";
import { Edit, Plus, RefreshCw, Target, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { AdminTable, StatCard } from "../../../components/admin/ui/Chart";
import {
  useGetUserSegmentsQuery,
  useCreateUserSegmentMutation,
  useUpdateUserSegmentMutation,
  useDeleteUserSegmentMutation,
  useRecalculateSegmentMutation,
  useGenerateRfmSegmentsMutation,
} from "../../../store/api/adminApi";

interface SegmentForm {
  name: string;
  description: string;
  criteria: {
    registration_days?: number;
    order_count?: { min: number; max: number };
    min_frequency?: number;
    min_monetary?: number;
  };
  auto_update: boolean;
}

export const UserSegmentation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"segments" | "rfm" | "create">(
    "segments"
  );
  const [editingSegment, setEditingSegment] = useState<any>(null);

  const { data: segments = [], isLoading: segmentsLoading } =
    useGetUserSegmentsQuery({});

  const [createSegment, { isLoading: isCreating }] =
    useCreateUserSegmentMutation();
  const [updateSegment, { isLoading: isUpdating }] =
    useUpdateUserSegmentMutation();
  const [deleteSegment] = useDeleteUserSegmentMutation();
  const [recalculateSegment] = useRecalculateSegmentMutation();
  const [generateRfmSegments, { isLoading: isGeneratingRfm }] =
    useGenerateRfmSegmentsMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SegmentForm>();

  const onSubmit = async (data: SegmentForm) => {
    try {
      if (editingSegment) {
        await updateSegment({ segmentId: editingSegment.id, segment: data }).unwrap();
        toast.success("Segment updated successfully");
        setEditingSegment(null);
      } else {
        await createSegment(data).unwrap();
        toast.success("Segment created successfully");
      }
      reset();
      setActiveTab("segments");
    } catch (error) {
      toast.error("Failed to save segment");
      console.error("Segment save error:", error);
    }
  };

  const handleDeleteSegment = async (segmentId: string) => {
    if (!confirm("Are you sure you want to delete this segment?")) return;
    try {
      await deleteSegment(segmentId).unwrap();
      toast.success("Segment deleted successfully");
    } catch (error) {
      toast.error("Failed to delete segment");
      console.error("Segment delete error:", error);
    }
  };

  const handleRecalculateSegment = async (segmentId: string) => {
    try {
      await recalculateSegment({ segmentId }).unwrap();
      toast.success("Segment recalculation started");
    } catch (error) {
      toast.error("Failed to recalculate segment");
      console.error("Segment recalculate error:", error);
    }
  };

  const handleGenerateRfm = async () => {
    try {
      await generateRfmSegments({ n_clusters: 5, lookback_days: 365 }).unwrap();
      toast.success("RFM segments generated successfully");
      setActiveTab("segments");
    } catch (error) {
      toast.error("Failed to generate RFM segments");
      console.error("RFM generation error:", error);
    }
  };

  const segmentStats = [
    {
      title: "Total Segments",
      value: segments.length ? segments.length.toString() : "0",
      icon: <Target className="w-6 h-6" />,
      color: "text-primary",
    },
  ];

  const segmentColumns = [
    { key: "name", title: "Segment Name", width: "25%" },
    { key: "description", title: "Description", width: "35%" },
    {
      key: "user_count",
      title: "Users",
      width: "15%",
      render: (_value: number, record: any) =>
        (record?.user_count ?? record?.member_count ?? 0).toLocaleString(),
    },
    {
      key: "last_updated",
      title: "Last Updated",
      width: "15%",
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: "actions",
      title: "Actions",
      width: "10%",
      render: (_value: any, record: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingSegment(record);
              setActiveTab("create");
              reset(record);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRecalculateSegment(record.id)}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteSegment(record.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Target className="w-8 h-8 text-primary" />
            User Segmentation
          </h1>
          <p className="text-base-content/70 mt-1">
            Manage customer segments and analyze user behavior patterns
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setActiveTab("create")}
            icon={<Plus className="w-4 h-4" />}
          >
            Create Segment
          </Button>
        </div>
      </motion.div>

      <div className="tabs tabs-boxed">
        <button
          className={`tab ${activeTab === "segments" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("segments")}
        >
          Segments
        </button>
        <button
          className={`tab ${activeTab === "rfm" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("rfm")}
        >
          RFM Analysis
        </button>
        <button
          className={`tab ${activeTab === "create" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("create")}
        >
          {editingSegment ? "Edit Segment" : "Create Segment"}
        </button>
      </div>

      {activeTab === "segments" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {segmentStats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <StatCard
                  title={stat.title}
                  value={stat.value}
                  icon={stat.icon}
                  color={stat.color}
                  loading={segmentsLoading}
                />
              </motion.div>
            ))}
          </div>

          <AdminTable
            columns={segmentColumns}
            data={segments || []}
            loading={segmentsLoading}
          />
        </motion.div>
      )}

      {activeTab === "rfm" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">RFM Analysis</h3>
              <p className="text-base-content/70 mb-6">
                Generate user segments based on Recency, Frequency, and Monetary
                analysis. This will automatically create segments based on
                customer purchase patterns.
              </p>
              <div className="space-y-4">
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
                    <h3 className="font-bold">What is RFM Analysis?</h3>
                    <div className="text-xs">
                      RFM segments users based on:
                      <ul className="list-disc list-inside mt-2">
                        <li>
                          <strong>Recency:</strong> How recently did they
                          purchase?
                        </li>
                        <li>
                          <strong>Frequency:</strong> How often do they
                          purchase?
                        </li>
                        <li>
                          <strong>Monetary:</strong> How much do they spend?
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <Button
                  variant="primary"
                  onClick={handleGenerateRfm}
                  loading={isGeneratingRfm}
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  Generate RFM Segments
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "create" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">
                {editingSegment ? "Edit Segment" : "Create New Segment"}
              </h3>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Segment Name"
                    error={errors.name?.message}
                    {...register("name", {
                      required: "Segment name is required",
                    })}
                  />
                  <Input label="Description" {...register("description")} />
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Criteria</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Input
                      label="Registration Days"
                      type="number"
                      placeholder="30"
                      {...register("criteria.registration_days")}
                    />
                    <Input
                      label="Min Order Count"
                      type="number"
                      placeholder="1"
                      {...register("criteria.order_count.min")}
                    />
                    <Input
                      label="Max Order Count"
                      type="number"
                      placeholder="10"
                      {...register("criteria.order_count.max")}
                    />
                    <Input
                      label="Min Frequency"
                      type="number"
                      placeholder="5"
                      {...register("criteria.min_frequency")}
                    />
                    <Input
                      label="Min Monetary Value"
                      type="number"
                      placeholder="100"
                      {...register("criteria.min_monetary")}
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text">Auto Update</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      {...register("auto_update")}
                    />
                  </label>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setActiveTab("segments");
                      setEditingSegment(null);
                      reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={isCreating || isUpdating}
                  >
                    {editingSegment ? "Update Segment" : "Create Segment"}
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
