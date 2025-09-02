import React, { useState, useCallback } from 'react';
import { Upload, X, File, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  onFilesSelect: (files: File[]) => void;
  uploadedFiles?: any[];
  onRemoveFile?: (index: number) => void;
  title: string;
  description: string;
  maxSize?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  accept,
  multiple = false,
  onFilesSelect,
  uploadedFiles = [],
  onRemoveFile,
  title,
  description,
  maxSize = 10 * 1024 * 1024 // 10MB default
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string>('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const validateFiles = (files: FileList) => {
    const fileArray = Array.from(files);
    const oversizedFiles = fileArray.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      setError(`Files too large: ${oversizedFiles.map(f => f.name).join(', ')}. Max size: ${Math.round(maxSize / 1024 / 1024)}MB`);
      return false;
    }
    
    setError('');
    return true;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (validateFiles(e.dataTransfer.files)) {
        onFilesSelect(Array.from(e.dataTransfer.files));
      }
    }
  }, [onFilesSelect, maxSize]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (validateFiles(e.target.files)) {
        onFilesSelect(Array.from(e.target.files));
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
          dragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-4">{description}</p>
          
          <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors">
            <span>Choose Files</span>
            <input
              type="file"
              className="hidden"
              accept={accept}
              multiple={multiple}
              onChange={handleFileSelect}
            />
          </label>
          
          <p className="text-xs text-gray-500 mt-2">
            Max file size: {Math.round(maxSize / 1024 / 1024)}MB
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Uploaded Files:</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center">
                  <File className="h-5 w-5 text-gray-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {file.filename || file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                {onRemoveFile && (
                  <button
                    onClick={() => onRemoveFile(index)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};