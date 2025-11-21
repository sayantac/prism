import { twMerge } from "tailwind-merge";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  variant?: "bordered" | "lifted" | "boxed";
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = "",
  variant = "bordered",
}) => {
  const baseClasses = "tabs w-full";

  const variantClasses = {
    bordered: "tabs-bordered",
    lifted: "tabs-lifted",
    boxed: "tabs-boxed",
  };

  return (
    <div className={twMerge(baseClasses, variantClasses[variant], className)}>
      {tabs.map((tab) => (
        <button
          type="button"
          key={tab.id}
          className={`tab tab-lg ${activeTab === tab.id ? "tab-active" : ""}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.icon && <span className="mr-2">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
};
