/* eslint-disable @typescript-eslint/no-explicit-any */
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLoginMutation } from "../../store/api/authApi";
import { setCredentials } from "../../store/slices/authSlice";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface LoginFormData {
  username: string;
  password: string;
  rememberMe: boolean;
}

export const LoginForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [login, { isLoading, error }] = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const from = (location.state as any)?.from?.pathname || "/";

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await login({
        username: data.username,
        password: data.password,
      }).unwrap();

      dispatch(setCredentials(result));
      toast.success("Login successful!");
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error(error?.data?.detail || "Login failed. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-base-content">Welcome back</h2>
        <p className="mt-2 text-base-content/70">
          Sign in to your account to continue shopping
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Username/Email */}
        <Input
          label="Email or Username"
          type="text"
          placeholder="Enter your email or username"
          icon={<Mail className="w-5 h-5" />}
          error={errors.username?.message}
          {...register("username", {
            required: "Email or username is required",
          })}
        />

        {/* Password */}
        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            icon={<Lock className="w-5 h-5" />}
            error={errors.password?.message}
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters",
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

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              {...register("rememberMe")}
            />
            <span className="text-sm text-base-content/70">Remember me</span>
          </label>
          <Link
            to="/forgot-password"
            className="text-sm text-primary hover:text-primary-focus"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isLoading}
          className="w-full"
        >
          Sign In
        </Button>

        {/* Error Message */}
        {error && (
          <div className="alert alert-error">
            <span>
              {(error as any)?.data?.detail ||
                "Login failed. Please try again."}
            </span>
          </div>
        )}
      </form>

      {/* Sign Up Link */}
      <div className="text-center">
        <p className="text-base-content/70">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-primary hover:text-primary-focus font-medium"
          >
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
};
