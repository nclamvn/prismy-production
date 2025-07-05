"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fromLang', 'auto');
      formData.append('toLang', 'vi');
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (response.ok) {
        if (result.mode === 'mvp') {
          alert(`✅ File processed successfully!\n\nDetected: ${result.detectedLanguage}\nOriginal: ${result.originalText}\nTranslated: ${result.translatedText}`);
        } else {
          alert(`File "${file.name}" uploaded successfully! Processing started.`);
        }
        console.log('Upload result:', result);
      } else {
        alert(`Upload failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Upload error: ${error}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      {/* Header */}
      <header className="mb-8">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">🚀 Prismy v2 - Upload</h1>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      {/* Upload Interface */}
      <main className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Upload Document</CardTitle>
              <CardDescription>
                Upload your document for translation. Supported formats: PDF, DOCX, TXT
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Drop Zone */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <div className="space-y-4">
                  <div className="text-4xl">📄</div>
                  <div>
                    <h3 className="text-lg font-semibold">Drop your file here</h3>
                    <p className="text-gray-600">or click to browse</p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button variant="outline" className="cursor-pointer">
                      Choose File
                    </Button>
                  </label>
                </div>
              </div>

              {/* Selected File Info */}
              {file && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900">Selected File:</h4>
                  <p className="text-blue-800">{file.name}</p>
                  <p className="text-blue-600 text-sm">
                    Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}

              {/* Translation Options */}
              <div className="space-y-4">
                <h4 className="font-semibold">Translation Options</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">From</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                      <option value="auto">Auto-detect</option>
                      <option value="en">English</option>
                      <option value="vi">Vietnamese</option>
                      <option value="fr">French</option>
                      <option value="es">Spanish</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">To</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                      <option value="vi">Vietnamese</option>
                      <option value="en">English</option>
                      <option value="fr">French</option>
                      <option value="es">Spanish</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Upload Button */}
              <Button 
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full"
                size="lg"
              >
                {uploading ? "Uploading..." : "Start Translation"}
              </Button>

              {/* Status */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">✅ Processing Pipeline Active</h4>
                <p className="text-green-700 text-sm">
                  Full processing pipeline is now active: File Upload → OCR → Translation → Document Rebuild
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}