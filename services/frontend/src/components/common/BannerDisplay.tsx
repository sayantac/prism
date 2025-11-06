import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../ui/Button";

interface Banner {
  id: string;
  image_base64: string;
  product_id?: string;
  product_category?: string;
  priority?: number;
}

interface BannerDisplayProps {
  banners: Banner[];
  className?: string;
  autoSlide?: boolean;
  slideInterval?: number;
}

export const BannerDisplay: React.FC<BannerDisplayProps> = ({
  banners,
  className = "",
  autoSlide = true,
  slideInterval = 5000,
}) => {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!autoSlide || banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, slideInterval);

    return () => clearInterval(interval);
  }, [banners.length, autoSlide, slideInterval]);

  if (!banners || banners.length === 0 || !isVisible) {
    return null;
  }

  const currentBannerData = banners[currentBanner];

  return (
    <div
      className={`relative w-full h-full rounded-lg overflow-hidden ${className}`}
    >
      <img
        src={`data:image/jpeg;base64,${currentBannerData.image_base64}`}
        alt="Personalized Banner"
        className="w-full h-full object-cover"
      />

      {/* Close Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 btn-circle bg-black/20 hover:bg-black/40 text-white"
        icon={<X className="w-4 h-4" />}
      />

      {/* Banner Indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentBanner(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentBanner ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
