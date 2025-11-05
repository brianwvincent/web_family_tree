import React, { useState, useEffect, useRef } from 'react';
import CloseIcon from './icons/CloseIcon';
import DownloadIcon from './icons/DownloadIcon';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  svgString: string;
  originalWidth: number;
  originalHeight: number;
  onDownload: (format: 'svg' | 'png' | 'pdf', width: number, height: number) => void;
}

interface SizeOption {
  name: string;
  width: number;
  height: number;
  unit: string;
  category: 'document' | 'poster' | 'digital' | 'original';
}

const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  svgString,
  originalWidth,
  originalHeight,
  onDownload,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const sizeOptions: SizeOption[] = [
    // Original
    { name: 'Original', width: originalWidth, height: originalHeight, unit: 'px', category: 'original' },
    
    // Document Sizes - Portrait
    { name: 'Letter (8.5" × 11")', width: 2550, height: 3300, unit: 'px', category: 'document' },
    { name: 'A4 (210mm × 297mm)', width: 2480, height: 3508, unit: 'px', category: 'document' },
    { name: 'Legal (8.5" × 14")', width: 2550, height: 4200, unit: 'px', category: 'document' },
    { name: 'Tabloid (11" × 17")', width: 3300, height: 5100, unit: 'px', category: 'document' },
    { name: 'A3 (297mm × 420mm)', width: 3508, height: 4961, unit: 'px', category: 'document' },
    
    // Document Sizes - Landscape
    { name: 'Letter Landscape (11" × 8.5")', width: 3300, height: 2550, unit: 'px', category: 'document' },
    { name: 'A4 Landscape (297mm × 210mm)', width: 3508, height: 2480, unit: 'px', category: 'document' },
    { name: 'Legal Landscape (14" × 8.5")', width: 4200, height: 2550, unit: 'px', category: 'document' },
    { name: 'Tabloid Landscape (17" × 11")', width: 5100, height: 3300, unit: 'px', category: 'document' },
    { name: 'A3 Landscape (420mm × 297mm)', width: 4961, height: 3508, unit: 'px', category: 'document' },
    
    // Poster Sizes
    { name: 'Small Poster (18" × 24")', width: 5400, height: 7200, unit: 'px', category: 'poster' },
    { name: 'Medium Poster (24" × 36")', width: 7200, height: 10800, unit: 'px', category: 'poster' },
    { name: 'Large Poster (27" × 40")', width: 8100, height: 12000, unit: 'px', category: 'poster' },
    { name: 'Movie Poster (27" × 41")', width: 8100, height: 12300, unit: 'px', category: 'poster' },
    
    // Digital Sizes
    { name: 'HD (1920 × 1080)', width: 1920, height: 1080, unit: 'px', category: 'digital' },
    { name: '4K (3840 × 2160)', width: 3840, height: 2160, unit: 'px', category: 'digital' },
    { name: 'Square (12" × 12")', width: 3600, height: 3600, unit: 'px', category: 'digital' },
  ];

  const [selectedCategory, setSelectedCategory] = useState<'document' | 'poster' | 'digital' | 'original'>('document');

  const [selectedSize, setSelectedSize] = useState<SizeOption>(sizeOptions[1]); // Default to Letter
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const filteredOptions = selectedCategory === 'original' 
    ? sizeOptions.filter(opt => opt.category === 'original')
    : sizeOptions.filter(opt => opt.category === selectedCategory);

  const categoryLabels = {
    original: 'Original',
    document: 'Documents',
    poster: 'Posters',
    digital: 'Digital',
  };

  useEffect(() => {
    if (!isOpen || !svgString) return;

    const generatePreview = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size to selected dimensions
      canvas.width = selectedSize.width;
      canvas.height = selectedSize.height;

      // Fill with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        // Calculate scaling to fit the tree within the canvas with padding
        const padding = 40;
        const availableWidth = canvas.width - padding * 2;
        const availableHeight = canvas.height - padding * 2;
        
        const scaleX = availableWidth / originalWidth;
        const scaleY = availableHeight / originalHeight;
        const scale = Math.min(scaleX, scaleY);
        
        const scaledWidth = originalWidth * scale;
        const scaledHeight = originalHeight * scale;
        
        // Center the image
        const x = (canvas.width - scaledWidth) / 2;
        const y = (canvas.height - scaledHeight) / 2;
        
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        
        // Create preview URL
        const dataUrl = canvas.toDataURL('image/png');
        setPreviewUrl(dataUrl);
        
        URL.revokeObjectURL(url);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
      };

      img.src = url;
    };

    generatePreview();
  }, [isOpen, svgString, selectedSize, originalWidth, originalHeight]);

  if (!isOpen) return null;

  const handleDownload = (format: 'svg' | 'png' | 'pdf') => {
    onDownload(format, selectedSize.width, selectedSize.height);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-5xl m-4 border border-gray-700/50 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700/50">
          <h2 className="text-2xl font-bold text-white">Print Preview & Export</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-500 hover:bg-gray-700 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Size Selection */}
            <div className="lg:col-span-1">
              <h3 className="text-lg font-semibold text-white mb-4">Select Size</h3>
              
              {/* Category Tabs */}
              <div className="flex flex-wrap gap-2 mb-4">
                {(['original', 'document', 'poster', 'digital'] as const).map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedCategory === category
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {categoryLabels[category]}
                  </button>
                ))}
              </div>
              
              {/* Size Options */}
              <div className="space-y-2">
                {filteredOptions.map((option) => (
                  <button
                    key={option.name}
                    onClick={() => setSelectedSize(option)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                      selectedSize.name === option.name
                        ? 'bg-emerald-600 text-white font-semibold'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-medium">{option.name}</div>
                    <div className="text-sm opacity-75">
                      {option.width} × {option.height} {option.unit}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column - Preview */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700/50">
                {previewUrl ? (
                  <div className="flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full max-h-[500px] object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[500px] text-gray-500">
                    Generating preview...
                  </div>
                )}
              </div>
              
              {/* Selected Size Info */}
              <div className="mt-4 p-3 bg-gray-700/30 rounded-lg text-sm text-gray-400">
                <strong className="text-gray-300">Selected:</strong> {selectedSize.name} ({selectedSize.width} × {selectedSize.height} px)
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Download Buttons */}
        <div className="border-t border-gray-700/50 p-6 bg-gray-800/50">
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600/80 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDownload('svg')}
              className="flex items-center px-6 py-2 bg-sky-600/80 hover:bg-sky-600 text-white font-semibold rounded-lg transition-all"
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              SVG
            </button>
            <button
              onClick={() => handleDownload('png')}
              className="flex items-center px-6 py-2 bg-purple-600/80 hover:bg-purple-600 text-white font-semibold rounded-lg transition-all"
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              PNG
            </button>
            <button
              onClick={() => handleDownload('pdf')}
              className="flex items-center px-6 py-2 bg-red-600/80 hover:bg-red-600 text-white font-semibold rounded-lg transition-all"
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              PDF
            </button>
          </div>
        </div>

        {/* Hidden canvas for generating preview */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default PrintPreviewModal;
