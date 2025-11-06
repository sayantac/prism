import { ChevronLeft, ChevronRight, Package, ZoomIn } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { twMerge } from "tailwind-merge";

interface ImageGalleryProps {
  images: string[];
  alt: string;
  className?: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  alt,
  className = "",
}) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!images || images.length === 0) {
    return (
      <div
        className={twMerge(
          "bg-base-200 rounded-lg flex items-center justify-center h-64",
          className
        )}
      >
        <Package className="w-16 h-16 text-base-content/30" />
      </div>
    );
  }

  return (
    <div className={twMerge("space-y-4", className)}>
      {/* Main Image */}
      <div className="relative">
        <img
          src={images[currentImage]}
          alt={alt}
          className="w-full h-64 md:h-96 object-cover rounded-lg"
        />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={prevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 btn-circle bg-base-100/80 hover:bg-base-100"
              icon={<ChevronLeft className="w-4 h-4" />}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 btn-circle bg-base-100/80 hover:bg-base-100"
              icon={<ChevronRight className="w-4 h-4" />}
            />
          </>
        )}

        {/* Zoom Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsZoomed(true)}
          className="absolute top-2 right-2 btn-circle bg-base-100/80 hover:bg-base-100"
          icon={<ZoomIn className="w-4 h-4" />}
        />

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
            {currentImage + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {images.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentImage(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                index === currentImage
                  ? "border-primary"
                  : "border-transparent hover:border-base-300"
              }`}
            >
              <img
                src={image}
                alt={`${alt} ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Zoom Modal */}
      <Modal
        isOpen={isZoomed}
        onClose={() => setIsZoomed(false)}
        size="xl"
        className="max-w-4xl"
      >
        <img
          src={images[currentImage]}
          alt={alt}
          className="w-full h-auto max-h-[80vh] object-contain"
        />
      </Modal>
    </div>
  );
};
