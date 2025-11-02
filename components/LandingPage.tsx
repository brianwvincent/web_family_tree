import React, { useRef } from 'react';
import TreeIcon from './icons/TreeIcon';
import UploadIcon from './icons/UploadIcon';
import AddIcon from './icons/AddIcon';

interface LandingPageProps {
  onFileUpload: (file: File) => void;
  onStartManual: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onFileUpload, onStartManual }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-gray-100 font-sans p-4">
      <header className="text-center">
        <TreeIcon className="w-20 h-20 text-emerald-400 mx-auto mb-4" />
        <h1 className="text-4xl md:text-5xl font-bold text-white">Family Tree Builder</h1>
        <p className="mt-3 text-lg text-gray-400 max-w-2xl">
          Visualize your heritage. Start by uploading a CSV or add your family members one by one.
        </p>
      </header>

      <main className="mt-12 flex flex-col md:flex-row gap-6 items-start">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".csv"
          onChange={handleFileChange}
        />
        <div className="flex flex-col items-center">
          <button
            onClick={triggerFileSelect}
            className="flex flex-col items-center justify-center w-64 h-40 p-6 bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 hover:border-emerald-500 hover:text-white transition-all duration-300"
          >
            <UploadIcon className="w-10 h-10 mb-3" />
            <span className="text-xl font-semibold">Upload CSV File</span>
          </button>
          <p className="mt-2 text-xs text-gray-500 text-center w-64">
            File must be a CSV with "parent" and "child" columns.
          </p>
        </div>
        <button
          onClick={onStartManual}
          className="flex flex-col items-center justify-center w-64 h-40 p-6 bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 hover:border-indigo-500 hover:text-white transition-all duration-300"
        >
          <AddIcon className="w-10 h-10 mb-3" />
          <span className="text-xl font-semibold">Add Members Manually</span>
        </button>
      </main>

      <footer className="absolute bottom-6 text-center text-gray-500 text-sm">
        <p>An interactive way to explore your family history.</p>
      </footer>
    </div>
  );
};

export default LandingPage;