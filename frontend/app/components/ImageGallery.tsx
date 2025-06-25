"use client";

interface Image {
  key: string;
  lastModified: string;
  size: number;
  url: string;
}

interface ImageGalleryProps {
  images: Image[];
  uploadedImages: string[];
}

export default function ImageGallery({
  images,
  uploadedImages,
}: ImageGalleryProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getFileName = (key: string) => {
    return key.split("/").pop() || key;
  };

  const isRecentUpload = (key: string) => {
    const fileName = getFileName(key);
    return uploadedImages.some((uploaded) => fileName.includes(uploaded));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-black">Image Gallery</h3>
        <div className="text-sm text-black">
          {images.length} image{images.length !== 1 ? "s" : ""} in bucket
        </div>
      </div>

      {images.length === 0 ? (
        <div className="text-center py-12 text-black">
          <div className="text-4xl mb-4">🖼️</div>
          <p className="text-lg mb-2">No images yet</p>
          <p className="text-sm">Upload an image to see it here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image) => (
            <div
              key={image.key}
              className={`border rounded-lg overflow-hidden hover:shadow-md transition-shadow ${
                isRecentUpload(image.key)
                  ? "border-blue-300 bg-blue-50"
                  : "border-gray-200"
              }`}
            >
              <div className="aspect-square bg-gray-100 relative">
                {image.url ? (
                  <img
                    src={image.url}
                    alt={getFileName(image.key)}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src =
                        'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23f3f4f6"/><text x="100" y="100" text-anchor="middle" dy="0.3em" font-family="Arial" font-size="16" fill="%236b7280">Image not available</text></svg>';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <div className="text-4xl mb-2">⚠️</div>
                      <div className="text-sm">Unable to load image</div>
                    </div>
                  </div>
                )}
                {isRecentUpload(image.key) && (
                  <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    New
                  </div>
                )}
              </div>

              <div className="p-3">
                <h4 className="font-medium text-sm text-black truncate mb-1">
                  {getFileName(image.key)}
                </h4>
                <div className="text-xs text-black space-y-1">
                  <div>Size: {formatFileSize(image.size)}</div>
                  <div>Uploaded: {formatDate(image.lastModified)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h4 className="text-sm font-medium text-yellow-900 mb-2">
          Content Moderation Status:
        </h4>
        <div className="text-xs text-yellow-800 space-y-1">
          <p>• Images shown here have passed content moderation</p>
          <p>• Flagged content is automatically removed from the bucket</p>
          <p>• Check CloudWatch logs for detailed moderation results</p>
        </div>
      </div>
    </div>
  );
}
