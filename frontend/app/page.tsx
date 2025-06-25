"use client";

import { useState, useEffect } from "react";
import ImageGallery from "./components/ImageGallery";
import ImageUpload from "./components/ImageUpload";

const API_BASE_URL = "https://d65hgw11w7.execute-api.eu-west-1.amazonaws.com/dev";

interface Image {
  key: string;
  lastModified: string;
  size: number;
  url: string;
}

export default function Home() {
  const [images, setImages] = useState<Image[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const fetchImages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/images`);
      const data = await response.json();
      setImages(data.images || []);
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  };

  useEffect(() => {
    fetchImages();

    // Poll for images every 30 seconds
    const imageInterval = setInterval(fetchImages, 300000);

    return () => {
      clearInterval(imageInterval);
    };
  }, []);

  const handleUploadSuccess = (fileName: string) => {
    setUploadedImages((prev) => [...prev, fileName]);
    // Fetch updated images list after upload
    setTimeout(fetchImages, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black mb-4">
            AWS Content Moderation Pipeline Demo
          </h1>
          <p className="text-lg text-black max-w-3xl mx-auto">
            Upload images to test the automated content moderation system using
            AWS Rekognition and Lambda. Inappropriate content will be
            automatically detected and removed.
          </p>
        </div>

        {/* Architecture Overview */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-black">
            Pipeline Architecture
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="bg-blue-100 p-4 rounded-lg">
              <div className="text-2xl mb-2">📤</div>
              <div className="font-semibold text-black">Upload</div>
              <div className="text-sm text-black">S3 Bucket</div>
            </div>
            <div className="bg-yellow-100 p-4 rounded-lg">
              <div className="text-2xl mb-2">📬</div>
              <div className="font-semibold text-black">Queue</div>
              <div className="text-sm text-black">SQS</div>
            </div>
            <div className="bg-green-100 p-4 rounded-lg">
              <div className="text-2xl mb-2">⚡</div>
              <div className="font-semibold text-black">Process</div>
              <div className="text-sm text-black">Lambda</div>
            </div>
            <div className="bg-purple-100 p-4 rounded-lg">
              <div className="text-2xl mb-2">🔍</div>
              <div className="font-semibold text-black">Analyze</div>
              <div className="text-sm text-black">Rekognition</div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="lg:col-span-1">
          <ImageUpload
            apiBaseUrl={API_BASE_URL}
            onUploadSuccess={handleUploadSuccess}
          />
        </div>

        {/* Pipeline Status */}

        {/* Image Gallery */}
        <div className="mt-12">
          <ImageGallery images={images} uploadedImages={uploadedImages} />
        </div>
      </div>
    </div>
  );
}
