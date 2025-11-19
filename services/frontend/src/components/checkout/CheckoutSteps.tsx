import { Check } from "lucide-react";

interface CheckoutStepsProps {
  currentStep: number;
  steps: string[];
}

export const CheckoutSteps: React.FC<CheckoutStepsProps> = ({
  currentStep,
  steps,
}) => {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  index < currentStep
                    ? "bg-primary border-primary text-primary-content"
                    : index === currentStep
                    ? "border-primary text-primary"
                    : "border-base-300 text-base-content/50"
                }`}
              >
                {index < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <div className="ml-3">
                <p
                  className={`text-sm font-medium ${
                    index <= currentStep
                      ? "text-base-content"
                      : "text-base-content/50"
                  }`}
                >
                  {step}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-16 h-0.5 mx-4 ${
                  index < currentStep ? "bg-primary" : "bg-base-300"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
