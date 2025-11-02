
import React, { useState, useRef } from 'react';
import UploadIcon from './icons/UploadIcon';
import AddIcon from './icons/AddIcon';

interface ControlsProps {
  onFileUpload: (file: File) => void;
  onManualAdd: (child: string, parent: string | null) => void;
}

const Controls: React.FC<ControlsProps> = ({ onFileUpload, onManualAdd }) => {
  const [childName, setChildName] = useState('');
  const [parentName, setParentName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
    event.target.value = ''; // Reset file input
  };

  const handleManualAddSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (childName.trim()) {
      onManualAdd(childName.trim(), parentName.trim() || null);
      setChildName('');
      setParentName('');
    }
  };
  
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-200 mb-3">Upload CSV File</h2>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".csv"
          onChange={handleFileChange}
        />
        <button
          onClick={triggerFileSelect}
          className="w-full flex items-center justify-center px-4 py-3 bg-emerald-600/80 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-75"
        >
          <UploadIcon className="w-5 h-5 mr-2" />
          Select CSV File
        </button>
      </div>

      <div className="border-t border-gray-700/50 my-6"></div>
      
      <div>
        <h2 className="text-lg font-semibold text-gray-200 mb-3">Add Member Manually</h2>
        <form onSubmit={handleManualAddSubmit} className="space-y-4">
          <div>
            <label htmlFor="childName" className="block text-sm font-medium text-gray-400 mb-1">
              Child's Name
            </label>
            <input
              id="childName"
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="e.g., John Doe"
              required
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>
          <div>
            <label htmlFor="parentName" className="block text-sm font-medium text-gray-400 mb-1">
              Parent's Name (Optional)
            </label>
            <input
              id="parentName"
              type="text"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              placeholder="e.g., Jane Doe"
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>
          <button
            type="submit"
            className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold rounded-lg shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75 disabled:bg-gray-600 disabled:cursor-not-allowed"
            disabled={!childName.trim()}
          >
            <AddIcon className="w-5 h-5 mr-2" />
            Add Family Member
          </button>
        </form>
      </div>
    </div>
  );
};

export default Controls;
