import React, { useState, useRef } from 'react';
import Editor from 'react-simple-wysiwyg';
import { Button } from '../ui/button';
import { Image, Upload, X, Loader2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  label?: string;
}

const ImageUploadEditor: React.FC<ImageUploadEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter text with formatting...",
  minHeight = "100px",
  label
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      console.log('🔄 Starting image upload...', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      // Create a unique filename with sanitized name
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `questions/${timestamp}_${sanitizedName}`;
      
      console.log('📁 Upload path:', fileName);
      
      const storageRef = ref(storage, fileName);

      // Upload file to Firebase Storage with metadata
      console.log('⬆️ Uploading to Firebase Storage...');
      
      const metadata = {
        contentType: file.type,
        customMetadata: {
          'uploadedBy': 'admin',
          'uploadedAt': new Date().toISOString()
        }
      };
      
      const snapshot = await uploadBytes(storageRef, file, metadata);
      console.log('✅ Upload successful, getting download URL...');
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('🔗 Download URL obtained:', downloadURL);

      // Insert image into editor
      const imageHtml = `<img src="${downloadURL}" alt="Question Image" style="max-width: 100%; height: auto; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />`;
      
      // Add image to current content
      const newContent = value + imageHtml;
      onChange(newContent);

      toast({
        title: "Success! 🎉",
        description: "Image uploaded successfully",
      });

    } catch (error: any) {
      console.error('❌ Error uploading image:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        serverResponse: error.serverResponse
      });
      
      let errorMessage = "Failed to upload image. Please try again.";
      
      if (error.code === 'storage/unauthorized') {
        errorMessage = "Upload permission denied. Please check Firebase Storage rules.";
      } else if (error.code === 'storage/canceled') {
        errorMessage = "Upload was canceled.";
      } else if (error.code === 'storage/unknown') {
        errorMessage = "Unknown error occurred. Please check your internet connection.";
      } else if (error.message?.includes('CORS')) {
        errorMessage = "CORS error. Please check Firebase Storage configuration.";
      }

      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    // Reset input value so same file can be selected again
    event.target.value = '';
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={triggerFileSelect}
              disabled={isUploading}
              variant="outline"
              size="sm"
              className="text-blue-600 hover:bg-blue-50 border-blue-200"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Image className="w-4 h-4 mr-2" />
                  Add Image
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <div className="relative">
        <div className="border border-gray-300 rounded-md overflow-hidden">
          <Editor
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            containerProps={{
              style: { minHeight, border: 'none' }
            }}
          />
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-md">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Uploading image...</p>
              {uploadProgress > 0 && (
                <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Help text */}
      <div className="text-xs text-gray-500 flex items-center gap-4">
        <span>💡 Tip: You can add images to enhance your questions and explanations</span>
        <span>📏 Max size: 5MB</span>
        <span>🖼️ Formats: JPG, PNG, GIF, WebP</span>
      </div>
    </div>
  );
};

export default ImageUploadEditor;