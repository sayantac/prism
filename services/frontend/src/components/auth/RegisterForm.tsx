/* eslint-disable @typescript-eslint/no-explicit-any */
import { Eye, EyeOff, Lock, Mail, MapPin, Phone, User } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  useCheckUsernameMutation,
  useRegisterMutation,
} from "../../store/api/authApi";
import { setCredentials } from "../../store/slices/authSlice";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  first_name: string;
  last_name: string;
  username: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    apartment?: string;
    address_type: string;
  };
  agreeToTerms: boolean;
}

export const RegisterForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [register, { isLoading }] = useRegisterMutation();
  const [checkUsername] = useCheckUsernameMutation();

  const {
    register: registerField,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const password = watch("password");

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const result = await register({
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        username: data.username,
        phone: data.phone,
        address: {
          ...data.address,
          address_type: "home",
        },
      }).unwrap();

      toast.success("Account created successfully!");

      // Auto-login after registration
      dispatch(
        setCredentials({
          access_token: result.access_token || "",
          user: result,
        })
      );

      navigate("/");
    } catch (error: any) {
      toast.error(
        error?.data?.detail || "Registration failed. Please try again."
      );
    }
  };

  const nextStep = async () => {
    const fieldsToValidate =
      currentStep === 1
        ? ["email", "password", "confirmPassword", "first_name", "last_name"]
        : ["username", "phone"];

    const isValid = await trigger(fieldsToValidate as any);
    if (isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-base-content">Create Account</h2>
        <p className="mt-2 text-base-content/70">
          Join us and start your shopping journey
        </p>
      </div>

      {/* Progress Steps */}
      <div className="steps steps-horizontal w-full">
        <div className={`step ${currentStep >= 1 ? "step-primary" : ""}`}>
          Basic Info
        </div>
        <div className={`step ${currentStep >= 2 ? "step-primary" : ""}`}>
          Profile
        </div>
        <div className={`step ${currentStep >= 3 ? "step-primary" : ""}`}>
          Address
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                type="text"
                placeholder="John"
                icon={<User className="w-5 h-5" />}
                error={errors.first_name?.message}
                {...registerField("first_name", {
                  required: "First name is required",
                })}
              />
              <Input
                label="Last Name"
                type="text"
                placeholder="Doe"
                icon={<User className="w-5 h-5" />}
                error={errors.last_name?.message}
                {...registerField("last_name", {
                  required: "Last name is required",
                })}
              />
            </div>

            <Input
              label="Email"
              type="email"
              placeholder="john@example.com"
              icon={<Mail className="w-5 h-5" />}
              error={errors.email?.message}
              {...registerField("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                icon={<Lock className="w-5 h-5" />}
                error={errors.password?.message}
                {...registerField("password", {
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters",
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message:
                      "Password must contain uppercase, lowercase and number",
                  },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-base-content/60 hover:text-base-content"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                icon={<Lock className="w-5 h-5" />}
                error={errors.confirmPassword?.message}
                {...registerField("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (value) =>
                    value === password || "Passwords do not match",
                })}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-9 text-base-content/60 hover:text-base-content"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Profile Information */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <Input
              label="Username"
              type="text"
              placeholder="johndoe"
              icon={<User className="w-5 h-5" />}
              error={errors.username?.message}
              {...registerField("username", {
                required: "Username is required",
                minLength: {
                  value: 3,
                  message: "Username must be at least 3 characters",
                },
                pattern: {
                  value: /^[a-zA-Z0-9_]+$/,
                  message:
                    "Username can only contain letters, numbers, and underscores",
                },
              })}
            />

            <Input
              label="Phone Number"
              type="tel"
              placeholder="+1 (555) 123-4567"
              icon={<Phone className="w-5 h-5" />}
              error={errors.phone?.message}
              {...registerField("phone", {
                required: "Phone number is required",
                pattern: {
                  value: /^\+?[\d\s\-\\(\\)]+$/,
                  message: "Invalid phone number format",
                },
              })}
            />
          </div>
        )}

        {/* Step 3: Address Information */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <Input
              label="Street Address"
              type="text"
              placeholder="123 Main Street"
              icon={<MapPin className="w-5 h-5" />}
              error={errors.address?.street?.message}
              {...registerField("address.street", {
                required: "Street address is required",
              })}
            />

            <Input
              label="Apartment (Optional)"
              type="text"
              placeholder="Apt 4B"
              {...registerField("address.apartment")}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="City"
                type="text"
                placeholder="New York"
                error={errors.address?.city?.message}
                {...registerField("address.city", {
                  required: "City is required",
                })}
              />
              <Input
                label="State"
                type="text"
                placeholder="NY"
                error={errors.address?.state?.message}
                {...registerField("address.state", {
                  required: "State is required",
                })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="ZIP Code"
                type="text"
                placeholder="10001"
                error={errors.address?.zip_code?.message}
                {...registerField("address.zip_code", {
                  required: "ZIP code is required",
                })}
              />
              <Input
                label="Country"
                type="text"
                placeholder="US"
                error={errors.address?.country?.message}
                {...registerField("address.country", {
                  required: "Country is required",
                })}
              />
            </div>

            <label className="flex items-start space-x-2 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-sm mt-1"
                {...registerField("agreeToTerms", {
                  required: "You must agree to the terms and conditions",
                })}
              />
              <span className="text-sm text-base-content/70">
                I agree to the{" "}
                <Link
                  to="/terms"
                  className="text-primary hover:text-primary-focus"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="text-primary hover:text-primary-focus"
                >
                  Privacy Policy
                </Link>
              </span>
            </label>
            {errors.agreeToTerms && (
              <p className="text-error text-sm">
                {errors.agreeToTerms.message}
              </p>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex space-x-4">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              className="flex-1"
            >
              Previous
            </Button>
          )}

          {currentStep < 3 ? (
            <Button
              type="button"
              variant="primary"
              onClick={nextStep}
              className="flex-1"
            >
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              className="flex-1"
            >
              Create Account
            </Button>
          )}
        </div>
      </form>

      {/* Sign In Link */}
      <div className="text-center">
        <p className="text-base-content/70">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary hover:text-primary-focus font-medium"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};
