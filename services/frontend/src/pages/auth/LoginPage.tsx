import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { LoginForm } from "../../components/auth/LoginForm";

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <img 
              src="/logo.png" 
              alt="PRISM Logo" 
              className="h-16 w-auto"
            />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card bg-base-100 shadow-xl"
        >
          <div className="card-body">
            <LoginForm />
          </div>
        </motion.div>

        <div className="text-center mt-4">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-base-content/70 hover:text-base-content transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

// // src/pages/auth/LoginPage.tsx - Updated for new API structure
// import { motion } from "framer-motion";
// import { Eye, EyeOff, Lock, Mail } from "lucide-react";
// import { useState } from "react";
// import { useForm } from "react-hook-form";
// import { useDispatch } from "react-redux";
// import { Link, useLocation, useNavigate } from "react-router-dom";
// import { Button } from "../../components/ui/Button";
// import { Input } from "../../components/ui/Input";
// import { useLoginMutation } from "../../store/api/authApi";
// import { setCredentials } from "../../store/slices/authSlice";

// interface LoginForm {
//   username: string;
//   password: string;
//   rememberMe: boolean;
// }

// export const LoginPage: React.FC = () => {
//   const [showPassword, setShowPassword] = useState(false);
//   const navigate = useNavigate();
//   const location = useLocation();
//   const dispatch = useDispatch();

//   const [login, { isLoading, error }] = useLoginMutation();

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm<LoginForm>();

//   const from = (location.state as any)?.from?.pathname || "/products";

//   const onSubmit = async (data: LoginForm) => {
//     try {
//       const result = await login({
//         username: data.username,
//         password: data.password,
//       }).unwrap();

//       // Updated to handle new API response structure
//       dispatch(
//         setCredentials({
//           access_token: result.access_token,
//           token_type: result.token_type,
//           expires_in: result.expires_in,
//           user: null, // User data will be fetched separately via profile endpoint
//         })
//       );

//       navigate(from, { replace: true });
//     } catch (error) {
//       console.error("Login failed:", error);
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
//           <h2 className="text-3xl font-bold text-base-content">Welcome back</h2>
//           <p className="mt-2 text-base-content opacity-70">
//             Sign in to your account
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
//                     "Login failed. Please try again."}
//                 </span>
//               </div>
//             )}

//             <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//               <Input
//                 label="Email or Username"
//                 type="text"
//                 icon={<Mail className="w-4 h-4" />}
//                 error={errors.username?.message}
//                 {...register("username", {
//                   required: "Email or username is required",
//                 })}
//               />

//               <div className="relative">
//                 <Input
//                   label="Password"
//                   type={showPassword ? "text" : "password"}
//                   icon={<Lock className="w-4 h-4" />}
//                   iconPosition="left"
//                   error={errors.password?.message}
//                   {...register("password", {
//                     required: "Password is required",
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

//               <div className="flex items-center justify-between">
//                 <label className="label cursor-pointer justify-start gap-2">
//                   <input
//                     type="checkbox"
//                     className="checkbox checkbox-primary checkbox-sm"
//                     {...register("rememberMe")}
//                   />
//                   <span className="label-text text-base-content">
//                     Remember me
//                   </span>
//                 </label>
//                 <Link
//                   to="/forgot-password"
//                   className="link link-primary text-sm"
//                 >
//                   Forgot password?
//                 </Link>
//               </div>

//               <Button
//                 type="submit"
//                 loading={isLoading}
//                 variant="primary"
//                 size="lg"
//                 block
//               >
//                 Sign In
//               </Button>
//             </form>

//             <div className="divider text-base-content opacity-50">OR</div>

//             <div className="text-center">
//               <p className="text-sm text-base-content opacity-70">
//                 Don't have an account?{" "}
//                 <Link
//                   to="/register"
//                   state={{ from: location.state?.from }}
//                   className="link link-primary font-medium"
//                 >
//                   Sign up
//                 </Link>
//               </p>
//             </div>
//           </div>
//         </motion.div>
//       </div>
//     </div>
//   );
// };
