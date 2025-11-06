import { Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "../../ui/Button";

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onChange,
  maxImages = 5,
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList) => {
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // In a real implementation, you would upload to your server/cloud storage
        // For now, we'll create object URLs (not recommended for production)
        return URL.createObjectURL(file);
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const newImages = [...images, ...uploadedUrls].slice(0, maxImages);
      onChange(newImages);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {images.map((image, index) => (
          <div key={index} className="relative group">
            <div className="aspect-square rounded-lg overflow-hidden bg-base-200">
              <img
                src={image}
                alt={`Product image ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            <Button
              type="button"
              variant="error"
              size="sm"
              shape="square"
              className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removeImage(index)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}

        {images.length < maxImages && (
          <Button
            type="button"
            variant="outline"
            className="aspect-square border-dashed flex-col gap-2"
            onClick={triggerFileInput}
            loading={uploading}
          >
            <Plus className="w-8 h-8" />
            <span className="text-sm">Add Image</span>
          </Button>
        )}
      </div>

      <p className="text-sm text-base-content/60">
        {images.length}/{maxImages} images uploaded. Supported formats: JPG,
        PNG, WebP
      </p>
    </div>
  );
};
