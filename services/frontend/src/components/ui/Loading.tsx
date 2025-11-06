// src/components/ui/Loading.tsx
import { motion } from "framer-motion";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  // size = "md",
  text,
  fullScreen = false,
}) => {
  // const sizeClasses = {
  //   sm: "w-4 h-4",
  //   md: "w-8 h-8",
  //   lg: "w-12 h-12",
  // };

  const content = (
    <div className="flex flex-col items-center justify-center">
      {/* <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} /> */}
      <span className="loading loading-bars loading-xl text-primary"></span>
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-2 text-sm text-primary"
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-base-100 bg-opacity-75 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
};
