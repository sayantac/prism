import { motion } from "framer-motion";
import { RegisterForm } from "../../components/auth/RegisterForm";

export const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content rounded-lg w-12">
                <span className="text-xl font-bold">S</span>
              </div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card bg-base-100 shadow-xl"
        >
          <div className="card-body">
            <RegisterForm />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
// // src/pages/auth/RegisterPage.tsx - Updated for new API structure
// import { motion } from "framer-motion";
// import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
// import { useState } from "react";
// import { useForm } from "react-hook-form";
// import { Link, useNavigate } from "react-router-dom";
// import { Button } from "../../components/ui/Button";
// import { Input } from "../../components/ui/Input";
// import { useRegisterMutation } from "../../store/api/authApi";

// interface RegisterForm {
//   email: string;
//   password: string;
//   confirmPassword: string;
//   first_name: string;
//   last_name: string;
//   terms: boolean;
// }

// export const RegisterPage: React.FC = () => {
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const navigate = useNavigate();

//   const [register, { isLoading, error }] = useRegisterMutation();

//   const {
//     register: registerField,
//     handleSubmit,
//     formState: { errors },
//     watch,
//     setError,
//   } = useForm<RegisterForm>();

//   const password = watch("password");

//   const onSubmit = async (data: RegisterForm) => {
//     if (data.password !== data.confirmPassword) {
//       setError("confirmPassword", {
//         type: "manual",
//         message: "Passwords do not match",
//       });
//       return;
//     }

//     try {
//       // Updated to match new API structure
//       const result = await register({
//         email: data.email,
//         password: data.password,
//         first_name: data.first_name,
//         last_name: data.last_name,
//       }).unwrap();

//       navigate("/login", {
//         state: {
//           message: "Account created successfully! Please sign in.",
//           email: data.email,
//         },
//       });
//     } catch (error) {
//       console.error("Registration failed:", error);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-base-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-md w-full space-y-8">
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="text-center"
//         >
//           <div className="flex justify-center mb-6">
//             <div className="avatar placeholder">
//               <div className="bg-primary text-primary-content rounded-lg w-12">
//                 <span className="text-xl font-bold">S</span>
//               </div>
//             </div>
//           </div>
//           <h2 className="text-3xl font-bold text-base-content">
//             Create account
//           </h2>
//           <p className="mt-2 text-base-content opacity-70">
//             Join us and start shopping
//           </p>
//         </motion.div>

//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.1 }}
//           className="card bg-base-100 shadow-xl"
//         >
//           <div className="card-body">
//             {error && (
//               <div className="alert alert-error">
//                 <span>
//                   {(error as any)?.data?.detail ||
//                     "Registration failed. Please try again."}
//                 </span>
//               </div>
//             )}

//             <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//               <div className="grid grid-cols-2 gap-4">
//                 <Input
//                   label="First Name"
//                   type="text"
//                   icon={<User className="w-4 h-4" />}
//                   error={errors.first_name?.message}
//                   {...registerField("first_name", {
//                     required: "First name is required",
//                     minLength: {
//                       value: 2,
//                       message: "First name must be at least 2 characters",
//                     },
//                   })}
//                 />

//                 <Input
//                   label="Last Name"
//                   type="text"
//                   icon={<User className="w-4 h-4" />}
//                   error={errors.last_name?.message}
//                   {...registerField("last_name", {
//                     required: "Last name is required",
//                     minLength: {
//                       value: 2,
//                       message: "Last name must be at least 2 characters",
//                     },
//                   })}
//                 />
//               </div>

//               <Input
//                 label="Email"
//                 type="email"
//                 icon={<Mail className="w-4 h-4" />}
//                 error={errors.email?.message}
//                 {...registerField("email", {
//                   required: "Email is required",
//                   pattern: {
//                     value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
//                     message: "Invalid email address",
//                   },
//                 })}
//               />

//               <div className="relative">
//                 <Input
//                   label="Password"
//                   type={showPassword ? "text" : "password"}
//                   icon={<Lock className="w-4 h-4" />}
//                   iconPosition="left"
//                   error={errors.password?.message}
//                   {...registerField("password", {
//                     required: "Password is required",
//                     minLength: {
//                       value: 8,
//                       message: "Password must be at least 8 characters",
//                     },
//                   })}
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-3 top-8 text-base-content opacity-60 hover:opacity-100 transition-opacity"
//                 >
//                   {showPassword ? (
//                     <EyeOff className="w-4 h-4" />
//                   ) : (
//                     <Eye className="w-4 h-4" />
//                   )}
//                 </button>
//               </div>

//               <div className="relative">
//                 <Input
//                   label="Confirm Password"
//                   type={showConfirmPassword ? "text" : "password"}
//                   icon={<Lock className="w-4 h-4" />}
//                   iconPosition="left"
//                   error={errors.confirmPassword?.message}
//                   {...registerField("confirmPassword", {
//                     required: "Please confirm your password",
//                     validate: (value) =>
//                       value === password || "Passwords do not match",
//                   })}
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                   className="absolute right-3 top-8 text-base-content opacity-60 hover:opacity-100 transition-opacity"
//                 >
//                   {showConfirmPassword ? (
//                     <EyeOff className="w-4 h-4" />
//                   ) : (
//                     <Eye className="w-4 h-4" />
//                   )}
//                 </button>
//               </div>

//               <div className="flex items-center">
//                 <label className="label cursor-pointer justify-start gap-2">
//                   <input
//                     type="checkbox"
//                     className="checkbox checkbox-primary checkbox-sm"
//                     {...registerField("terms", {
//                       required: "You must accept the terms and conditions",
//                     })}
//                   />
//                   <span className="label-text text-base-content text-sm">
//                     I agree to the{" "}
//                     <Link to="/terms" className="link link-primary">
//                       Terms and Conditions
//                     </Link>{" "}
//                     and{" "}
//                     <Link to="/privacy" className="link link-primary">
//                       Privacy Policy
//                     </Link>
//                   </span>
//                 </label>
//               </div>
//               {errors.terms && (
//                 <p className="text-error text-sm">{errors.terms.message}</p>
//               )}

//               <Button
//                 type="submit"
//                 loading={isLoading}
//                 variant="primary"
//                 size="lg"
//                 block
//               >
//                 Create Account
//               </Button>
//             </form>

//             <div className="divider text-base-content opacity-50">OR</div>

//             <div className="text-center">
//               <p className="text-sm text-base-content opacity-70">
//                 Already have an account?{" "}
//                 <Link to="/login" className="link link-primary font-medium">
//                   Sign in
//                 </Link>
//               </p>
//             </div>
//           </div>
//         </motion.div>
//       </div>
//     </div>
//   );
// };
