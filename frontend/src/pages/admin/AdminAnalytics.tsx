import { Search, Brain, Target, Palette, Zap } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";

export const AdminAnalytics: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-base-content">Analytics</h1>
        <p className="text-base-content/70 mt-1">
          Detailed insights and reports
        </p>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <Search className="w-12 h-12 text-info mx-auto mb-4" />
            <h3 className="font-semibold">Search Enhancement</h3>
            <Badge variant="success" className="mt-2">
              Active
            </Badge>
          </div>
        </div>
      </div>

      {/* ML Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="font-semibold mb-4">Model Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Recommendation CTR</span>
                <span className="font-medium">24.8%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Conversion Rate</span>
                <span className="font-medium">12.3%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Model Accuracy</span>
                <span className="font-medium">89.2%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                icon={<Brain className="w-4 h-4" />}
              >
                Retrain Models
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                icon={<Target className="w-4 h-4" />}
              >
                Update Segments
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                icon={<Palette className="w-4 h-4" />}
              >
                Generate Banners
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                icon={<Zap className="w-4 h-4" />}
              >
                Test A/B Campaign
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Banner Management */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">AI-Generated Banners</h3>
            <Button variant="primary" icon={<Palette className="w-4 h-4" />}>
              Generate New Banner
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="relative group">
                <div className="aspect-video bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                  <span className="text-white font-medium">
                    Banner {index + 1}
                  </span>
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-sm">
                    CTR: {(Math.random() * 10 + 15).toFixed(1)}%
                  </span>
                  <Badge variant="success" size="sm">
                    Active
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
