/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from "framer-motion";
import {
  Calendar,
  Crown,
  Heart,
  Mail,
  MapPin,
  Phone,
  Search,
  Settings,
  User,
} from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "@/hooks";
import {
  useGetCurrentUserQuery,
  useUpdateProfileMutation,
} from "../../store/api/authApi";

interface ProfileForm {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
    address_type?: string;
  };
  preferences?: {
    interests?: string[];
    price_range?: string;
    brand_preference?: string;
  };
}

export const ProfilePage: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const { user: authUser, isSuperAdmin } = useAuth();
  const { data: user, isLoading } = useGetCurrentUserQuery({});
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

  const currentUser = user || authUser;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileForm>();

  // Initialize form with user data
  React.useEffect(() => {
    if (currentUser) {
      reset({
        first_name: currentUser.first_name || "",
        last_name: currentUser.last_name || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        date_of_birth: currentUser.date_of_birth || "",
        gender: currentUser.gender || "",
        address: {
          street: currentUser.address?.street || "",
          city: currentUser.address?.city || "",
          state: currentUser.address?.state || "",
          zip_code: currentUser.address?.zip_code || "",
          country: currentUser.address?.country || "",
          address_type: currentUser.address?.address_type || "",
        },
        preferences: {
          interests: currentUser.preferences?.interests || [],
          price_range: currentUser.preferences?.price_range || "",
          brand_preference: currentUser.preferences?.brand_preference || "",
        },
      });
    }
  }, [currentUser, reset]);

  const onSubmit = async (data: ProfileForm) => {
    try {
      await updateProfile({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        date_of_birth: data.date_of_birth,
        gender: data.gender,
        address: {
          street: data.address?.street,
          city: data.address?.city,
          state: data.address?.state,
          zip_code: data.address?.zip_code,
          country: data.address?.country,
          address_type: data.address?.address_type,
        },
        preferences: {
          interests: data.preferences?.interests,
          price_range: data.preferences?.price_range,
          brand_preference: data.preferences?.brand_preference,
        },
      }).unwrap();
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const getRoleIcon = () => {
    if (isSuperAdmin) return <Crown className="w-5 h-5" />;
    return <User className="w-5 h-5" />;
  };

  const getRoleText = () => {
    if (isSuperAdmin) return "Superuser";
    if ((currentUser.permissions as string[]).includes("*")) return "Superuser";
    return "Customer";
  };

  const getRoleBadgeVariant = () => {
    if (isSuperAdmin) return "badge-warning";
    return "badge-neutral";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 bg-base-100">
        <div className="max-w-2xl mx-auto">
          <div className="space-y-4">
            <div className="skeleton h-8 w-48"></div>
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="skeleton h-16 w-full"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-base-content">
                Profile Settings
              </h1>
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
                icon={<Settings className="w-4 h-4" />}
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </Button>
            </div>

            <div className="tabs tabs-boxed bg-base-100 mb-6 rounded-lg justify-center flex py-2 gap-3">
              <button
                className={`tab ${activeTab === "profile" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("profile")}
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </button>
              <button
                className={`tab ${
                  activeTab === "preferences" ? "tab-active" : ""
                }`}
                onClick={() => setActiveTab("preferences")}
              >
                <Heart className="w-4 h-4 mr-2" />
                Preferences
              </button>
              <button
                className={`tab ${
                  activeTab === "activity" ? "tab-active" : ""
                }`}
                onClick={() => setActiveTab("activity")}
              >
                <Search className="w-4 h-4 mr-2" />
                Search Activity
              </button>
            </div>

            <div className="card bg-base-100 shadow-xl">
              {/* Profile Header */}
              <div className="card-body p-0">
                <div className="hero bg-gradient-to-r from-primary to-secondary text-primary-content rounded-t-2xl">
                  <div className="hero-content py-8">
                    <div className="flex items-center gap-6 w-full">
                      <div className="avatar placeholder">
                        <div className="bg-base-100 text-primary rounded-full w-20 h-20">
                          <User className="w-10 h-10 m-5" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold">
                          {currentUser?.first_name} {currentUser?.last_name}
                        </h2>
                        <p className="text-primary-content opacity-90 mb-2">
                          {currentUser?.email}
                        </p>
                        <p className="text-primary-content opacity-90 mb-2">
                          @{currentUser?.username}
                        </p>

                        {/* User Role Badge */}
                        <div className="badge badge-lg bg-base-100 text-primary border-0 gap-2">
                          {getRoleIcon()}
                          <span>{getRoleText()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {activeTab === "profile" && (
                  <>
                    {/* User Roles and Permissions */}
                    {currentUser?.roles && currentUser.roles.length > 0 && (
                      <div className="p-6 bg-base-100 border-b">
                        <h3 className="text-lg font-semibold text-base-content mb-4">
                          Roles & Permissions
                        </h3>
                        <div className="space-y-4">
                          {/* Roles */}
                          <div>
                            <p className="text-sm font-medium text-base-content opacity-70 mb-2">
                              Assigned Roles:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {currentUser.roles.map((role: any) => (
                                <div
                                  key={role.id}
                                  className={`badge ${getRoleBadgeVariant()} gap-2`}
                                >
                                  {getRoleIcon()}
                                  <span>{role.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Permissions */}
                          {currentUser.permissions &&
                            currentUser.permissions.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-base-content opacity-70 mb-2">
                                  Permissions:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {currentUser.permissions.map(
                                    (permission: string, index: number) => (
                                      <div
                                        key={index}
                                        className="badge badge-outline badge-sm text-base-content"
                                      >
                                        {permission === "*"
                                          ? "All Permissions"
                                          : permission}
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    )}

                    {/* Profile Form */}
                    <div className="p-6">
                      <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-8"
                      >
                        {/* Personal Information */}
                        <div>
                          <h3 className="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            Personal Information
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                              label="First Name"
                              icon={<User className="w-4 h-4" />}
                              disabled={!isEditing}
                              error={errors.first_name?.message}
                              {...register("first_name", {
                                required: "First name is required",
                              })}
                            />
                            <Input
                              label="Last Name"
                              icon={<User className="w-4 h-4" />}
                              disabled={!isEditing}
                              error={errors.last_name?.message}
                              {...register("last_name", {
                                required: "Last name is required",
                              })}
                            />
                            <Input
                              label="Email"
                              type="email"
                              icon={<Mail className="w-4 h-4" />}
                              disabled={!isEditing}
                              error={errors.email?.message}
                              {...register("email", {
                                required: "Email is required",
                              })}
                            />
                            <Input
                              label="Phone"
                              type="tel"
                              icon={<Phone className="w-4 h-4" />}
                              disabled={!isEditing}
                              error={errors.phone?.message}
                              {...register("phone")}
                            />
                            <Input
                              label="Date of Birth"
                              type="date"
                              disabled={!isEditing}
                              error={errors.date_of_birth?.message}
                              {...register("date_of_birth")}
                            />
                            <div className="form-control">
                              <label className="label">
                                <span className="label-text text-base-content font-medium">
                                  Gender
                                </span>
                              </label>
                              <select
                                disabled={!isEditing}
                                className="select select-bordered bg-base-100 text-base-content disabled:bg-base-200 disabled:opacity-60"
                                {...register("gender")}
                              >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                            <div className="form-control">
                              <label className="label">
                                <span className="label-text text-base-content font-medium">
                                  Member Since
                                </span>
                              </label>
                              <div className="input input-bordered flex items-center gap-2 bg-base-200">
                                <Calendar className="w-4 h-4 text-base-content opacity-70" />
                                <span className="text-base-content opacity-70">
                                  {formatDate(currentUser?.created_at || "")}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="divider text-base-content"></div>

                        {/* Address Information */}
                        <div>
                          <h3 className="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary" />
                            Address Information
                          </h3>
                          <div className="space-y-4">
                            <Input
                              label="Street Address"
                              icon={<MapPin className="w-4 h-4" />}
                              disabled={!isEditing}
                              error={errors.address?.street?.message}
                              {...register("address.street")}
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <Input
                                label="City"
                                disabled={!isEditing}
                                error={errors.address?.city?.message}
                                {...register("address.city")}
                              />
                              <Input
                                label="State/Province"
                                disabled={!isEditing}
                                error={errors.address?.state?.message}
                                {...register("address.state")}
                              />
                              <Input
                                label="ZIP/Postal Code"
                                disabled={!isEditing}
                                error={errors.address?.zip_code?.message}
                                {...register("address.zip_code")}
                              />
                              <div className="form-control">
                                <label className="label">
                                  <span className="label-text text-base-content font-medium">
                                    Country
                                  </span>
                                </label>
                                <select
                                  disabled={!isEditing}
                                  className="select select-bordered bg-base-100 text-base-content disabled:bg-base-200 disabled:opacity-60"
                                  {...register("address.country")}
                                >
                                  <option value="">Select Country</option>
                                  <option value="US">United States</option>
                                  <option value="CA">Canada</option>
                                  <option value="GB">United Kingdom</option>
                                  <option value="AU">Australia</option>
                                  <option value="IN">India</option>
                                  <option value="DE">Germany</option>
                                  <option value="FR">France</option>
                                </select>
                              </div>
                              <div className="form-control">
                                <label className="label">
                                  <span className="label-text text-base-content font-medium">
                                    Address Type
                                  </span>
                                </label>
                                <select
                                  disabled={!isEditing}
                                  className="select select-bordered bg-base-100 text-base-content disabled:bg-base-200 disabled:opacity-60"
                                  {...register("address.address_type")}
                                >
                                  <option value="">Select Type</option>
                                  <option value="home">Home</option>
                                  <option value="work">Work</option>
                                  <option value="other">Other</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Account Stats */}
                        <div>
                          <h3 className="text-lg font-semibold text-base-content mb-4">
                            Account Statistics
                          </h3>
                          <div className="stats stats-vertical lg:stats-horizontal shadow-lg bg-base-100 border border-base-200">
                            <div className="stat">
                              <div className="stat-figure text-primary">
                                <Calendar className="w-8 h-8" />
                              </div>
                              <div className="stat-title text-base-content opacity-70">
                                Account Age
                              </div>
                              <div className="stat-value text-primary text-2xl">
                                {Math.floor(
                                  (Date.now() -
                                    new Date(
                                      currentUser?.created_at || ""
                                    ).getTime()) /
                                    (1000 * 60 * 60 * 24)
                                )}{" "}
                                days
                              </div>
                            </div>

                            <div className="stat">
                              <div className="stat-figure text-secondary">
                                <User className="w-8 h-8" />
                              </div>
                              <div className="stat-title text-base-content opacity-70">
                                Verification Status
                              </div>
                              <div className="stat-value text-secondary text-lg">
                                {currentUser?.is_verified
                                  ? "Verified"
                                  : "Unverified"}
                              </div>
                              <div className="stat-desc text-base-content opacity-60">
                                {currentUser?.is_verified
                                  ? "Account is verified"
                                  : "Account not verified"}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Save Button */}
                        {isEditing && (
                          <div className="card-actions justify-end">
                            <Button
                              type="submit"
                              loading={isUpdating}
                              variant="primary"
                              size="lg"
                              className="px-8"
                            >
                              Save Changes
                            </Button>
                          </div>
                        )}
                      </form>
                    </div>
                  </>
                )}

                {activeTab === "preferences" && (
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-base-content mb-6 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-primary" />
                      User Preferences
                    </h3>

                    <div className="space-y-6">
                      <div>
                        <h4 className="text-md font-medium text-base-content mb-3">
                          Interests
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {currentUser?.preferences?.interests?.map(
                            (interest, index) => (
                              <div
                                key={index}
                                className="badge badge-primary badge-outline"
                              >
                                {interest}
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-md font-medium text-base-content mb-3">
                            Price Range
                          </h4>
                          <div className="badge badge-secondary">
                            {currentUser?.preferences?.price_range ||
                              "Not specified"}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-md font-medium text-base-content mb-3">
                            Brand Preference
                          </h4>
                          <div className="badge badge-accent">
                            {currentUser?.preferences?.brand_preference ||
                              "Not specified"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "activity" && (
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-base-content mb-6 flex items-center gap-2">
                      <Search className="w-5 h-5 text-primary" />
                      Search Activity
                    </h3>

                    <div className="space-y-4">
                      {currentUser?.search_analytics?.length ? (
                        currentUser.search_analytics.map((search, index) => (
                          <div
                            key={index}
                            className="card bg-base-100 shadow-sm border border-base-200"
                          >
                            <div className="card-body p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium text-base-content">
                                    {search.query}
                                  </h4>
                                  <p className="text-sm text-base-content opacity-70">
                                    {formatDateTime(search.created_at)}
                                  </p>
                                </div>
                                <div className="badge badge-neutral">
                                  {search.results_count} results
                                </div>
                              </div>

                              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-base-content opacity-70">
                                    Search type:{" "}
                                  </span>
                                  <span className="text-base-content">
                                    {search.search_type}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-base-content opacity-70">
                                    Response time:{" "}
                                  </span>
                                  <span className="text-base-content">
                                    {search.response_time_ms}ms
                                  </span>
                                </div>
                                {search.filters_applied && (
                                  <div className="col-span-2">
                                    <span className="text-base-content opacity-70">
                                      Filters:{" "}
                                    </span>
                                    <span className="text-base-content">
                                      {JSON.stringify(search.filters_applied)}
                                    </span>
                                  </div>
                                )}
                                {search.clicked_product_id && (
                                  <div className="col-span-2">
                                    <span className="text-base-content opacity-70">
                                      Clicked product:{" "}
                                    </span>
                                    <span className="text-base-content">
                                      {search.clicked_product_id}
                                    </span>
                                    {search.click_position && (
                                      <span className="ml-2 text-base-content opacity-70">
                                        (position: {search.click_position})
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-base-content opacity-70">
                            No search activity found
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { motion } from "framer-motion";
// import {
//   Calendar,
//   Crown,
//   Mail,
//   MapPin,
//   Phone,
//   Settings,
//   User,
// } from "lucide-react";
// import React, { useState } from "react";
// import { useForm } from "react-hook-form";
// import { Button } from "../../components/ui/Button";
// import { Input } from "../../components/ui/Input";
// import { useAuth } from "@/hooks";
// import {
//   useGetCurrentUserQuery,
//   useUpdateProfileMutation,
// } from "../../store/api/authApi";

// interface ProfileForm {
//   first_name: string;
//   last_name: string;
//   email: string;
//   phone?: string;
//   date_of_birth?: string;
//   gender?: string;
//   address?: {
//     street?: string;
//     city?: string;
//     state?: string;
//     zip_code?: string;
//     country?: string;
//     address_type?: string;
//   };
// }

// export const ProfilePage: React.FC = () => {
//   const [isEditing, setIsEditing] = useState(false);
//   const { user: authUser, isSuperAdmin } = useAuth();
//   const { data: user, isLoading } = useGetCurrentUserQuery({});
//   const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

//   const currentUser = user || authUser;

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//     reset,
//   } = useForm<ProfileForm>();

//   // Initialize form with user data
//   React.useEffect(() => {
//     if (currentUser) {
//       reset({
//         first_name: currentUser.first_name || "",
//         last_name: currentUser.last_name || "",
//         email: currentUser.email || "",
//         phone: currentUser.phone || "",
//         date_of_birth: currentUser.date_of_birth || "",
//         gender: currentUser.gender || "",
//         address: {
//           street: currentUser.address?.street || "",
//           city: currentUser.address?.city || "",
//           state: currentUser.address?.state || "",
//           zip_code: currentUser.address?.zip_code || "",
//           country: currentUser.address?.country || "",
//           address_type: currentUser.address?.address_type || "",
//         },
//       });
//     }
//   }, [currentUser, reset]);

//   const onSubmit = async (data: ProfileForm) => {
//     try {
//       await updateProfile({
//         first_name: data.first_name,
//         last_name: data.last_name,
//         email: data.email,
//         phone: data.phone,
//         date_of_birth: data.date_of_birth,
//         gender: data.gender,
//         address: {
//           street: data.address?.street,
//           city: data.address?.city,
//           state: data.address?.state,
//           zip_code: data.address?.zip_code,
//           country: data.address?.country,
//           address_type: data.address?.address_type,
//         },
//       }).unwrap();
//       setIsEditing(false);
//     } catch (error) {
//       console.error("Failed to update profile:", error);
//     }
//   };

//   const getRoleIcon = () => {
//     if (isSuperAdmin) return <Crown className="w-5 h-5" />;
//     return <User className="w-5 h-5" />;
//   };

//   const getRoleText = () => {
//     if (isSuperAdmin) return "Superuser";
//     return "Customer";
//   };

//   const getRoleBadgeVariant = () => {
//     if (isSuperAdmin) return "badge-warning";
//     return "badge-neutral";
//   };

//   if (isLoading) {
//     return (
//       <div className="container mx-auto px-4 py-8 bg-base-100">
//         <div className="max-w-2xl mx-auto">
//           <div className="space-y-4">
//             <div className="skeleton h-8 w-48"></div>
//             <div className="card bg-base-100 shadow-lg">
//               <div className="card-body">
//                 <div className="space-y-4">
//                   {[...Array(6)].map((_, i) => (
//                     <div key={i} className="skeleton h-16 w-full"></div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-base-200 py-8">
//       <div className="container mx-auto px-4 ">
//         <div className="max-w-2xl mx-auto">
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className=""
//           >
//             <div className="flex items-center justify-between mb-8">
//               <h1 className="text-3xl font-bold text-base-content">
//                 Profile Settings
//               </h1>
//               <Button
//                 variant="outline"
//                 onClick={() => setIsEditing(!isEditing)}
//                 icon={<Settings className="w-4 h-4" />}
//               >
//                 {isEditing ? "Cancel" : "Edit Profile"}
//               </Button>
//             </div>

//             <div className="card bg-base-100 shadow-xl">
//               {/* Profile Header */}
//               <div className="card-body p-0">
//                 <div className="hero bg-gradient-to-r from-primary to-secondary text-primary-content rounded-t-2xl">
//                   <div className="hero-content py-8">
//                     <div className="flex items-center gap-6 w-full">
//                       <div className="avatar placeholder">
//                         <div className="bg-base-100 text-primary rounded-full w-20 h-20">
//                           <User className="w-10 h-10 m-5" />
//                         </div>
//                       </div>
//                       <div className="flex-1">
//                         <h2 className="text-2xl font-bold">
//                           {currentUser?.first_name} {currentUser?.last_name}
//                         </h2>
//                         <p className="text-primary-content opacity-90 mb-2">
//                           {currentUser?.email}
//                         </p>
//                         <p className="text-primary-content opacity-90 mb-2">
//                           @{currentUser?.username}
//                         </p>

//                         {/* User Role Badge */}
//                         <div className="badge badge-lg bg-base-100 text-primary border-0 gap-2">
//                           {getRoleIcon()}
//                           <span>{getRoleText()}</span>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* User Roles and Permissions */}
//                 {currentUser?.roles && currentUser.roles.length > 0 && (
//                   <div className="p-6 bg-base-100 border-b ">
//                     <h3 className="text-lg font-semibold text-base-content mb-4">
//                       Roles & Permissions
//                     </h3>
//                     <div className="space-y-4">
//                       {/* Roles */}
//                       <div>
//                         <p className="text-sm font-medium text-base-content opacity-70 mb-2">
//                           Assigned Roles:
//                         </p>
//                         <div className="flex flex-wrap gap-2">
//                           {currentUser.roles.map((role: any) => (
//                             <div
//                               key={role.id}
//                               className={`badge ${getRoleBadgeVariant()} gap-2`}
//                             >
//                               {getRoleIcon()}
//                               <span>{role.name}</span>
//                             </div>
//                           ))}
//                         </div>
//                       </div>

//                       {/* Permissions */}
//                       {currentUser.permissions &&
//                         currentUser.permissions.length > 0 && (
//                           <div>
//                             <p className="text-sm font-medium text-base-content opacity-70 mb-2">
//                               Permissions:
//                             </p>
//                             <div className="flex flex-wrap gap-1">
//                               {currentUser.permissions.map(
//                                 (permission: string, index: number) => (
//                                   <div
//                                     key={index}
//                                     className="badge badge-outline badge-sm text-base-content"
//                                   >
//                                     {permission === "*"
//                                       ? "All Permissions"
//                                       : permission}
//                                   </div>
//                                 )
//                               )}
//                             </div>
//                           </div>
//                         )}
//                     </div>
//                   </div>
//                 )}

//                 {/* Profile Form */}
//                 <div className="p-6">
//                   <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
//                     {/* Personal Information */}
//                     <div>
//                       <h3 className="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
//                         <User className="w-5 h-5 text-primary" />
//                         Personal Information
//                       </h3>
//                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                         <Input
//                           label="First Name"
//                           icon={<User className="w-4 h-4" />}
//                           disabled={!isEditing}
//                           error={errors.first_name?.message}
//                           {...register("first_name", {
//                             required: "First name is required",
//                           })}
//                         />
//                         <Input
//                           label="Last Name"
//                           icon={<User className="w-4 h-4" />}
//                           disabled={!isEditing}
//                           error={errors.last_name?.message}
//                           {...register("last_name", {
//                             required: "Last name is required",
//                           })}
//                         />
//                         <Input
//                           label="Email"
//                           type="email"
//                           icon={<Mail className="w-4 h-4" />}
//                           disabled={!isEditing}
//                           error={errors.email?.message}
//                           {...register("email", {
//                             required: "Email is required",
//                           })}
//                         />
//                         <Input
//                           label="Phone"
//                           type="tel"
//                           icon={<Phone className="w-4 h-4" />}
//                           disabled={!isEditing}
//                           error={errors.phone?.message}
//                           {...register("phone")}
//                         />
//                         <Input
//                           label="Date of Birth"
//                           type="date"
//                           disabled={!isEditing}
//                           error={errors.date_of_birth?.message}
//                           {...register("date_of_birth")}
//                         />
//                         <div className="form-control">
//                           <label className="label">
//                             <span className="label-text text-base-content font-medium">
//                               Gender
//                             </span>
//                           </label>
//                           <select
//                             disabled={!isEditing}
//                             className="select select-bordered bg-base-100 text-base-content disabled:bg-base-200 disabled:opacity-60"
//                             {...register("gender")}
//                           >
//                             <option value="">Select Gender</option>
//                             <option value="male">Male</option>
//                             <option value="female">Female</option>
//                             <option value="other">Other</option>
//                           </select>
//                         </div>
//                         <div className="form-control">
//                           <label className="label">
//                             <span className="label-text text-base-content font-medium">
//                               Member Since
//                             </span>
//                           </label>
//                           <div className="input input-bordered flex items-center gap-2 bg-base-200">
//                             <Calendar className="w-4 h-4 text-base-content opacity-70" />
//                             <span className="text-base-content opacity-70">
//                               {new Date(
//                                 currentUser?.created_at || ""
//                               ).toLocaleDateString()}
//                             </span>
//                           </div>
//                         </div>
//                       </div>
//                     </div>

//                     <div className="divider text-base-content"></div>

//                     {/* Address Information */}
//                     <div>
//                       <h3 className="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
//                         <MapPin className="w-5 h-5 text-primary" />
//                         Address Information
//                       </h3>
//                       <div className="space-y-4">
//                         <Input
//                           label="Street Address"
//                           icon={<MapPin className="w-4 h-4" />}
//                           disabled={!isEditing}
//                           error={errors.address?.street?.message}
//                           {...register("address.street")}
//                         />
//                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                           <Input
//                             label="City"
//                             disabled={!isEditing}
//                             error={errors.address?.city?.message}
//                             {...register("address.city")}
//                           />
//                           <Input
//                             label="State/Province"
//                             disabled={!isEditing}
//                             error={errors.address?.state?.message}
//                             {...register("address.state")}
//                           />
//                           <Input
//                             label="ZIP/Postal Code"
//                             disabled={!isEditing}
//                             error={errors.address?.zip_code?.message}
//                             {...register("address.zip_code")}
//                           />
//                           <div className="form-control">
//                             <label className="label">
//                               <span className="label-text text-base-content font-medium">
//                                 Country
//                               </span>
//                             </label>
//                             <select
//                               disabled={!isEditing}
//                               className="select select-bordered bg-base-100 text-base-content disabled:bg-base-200 disabled:opacity-60"
//                               {...register("address.country")}
//                             >
//                               <option value="">Select Country</option>
//                               <option value="US">United States</option>
//                               <option value="CA">Canada</option>
//                               <option value="GB">United Kingdom</option>
//                               <option value="AU">Australia</option>
//                               <option value="IN">India</option>
//                               <option value="DE">Germany</option>
//                               <option value="FR">France</option>
//                             </select>
//                           </div>
//                           <div className="form-control">
//                             <label className="label">
//                               <span className="label-text text-base-content font-medium">
//                                 Address Type
//                               </span>
//                             </label>
//                             <select
//                               disabled={!isEditing}
//                               className="select select-bordered bg-base-100 text-base-content disabled:bg-base-200 disabled:opacity-60"
//                               {...register("address.address_type")}
//                             >
//                               <option value="">Select Type</option>
//                               <option value="home">Home</option>
//                               <option value="work">Work</option>
//                               <option value="other">Other</option>
//                             </select>
//                           </div>
//                         </div>
//                       </div>
//                     </div>

//                     {/* Account Stats */}
//                     <div>
//                       <h3 className="text-lg font-semibold text-base-content mb-4">
//                         Account Statistics
//                       </h3>
//                       <div className="stats stats-vertical lg:stats-horizontal shadow-lg bg-base-100 border border-base-200">
//                         <div className="stat">
//                           <div className="stat-figure text-primary">
//                             <Calendar className="w-8 h-8" />
//                           </div>
//                           <div className="stat-title text-base-content opacity-70">
//                             Account Age
//                           </div>
//                           <div className="stat-value text-primary text-2xl">
//                             {Math.floor(
//                               (Date.now() -
//                                 new Date(
//                                   currentUser?.created_at || ""
//                                 ).getTime()) /
//                                 (1000 * 60 * 60 * 24)
//                             )}{" "}
//                             days
//                           </div>
//                         </div>

//                         <div className="stat">
//                           <div className="stat-figure text-secondary">
//                             <User className="w-8 h-8" />
//                           </div>
//                           <div className="stat-title text-base-content opacity-70">
//                             Verification Status
//                           </div>
//                           <div className="stat-value text-secondary text-lg">
//                             {currentUser?.is_verified
//                               ? "Verified"
//                               : "Unverified"}
//                           </div>
//                           <div className="stat-desc text-base-content opacity-60">
//                             {currentUser?.is_verified
//                               ? "Account is verified"
//                               : "Account not verified"}
//                           </div>
//                         </div>
//                       </div>
//                     </div>

//                     {/* Save Button */}
//                     {isEditing && (
//                       <div className="card-actions justify-end">
//                         <Button
//                           type="submit"
//                           loading={isUpdating}
//                           variant="primary"
//                           size="lg"
//                           className="px-8"
//                         >
//                           Save Changes
//                         </Button>
//                       </div>
//                     )}
//                   </form>
//                 </div>
//               </div>
//             </div>
//           </motion.div>
//         </div>
//       </div>
//     </div>
//   );
// };
